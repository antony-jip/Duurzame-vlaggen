import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";

import type { OrderRow, OrderItemRow } from "@/lib/db/types";
import { getProduct } from "@/lib/catalog/products";
import { getSize, sizeAreaM2 } from "@/lib/pricing/local-catalog";

/**
 * Materiaalpaspoort / duurzaamheidsrapport (PDF).
 *
 * Bouwt uit een order + regels een A4-PDF in de huisstijl (forest/terracotta)
 * met: kop + ordergegevens, de bestelde producten met materiaal, de
 * duurzaamheidskerncijfers, een INDICATIEVE CO2-schatting en een korte
 * CSRD/ESRS-toelichting. Bewust robuust gehouden: alleen standaard PDF-fonts
 * (Helvetica) en één optioneel logo — faalt het logo, dan valt de kop terug op
 * tekst. Geen externe fonts/afbeeldingen die de order-flow kunnen breken.
 *
 * Kernbelofte van de site: "CO2- en materiaalpaspoort bij elke bestelling".
 */

// Huisstijl (zie AGENTS.md): forest, terracotta, off-white.
const FOREST: RGB = rgb(0x2c / 255, 0x5f / 255, 0x4f / 255);
const TERRACOTTA: RGB = rgb(0xc6 / 255, 0x6b / 255, 0x4e / 255);
const OFFWHITE: RGB = rgb(0xf7 / 255, 0xf5 / 255, 0xf2 / 255);
const INK: RGB = rgb(0.13, 0.14, 0.13);
const MUTED: RGB = rgb(0.42, 0.44, 0.42);
const WHITE: RGB = rgb(1, 1, 1);

// A4 in punten.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

/**
 * INDICATIEVE CO2-factor: geschatte kg CO2e per m² geprint Flag-CiCLO®-doek
 * (productie + waterloze print, cradle-to-gate). Bewust conservatief en als
 * "indicatief" gemarkeerd — geen geverifieerde LCA. Stem exacte factor later af.
 */
const CO2_PER_M2_KG = 2.4;
/** Indicatieve CO2e voor één aluminium vlaggenmast (productie, indicatief). */
const CO2_PER_MAST_KG = 45;

interface PassportLine {
  productLabel: string;
  sizeLabel: string;
  amount: number;
  material: string;
  /** m² per stuk, indien afleidbaar uit de catalogus (voor CO2-schatting). */
  areaM2PerUnit: number | null;
  isMast: boolean;
}

/** Materiaalomschrijving per productsoort. */
function materialFor(slug: string): string {
  if (slug === "vlaggenmast") return "Aluminium (Easylift), 10+ jaar garantie";
  return "Flag-CiCLO® — biologisch afbreekbaar vlaggendoek";
}

/** Extraheer per orderregel de weergave- en CO2-gegevens. */
function toLines(items: OrderItemRow[]): PassportLine[] {
  return items.map((it) => {
    const config = (it.configuration ?? {}) as {
      sizeLabel?: string;
      selections?: Record<string, string>;
    };
    const slug = it.product_type;
    const product = getProduct(slug);
    const sizeLabel = config.sizeLabel ?? "";
    const size =
      product && sizeLabel ? getSize(product, sizeLabel) : undefined;
    const areaM2PerUnit = size ? sizeAreaM2(size) : null;

    return {
      productLabel: it.product_name ?? product?.name ?? slug,
      sizeLabel: sizeLabel || "—",
      amount: it.amount,
      material: materialFor(slug),
      areaM2PerUnit,
      isMast: slug === "vlaggenmast",
    };
  });
}

/** Totale geschatte CO2e (kg) over alle regels — indicatief. */
function estimateCo2Kg(lines: PassportLine[]): {
  totalKg: number;
  totalAreaM2: number;
} {
  let totalKg = 0;
  let totalAreaM2 = 0;
  for (const l of lines) {
    if (l.isMast) {
      totalKg += CO2_PER_MAST_KG * l.amount;
      continue;
    }
    if (l.areaM2PerUnit != null) {
      const area = l.areaM2PerUnit * l.amount;
      totalAreaM2 += area;
      totalKg += area * CO2_PER_M2_KG;
    }
  }
  return { totalKg: Math.round(totalKg * 10) / 10, totalAreaM2: Math.round(totalAreaM2 * 100) / 100 };
}

function formatDateNL(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Klant-/bedrijfsnaam uit het verzendadres, met e-mail als terugval. */
function customerName(order: OrderRow): string {
  const addr = (order.shipping_address ?? {}) as {
    company_name?: string;
    first_name?: string;
    last_name?: string;
  };
  const person = [addr.first_name, addr.last_name].filter(Boolean).join(" ").trim();
  if (addr.company_name && person) return `${addr.company_name} · ${person}`;
  if (addr.company_name) return addr.company_name;
  if (person) return person;
  return order.email;
}

/** Woorden afbreken zodat een regel binnen `maxWidth` past. */
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

/** Kleine cursor-gebaseerde tekenhulp binnen één pagina. */
class Cursor {
  y: number;
  constructor(
    private page: PDFPage,
    private font: PDFFont,
    private bold: PDFFont,
    startY: number,
  ) {
    this.y = startY;
  }

  heading(text: string) {
    this.y -= 22;
    this.page.drawText(text, {
      x: MARGIN,
      y: this.y,
      size: 13,
      font: this.bold,
      color: FOREST,
    });
    // terracotta onderstreping
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - 6,
      width: 42,
      height: 2.5,
      color: TERRACOTTA,
    });
    this.y -= 12;
  }

  paragraph(text: string, opts: { size?: number; color?: RGB } = {}) {
    const size = opts.size ?? 10;
    const color = opts.color ?? INK;
    for (const line of wrap(text, this.font, size, CONTENT_W)) {
      this.y -= size + 4;
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.font, color });
    }
  }

  bullet(label: string, value: string) {
    const size = 10;
    this.y -= size + 6;
    this.page.drawCircle({ x: MARGIN + 3, y: this.y + 3, size: 2, color: TERRACOTTA });
    this.page.drawText(label, {
      x: MARGIN + 14,
      y: this.y,
      size,
      font: this.bold,
      color: INK,
    });
    const labelW = this.bold.widthOfTextAtSize(label, size);
    this.page.drawText(value, {
      x: MARGIN + 14 + labelW + 6,
      y: this.y,
      size,
      font: this.font,
      color: MUTED,
    });
  }
}

/**
 * Genereer het materiaalpaspoort als PDF-bytes voor een order + regels.
 * Retourneert een `Uint8Array` (geschikt als e-mailbijlage).
 */
export async function generateMateriaalpaspoort(
  order: OrderRow,
  items: OrderItemRow[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Materiaalpaspoort ${order.order_number}`);
  doc.setAuthor("Duurzame Vlaggen");
  doc.setSubject("CO2- en materiaalpaspoort");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([PAGE_W, PAGE_H]);
  const lines = toLines(items);
  const co2 = estimateCo2Kg(lines);

  // --- Kopband (forest) ----------------------------------------------------
  const headerH = 96;
  page.drawRectangle({
    x: 0,
    y: PAGE_H - headerH,
    width: PAGE_W,
    height: headerH,
    color: FOREST,
  });

  // Optioneel logo rechtsboven; faalt embedden → tekst-terugval, geen crash.
  let logoDrawn = false;
  try {
    const logoBytes = await readFile(
      path.join(process.cwd(), "public", "logo-mark.png"),
    );
    const logo = await doc.embedPng(logoBytes);
    const targetH = 44;
    const scale = targetH / logo.height;
    const w = logo.width * scale;
    page.drawImage(logo, {
      x: PAGE_W - MARGIN - w,
      y: PAGE_H - headerH + (headerH - targetH) / 2,
      width: w,
      height: targetH,
    });
    logoDrawn = true;
  } catch {
    // Geen logo — kop blijft tekst-only.
  }

  page.drawText("Materiaalpaspoort", {
    x: MARGIN,
    y: PAGE_H - 46,
    size: 24,
    font: bold,
    color: WHITE,
  });
  page.drawText("CO2- en materiaalpaspoort · CSRD-proof", {
    x: MARGIN,
    y: PAGE_H - 68,
    size: 11,
    font,
    color: OFFWHITE,
  });
  if (!logoDrawn) {
    page.drawText("Duurzame Vlaggen", {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize("Duurzame Vlaggen", 12),
      y: PAGE_H - 46,
      size: 12,
      font: bold,
      color: WHITE,
    });
  }

  const cur = new Cursor(page, font, bold, PAGE_H - headerH);

  // --- Ordergegevens -------------------------------------------------------
  cur.y -= 8;
  const dateStr = formatDateNL(order.paid_at ?? order.created_at);
  cur.bullet("Ordernummer:", order.order_number);
  cur.bullet("Datum:", dateStr);
  cur.bullet("Klant:", customerName(order));

  // --- Bestelde producten --------------------------------------------------
  cur.heading("Bestelde producten");
  // tabelkop
  const colX = { product: MARGIN, size: MARGIN + 210, amount: MARGIN + 300 };
  cur.y -= 16;
  const headY = cur.y;
  page.drawText("Product", { x: colX.product, y: headY, size: 9, font: bold, color: MUTED });
  page.drawText("Maat", { x: colX.size, y: headY, size: 9, font: bold, color: MUTED });
  page.drawText("Aantal", { x: colX.amount, y: headY, size: 9, font: bold, color: MUTED });
  cur.y -= 4;
  page.drawRectangle({ x: MARGIN, y: cur.y, width: CONTENT_W, height: 0.75, color: rgb(0.8, 0.8, 0.78) });

  for (const l of lines) {
    cur.y -= 15;
    page.drawText(l.productLabel, { x: colX.product, y: cur.y, size: 10, font: bold, color: INK });
    page.drawText(l.sizeLabel, { x: colX.size, y: cur.y, size: 10, font, color: INK });
    page.drawText(String(l.amount), { x: colX.amount, y: cur.y, size: 10, font, color: INK });
    // materiaalregel eronder
    cur.y -= 12;
    for (const ml of wrap(l.material, font, 8.5, CONTENT_W)) {
      page.drawText(ml, { x: colX.product, y: cur.y, size: 8.5, font, color: MUTED });
    }
  }

  // --- Duurzaamheidskerncijfers -------------------------------------------
  cur.heading("Duurzaamheidskerncijfers");
  cur.bullet("Biologisch afbreekbaar:", "ca. 96% van het doek");
  cur.bullet("Afbraaktijd:", "2–3 jaar (geen microplastics achtergelaten)");
  cur.bullet("Microplastics:", "0% — breekt af i.p.v. te fragmenteren");
  cur.bullet("Bedrukking:", "Waterloos geprint");
  cur.bullet("Productie:", "In Nederland (korte keten)");

  // --- CO2-indicatie -------------------------------------------------------
  cur.heading("CO2-indicatie (indicatief)");
  cur.paragraph(
    `Geschatte CO2e-voetafdruk van deze bestelling: circa ${co2.totalKg.toLocaleString(
      "nl-NL",
    )} kg CO2e${
      co2.totalAreaM2 > 0
        ? ` (op basis van ca. ${co2.totalAreaM2.toLocaleString("nl-NL")} m² geprint doek)`
        : ""
    }. Dit is een INDICATIEVE schatting (cradle-to-gate: productie + waterloze print), geen geverifieerde LCA. Voor mastvlaggen/masten is een forfaitaire aluminiumfactor gebruikt.`,
  );

  // --- CSRD / ESRS-toelichting --------------------------------------------
  cur.heading("CSRD / ESRS-toelichting");
  cur.paragraph(
    "Dit materiaalpaspoort ondersteunt je duurzaamheidsrapportage onder de CSRD. Het levert brondata voor ESRS E2 (verontreiniging — microplastics: 0%), ESRS E5 (hulpbrongebruik en circulaire economie — biologisch afbreekbaar materiaal, einde-leven zonder microplastics) en, via de CO2-indicatie, voor ESRS E1 (klimaatverandering — indicatieve Scope 3-inkoopemissies). Gebruik de cijfers als onderbouwing, niet als geauditeerde meting.",
  );

  // --- Voetnoot ------------------------------------------------------------
  const footY = MARGIN + 6;
  page.drawRectangle({ x: MARGIN, y: footY + 26, width: CONTENT_W, height: 0.75, color: rgb(0.8, 0.8, 0.78) });
  page.drawText(
    "Alle cijfers zijn indicatief en kunnen per productiecharge verschillen.",
    { x: MARGIN, y: footY + 14, size: 8, font, color: MUTED },
  );
  page.drawText(
    "Vragen? Mail hello@duurzame-vlaggen.nl · Duurzame Vlaggen",
    { x: MARGIN, y: footY + 3, size: 8, font, color: MUTED },
  );

  return doc.save();
}
