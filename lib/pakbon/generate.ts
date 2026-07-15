import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type RGB } from "pdf-lib";

import type { OrderRow, OrderItemRow } from "@/lib/db/types";
import { getProduct } from "@/lib/catalog/products";

/**
 * Pakbon (PDF).
 *
 * Gaat mee in de doos. Bewust ZONDER prijzen: een pakbon zegt wát er geleverd
 * wordt, niet wat het kost. Bij een dropship-levering via Probo kan de doos bij
 * de ontvanger belanden zonder dat die de inkoop hoort te zien — en de factuur
 * is een apart document met eigen eisen (btw, KvK).
 *
 * Zelfde bouwwijze als het materiaalpaspoort (lib/materiaalpaspoort/generate.ts):
 * alleen standaard PDF-fonts en één optioneel logo, zodat een ontbrekend asset
 * de order-flow nooit kan breken.
 */

// Huisstijl (docs/STYLEGUIDE.md).
const FOREST: RGB = rgb(0x2c / 255, 0x5f / 255, 0x4f / 255);
const TERRACOTTA: RGB = rgb(0xc6 / 255, 0x6b / 255, 0x4e / 255);
const OFFWHITE: RGB = rgb(0xf7 / 255, 0xf5 / 255, 0xf2 / 255);
const INK: RGB = rgb(0.13, 0.14, 0.13);
const MUTED: RGB = rgb(0.42, 0.44, 0.42);
const WHITE: RGB = rgb(1, 1, 1);
const LIJN: RGB = rgb(0.86, 0.86, 0.84);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

/** Probo-adresformaat; velden zijn optioneel omdat de bron JSONB is. */
interface Adres {
  first_name?: string;
  last_name?: string;
  company?: string;
  street?: string;
  house_number?: string;
  house_number_addition?: string;
  zipcode?: string;
  city?: string;
  country?: string;
}

function adresRegels(adres: unknown, valEmail: string): string[] {
  if (!adres || typeof adres !== "object") return [valEmail];
  const a = adres as Adres;
  const naam = [a.first_name, a.last_name].filter(Boolean).join(" ").trim();
  const straat = [a.street, a.house_number, a.house_number_addition]
    .filter(Boolean)
    .join(" ")
    .trim();
  const plaats = [a.zipcode, a.city].filter(Boolean).join("  ").trim();

  const regels = [a.company, naam, straat, plaats, a.country]
    .map((r) => (r ?? "").trim())
    .filter(Boolean);

  return regels.length > 0 ? regels : [valEmail];
}

function formatDateNL(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Vorm van `order_items.configuration`, opgebouwd in lib/orders/orchestration.ts.
 * Naast de Probo-payload (`code` + `options`) staan daar bewust de MENSELIJKE
 * keuzes op: die zijn hier wat we willen tonen. Probo's optiecodes
 * (`backward-facing`, `band-and-cord`) zeggen een inpakker niets.
 */
interface Configuratie {
  code?: string;
  options?: Array<{ code: string; value?: string | number }>;
  /** Menselijk maatlabel uit de catalogus, bijv. "250 × 100 cm". */
  sizeLabel?: string;
  /** Nederlandse keuzes: { Afwerking: "Tunnel", Kleur: "Wit" }. */
  selections?: Record<string, string>;
  /** Keuzes zonder Probo-equivalent — juist die moet de studio zien. */
  unmapped?: Array<{ label: string; value: string }>;
}

/** Maat terugvinden uit de Probo-opties als `sizeLabel` ontbreekt. */
function maatUitOpties(opties: Configuratie["options"]): string | null {
  if (!opties) return null;
  const w = opties.find((o) => o.code === "width")?.value;
  const h = opties.find((o) => o.code === "height")?.value;
  return w && h ? `${w} × ${h} cm` : null;
}

/**
 * Leesbare omschrijving van een orderregel, voor iemand die de doos inpakt.
 * Alleen menselijke labels; nooit Probo-codes.
 */
function regelOmschrijving(item: OrderItemRow): { titel: string; regels: string[] } {
  const product = getProduct(item.product_type);
  const titel = item.product_name ?? product?.name ?? item.product_type;

  const config = (item.configuration ?? {}) as Configuratie;
  const regels: string[] = [];

  const maat = config.sizeLabel ?? maatUitOpties(config.options);
  if (maat) regels.push(maat);

  if (config.selections) {
    const keuzes = Object.entries(config.selections)
      .filter(([, v]) => typeof v === "string" && v.trim())
      .map(([label, waarde]) => `${label}: ${waarde}`);
    if (keuzes.length) regels.push(keuzes.join(" · "));
  }

  // Handmatig af te handelen keuzes (bijv. Ontwerpservice, of een tunnelzoom die
  // Probo niet kent). Apart en herkenbaar, want hier moet iemand iets mee.
  if (config.unmapped?.length) {
    for (const u of config.unmapped) {
      regels.push(`Let op · ${u.label}: ${u.value}`);
    }
  }

  return { titel, regels };
}

function wrap(tekst: string, font: PDFFont, size: number, maxW: number): string[] {
  const woorden = tekst.split(/\s+/).filter(Boolean);
  const regels: string[] = [];
  let huidig = "";
  for (const w of woorden) {
    const kandidaat = huidig ? `${huidig} ${w}` : w;
    if (font.widthOfTextAtSize(kandidaat, size) > maxW && huidig) {
      regels.push(huidig);
      huidig = w;
    } else {
      huidig = kandidaat;
    }
  }
  if (huidig) regels.push(huidig);
  return regels;
}

export async function generatePakbon(
  order: OrderRow,
  items: OrderItemRow[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Pakbon ${order.order_number}`);
  doc.setAuthor("Duurzame Vlaggen");
  doc.setSubject("Pakbon");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_W, PAGE_H]);

  // --- Kopband -------------------------------------------------------------
  const headerH = 96;
  page.drawRectangle({ x: 0, y: PAGE_H - headerH, width: PAGE_W, height: headerH, color: FOREST });

  let logoDrawn = false;
  try {
    const logoBytes = await readFile(path.join(process.cwd(), "public", "logo-mark.png"));
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
    // Geen logo → tekst-terugval; nooit de PDF laten falen op een asset.
  }

  page.drawText("Pakbon", { x: MARGIN, y: PAGE_H - 46, size: 24, font: bold, color: WHITE });
  page.drawText(order.order_number, {
    x: MARGIN,
    y: PAGE_H - 68,
    size: 11,
    font,
    color: OFFWHITE,
  });
  if (!logoDrawn) {
    const tekst = "Duurzame Vlaggen";
    page.drawText(tekst, {
      x: PAGE_W - MARGIN - bold.widthOfTextAtSize(tekst, 12),
      y: PAGE_H - 46,
      size: 12,
      font: bold,
      color: WHITE,
    });
  }

  let y = PAGE_H - headerH - 36;

  // --- Adres + ordergegevens naast elkaar ----------------------------------
  const kolomW = (CONTENT_W - 24) / 2;

  page.drawText("BEZORGADRES", { x: MARGIN, y, size: 9, font: bold, color: MUTED });
  page.drawText("ORDER", { x: MARGIN + kolomW + 24, y, size: 9, font: bold, color: MUTED });
  y -= 16;

  const adres = adresRegels(order.shipping_address ?? order.billing_address, order.email);
  let yLinks = y;
  for (const regel of adres) {
    page.drawText(regel, { x: MARGIN, y: yLinks, size: 11, font, color: INK });
    yLinks -= 15;
  }

  let yRechts = y;
  const orderRegels: [string, string][] = [
    ["Ordernummer", order.order_number],
    ["Besteldatum", formatDateNL(order.ordered_at ?? order.paid_at ?? order.created_at)],
    ["Markt", order.market],
  ];
  if (order.carrier) orderRegels.push(["Vervoerder", order.carrier]);
  for (const [label, waarde] of orderRegels) {
    page.drawText(label, { x: MARGIN + kolomW + 24, y: yRechts, size: 9, font, color: MUTED });
    page.drawText(waarde, {
      x: MARGIN + kolomW + 24 + 78,
      y: yRechts,
      size: 10,
      font: bold,
      color: INK,
    });
    yRechts -= 15;
  }

  y = Math.min(yLinks, yRechts) - 22;

  // --- Regels --------------------------------------------------------------
  const kolAantalX = PAGE_W - MARGIN - 40;

  page.drawRectangle({ x: MARGIN, y: y - 6, width: CONTENT_W, height: 22, color: OFFWHITE });
  page.drawText("ARTIKEL", { x: MARGIN + 8, y, size: 9, font: bold, color: MUTED });
  page.drawText("AANTAL", { x: kolAantalX - 18, y, size: 9, font: bold, color: MUTED });
  y -= 26;

  let totaalStuks = 0;
  for (const item of items) {
    totaalStuks += item.amount;
    const { titel, regels } = regelOmschrijving(item);

    page.drawText(titel, { x: MARGIN + 8, y, size: 11, font: bold, color: INK });
    page.drawText(String(item.amount), {
      x: kolAantalX - font.widthOfTextAtSize(String(item.amount), 11) + 12,
      y,
      size: 11,
      font: bold,
      color: INK,
    });
    y -= 14;

    for (const detail of regels) {
      // "Let op"-regels vragen om handwerk; die mogen niet wegvallen in grijs.
      const isLetOp = detail.startsWith("Let op ·");
      for (const regel of wrap(detail, isLetOp ? bold : font, 9, CONTENT_W - 80)) {
        page.drawText(regel, {
          x: MARGIN + 8,
          y,
          size: 9,
          font: isLetOp ? bold : font,
          color: isLetOp ? TERRACOTTA : MUTED,
        });
        y -= 12;
      }
    }

    // Klant-artwork hoort de inpakker te kunnen herkennen.
    if (item.file_url) {
      page.drawText("Eigen ontwerp aangeleverd", {
        x: MARGIN + 8,
        y,
        size: 9,
        font,
        color: FOREST,
      });
      y -= 12;
    }

    y -= 6;
    page.drawLine({
      start: { x: MARGIN, y: y + 4 },
      end: { x: PAGE_W - MARGIN, y: y + 4 },
      thickness: 0.5,
      color: LIJN,
    });
    y -= 10;

    // Ruwe pagina-overloop: bij veel regels een nieuwe pagina beginnen. Zonder
    // dit lopen regels van de pagina af en zie je ze gewoon niet meer.
    if (y < MARGIN + 90) {
      const nieuw = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
      nieuw.drawText(`Pakbon ${order.order_number} — vervolg`, {
        x: MARGIN,
        y,
        size: 10,
        font: bold,
        color: MUTED,
      });
      y -= 24;
    }
  }

  // --- Totaal aantal (geen bedragen) ---------------------------------------
  page.drawText("Totaal aantal artikelen", { x: MARGIN + 8, y, size: 10, font: bold, color: INK });
  page.drawText(String(totaalStuks), {
    x: kolAantalX - font.widthOfTextAtSize(String(totaalStuks), 11) + 12,
    y,
    size: 11,
    font: bold,
    color: INK,
  });

  // --- Voet ----------------------------------------------------------------
  const voet = [
    "Geen prijzen op deze pakbon. De factuur ontvang je apart per e-mail.",
    "Vragen over je bestelling? Mail hello@duurzame-vlaggen.nl met je ordernummer.",
  ];
  let yVoet = MARGIN + 24;
  for (const regel of voet) {
    page.drawText(regel, { x: MARGIN, y: yVoet, size: 8, font, color: MUTED });
    yVoet -= 11;
  }

  return doc.save();
}
