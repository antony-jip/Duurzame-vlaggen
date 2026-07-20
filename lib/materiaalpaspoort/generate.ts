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
import {
  AFBRAAK_TESTS,
  CERTIFICATEN,
  CICLO_BATCH_CERTIFICAAT,
  CICLO_DISCLAIMER,
  DOEK,
} from "@/lib/claims/afbreekbaarheid";

/**
 * Materiaalpaspoort / inkoopdossier (PDF).
 *
 * Bouwt uit een order + regels een A4-PDF in de huisstijl (forest/terracotta)
 * met: kop + ordergegevens, de bestelde producten met materiaal, de vier
 * gemeten ASTM-afbraakuitkomsten, de herkomst van het doek, de certificaten,
 * een INDICATIEVE CO2-schatting en een toelichting voor inkoop en
 * aanbestedingen. Bewust robuust gehouden: alleen standaard PDF-fonts
 * (Helvetica) en één optioneel logo — faalt het logo, dan valt de kop terug op
 * tekst. Geen externe fonts/afbeeldingen die de order-flow kunnen breken.
 *
 * DIT IS GEEN MARKETINGSTUK. Het is het bewijsmiddel dat een zakelijke inkoper
 * bij een aanbesteding meestuurt, en dat is precies waarom er geen enkele claim
 * in staat zonder norm, percentage en termijn. De cijfers komen uit
 * `lib/claims/afbreekbaarheid.ts`, dezelfde bron als de claimpagina.
 *
 * Verwijderd op 2026-07-20 en bewust niet terug te zetten:
 *  - "CSRD-proof" in de kop. Na het Omnibus-pakket (december 2025) geldt de
 *    CSRD alleen boven 1.000 medewerkers én 450 miljoen omzet; voor vrijwel elke
 *    klant van ons is die claim feitelijk onjuist.
 *  - "Microplastics: 0%". CiCLO vermindert de AFGIFTE van vezels niet, het
 *    versnelt de AFBRAAK van afgegeven vezels. De oude regel beweerde het
 *    tegenovergestelde.
 *  - "ca. 96% van het doek". Dat cijfer is nergens op terug te voeren; de
 *    gemeten uitkomsten staan in AFBRAAK_TESTS.
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
 * (productie + print met inkt op waterbasis, cradle-to-gate). Bewust
 * conservatief en als
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
  return `${DOEK.merk} — ${DOEK.samenstelling}, geweven als ${DOEK.weefselnaam}`;
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
    const size = product && sizeLabel ? getSize(product, sizeLabel) : undefined;
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
  return {
    totalKg: Math.round(totalKg * 10) / 10,
    totalAreaM2: Math.round(totalAreaM2 * 100) / 100,
  };
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
  const person = [addr.first_name, addr.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (addr.company_name && person) return `${addr.company_name} · ${person}`;
  if (addr.company_name) return addr.company_name;
  if (person) return person;
  return order.email;
}

/** Woorden afbreken zodat een regel binnen `maxWidth` past. */
function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
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

/**
 * Cursor-gebaseerde tekenhulp die zelf een pagina bijprikt.
 *
 * Het dossier is niet meer op één A4 te persen: bij een order met meerdere
 * regels liep de oude versie onderaan de pagina door de voettekst heen en viel
 * de rest buiten het papier. `ensure()` kijkt vóór elk blok of er nog ruimte is
 * en begint anders een nieuwe pagina.
 */
class Cursor {
  y: number;
  /** De pagina waarop nu getekend wordt; wisselt bij een paginabreuk. */
  page: PDFPage;
  /** Ondergrens: hieronder begint de voettekst. */
  private static readonly BOTTOM = MARGIN + 40;

  constructor(
    private doc: PDFDocument,
    page: PDFPage,
    private font: PDFFont,
    private bold: PDFFont,
    startY: number,
    /** Dossiernummer, herhaald bovenaan elke vervolgpagina. */
    private dossier: string,
  ) {
    this.page = page;
    this.y = startY;
  }

  /** Zorg dat er `space` punten over zijn; begin anders een nieuwe pagina. */
  ensure(space: number) {
    if (this.y - space >= Cursor.BOTTOM) return;
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
    this.vervolgKop();
  }

  /**
   * Kopregel op een vervolgpagina. Zonder deze regel begint pagina 2 met een
   * zwevende kop zonder afzender: een dossier dat wordt uitgeprint en rondgaat
   * moet op elke pagina laten zien waar het bij hoort.
   */
  private vervolgKop() {
    const tekst = `${this.dossier} · vervolg`;
    this.page.drawText(tekst, {
      x: MARGIN,
      y: this.y,
      size: 9,
      font: this.font,
      color: MUTED,
    });
    this.y -= 6;
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y,
      width: CONTENT_W,
      height: 0.75,
      color: rgb(0.8, 0.8, 0.78),
    });
    this.y -= 10;
  }

  heading(text: string) {
    // Een kop mag niet als laatste regel op een pagina eindigen.
    this.ensure(60);
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
      this.ensure(size + 4);
      this.y -= size + 4;
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size,
        font: this.font,
        color,
      });
    }
  }

  bullet(label: string, value: string) {
    const size = 10;
    this.ensure(size + 6);
    this.y -= size + 6;
    this.page.drawCircle({
      x: MARGIN + 3,
      y: this.y + 3,
      size: 2,
      color: TERRACOTTA,
    });
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
  doc.setSubject("Materiaal-, herkomst- en afbreekbaarheidsdossier");

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
  page.drawText("Materiaal, herkomst en gemeten afbreekbaarheid", {
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

  const dossier = `Dossier DV-${order.order_number}`;
  const cur = new Cursor(doc, page, font, bold, PAGE_H - headerH, dossier);

  // --- Ordergegevens -------------------------------------------------------
  cur.y -= 8;
  const dateStr = formatDateNL(order.paid_at ?? order.created_at);
  cur.bullet("Dossiernummer:", `DV-${order.order_number}`);
  cur.bullet("Ordernummer:", order.order_number);
  cur.bullet("Datum:", dateStr);
  cur.bullet("Klant:", customerName(order));

  // --- Bestelde producten --------------------------------------------------
  cur.heading("Bestelde producten");
  // tabelkop
  const colX = { product: MARGIN, size: MARGIN + 210, amount: MARGIN + 300 };
  cur.ensure(30);
  cur.y -= 16;
  const headY = cur.y;
  cur.page.drawText("Product", {
    x: colX.product,
    y: headY,
    size: 9,
    font: bold,
    color: MUTED,
  });
  cur.page.drawText("Maat", {
    x: colX.size,
    y: headY,
    size: 9,
    font: bold,
    color: MUTED,
  });
  cur.page.drawText("Aantal", {
    x: colX.amount,
    y: headY,
    size: 9,
    font: bold,
    color: MUTED,
  });
  cur.y -= 4;
  cur.page.drawRectangle({
    x: MARGIN,
    y: cur.y,
    width: CONTENT_W,
    height: 0.75,
    color: rgb(0.8, 0.8, 0.78),
  });

  for (const l of lines) {
    cur.ensure(30);
    cur.y -= 15;
    cur.page.drawText(l.productLabel, {
      x: colX.product,
      y: cur.y,
      size: 10,
      font: bold,
      color: INK,
    });
    cur.page.drawText(l.sizeLabel, {
      x: colX.size,
      y: cur.y,
      size: 10,
      font,
      color: INK,
    });
    cur.page.drawText(String(l.amount), {
      x: colX.amount,
      y: cur.y,
      size: 10,
      font,
      color: INK,
    });
    // materiaalregel eronder
    cur.y -= 12;
    for (const ml of wrap(l.material, font, 8.5, CONTENT_W)) {
      cur.page.drawText(ml, {
        x: colX.product,
        y: cur.y,
        size: 8.5,
        font,
        color: MUTED,
      });
    }
  }

  // --- Gemeten afbreekbaarheid --------------------------------------------
  // Vier ASTM-uitkomsten met de onbehandelde referentie ernaast. Die
  // vergelijking is het bewijsmiddel: hetzelfde doek, dezelfde omstandigheden,
  // alleen het additief verschilt.
  cur.heading("Gemeten afbreekbaarheid");
  for (const test of AFBRAAK_TESTS) {
    const referentie =
      test.referentiePct == null
        ? "onbehandeld polyester: geen afbraak gemeten"
        : `onbehandeld polyester: ${test.referentiePct}%`;
    cur.bullet(
      `${test.omgeving} (${test.norm}):`,
      `${test.afbraakPct}% afgebroken in ${test.dagen.toLocaleString("nl-NL")} dagen — ${referentie}`,
    );
  }
  cur.paragraph(CICLO_DISCLAIMER, { color: MUTED });
  cur.paragraph(
    "Let op bij het beoordelen van dit dossier: CiCLO versnelt de afbraak van vezels die zijn afgegeven. Het vermindert de afgifte van vezels tijdens gebruik niet. Flag-CiCLO is niet composteerbaar; die claim is door de licentiegever uitdrukkelijk uitgesloten.",
  );

  // --- Herkomst ------------------------------------------------------------
  cur.heading("Herkomst van het doek");
  cur.bullet("Doek:", DOEK.merk);
  cur.bullet("Samenstelling:", DOEK.samenstelling);
  cur.bullet("Geweven door:", DOEK.weverij);
  cur.bullet("Weefselnaam:", DOEK.weefselnaam);
  cur.bullet("Artikelnummers:", DOEK.artikelnummers.join(" / "));
  cur.bullet("Bedrukking:", "Geprint met inkt op waterbasis, in Nederland");

  // --- Certificaten --------------------------------------------------------
  // Nummers zijn configureerbaar en mogen ontbreken. Zolang ze ontbreken meldt
  // het dossier dat eerlijk in plaats van een nummer te suggereren.
  cur.heading("Certificaten");
  for (const cert of CERTIFICATEN) {
    cur.bullet(`${cert.naam}:`, cert.nummer ?? "certificaatnummer op aanvraag");
  }
  cur.bullet(
    "CiCLO® Certificate of Authenticity:",
    CICLO_BATCH_CERTIFICAAT ?? "batchcertificaat op aanvraag",
  );

  // --- CO2-indicatie -------------------------------------------------------
  cur.heading("CO2-indicatie (indicatief)");
  cur.paragraph(
    `Geschatte CO2e-voetafdruk van deze bestelling: circa ${co2.totalKg.toLocaleString(
      "nl-NL",
    )} kg CO2e${
      co2.totalAreaM2 > 0
        ? ` (op basis van ca. ${co2.totalAreaM2.toLocaleString("nl-NL")} m² geprint doek)`
        : ""
    }. Dit is een INDICATIEVE schatting (cradle-to-gate: productie + print met inkt op waterbasis), geen geverifieerde LCA. Voor mastvlaggen/masten is een forfaitaire aluminiumfactor gebruikt.`,
  );

  // --- Voor inkoop en aanbestedingen --------------------------------------
  cur.heading("Voor inkoop en aanbestedingen");
  cur.paragraph(
    "Dit dossier levert brondata voor een duurzaamheidsverslag of een aanbesteding: de gemeten afbraakuitkomsten per omgeving, de herkomst van het doek tot aan de weverij, en de certificaten van de gebruikte partij. Gebruik de cijfers als onderbouwing, niet als geauditeerde meting.",
  );
  cur.paragraph(
    "Over de CSRD: sinds het Omnibus-pakket van december 2025 geldt de rapportageplicht alleen voor ondernemingen boven 1.000 medewerkers én 450 miljoen euro omzet. Val je daar niet onder, dan is er voor jou geen CSRD-verplichting. Krijg je de vraag toch van een grote opdrachtgever in je keten, dan is dit dossier het antwoord.",
  );

  // --- Voetnoot ------------------------------------------------------------
  // Op ELKE pagina, met paginanummering. Een dossier dat bij een aanbesteding
  // wordt ingediend raakt anders zijn tweede pagina kwijt zonder dat iemand het
  // merkt: zonder "pagina 1 van 2" is een ontbrekend vel onzichtbaar.
  const footY = MARGIN + 6;
  const paginas = doc.getPages();
  for (const [i, p] of paginas.entries()) {
    p.drawRectangle({
      x: MARGIN,
      y: footY + 26,
      width: CONTENT_W,
      height: 0.75,
      color: rgb(0.8, 0.8, 0.78),
    });
    p.drawText(
      "Alle cijfers zijn indicatief en kunnen per productiecharge verschillen.",
      { x: MARGIN, y: footY + 14, size: 8, font, color: MUTED },
    );
    p.drawText("Vragen? Mail hello@duurzame-vlaggen.nl · Duurzame Vlaggen", {
      x: MARGIN,
      y: footY + 3,
      size: 8,
      font,
      color: MUTED,
    });
    const nummer = `Pagina ${i + 1} van ${paginas.length}`;
    p.drawText(nummer, {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(nummer, 8),
      y: footY + 3,
      size: 8,
      font,
      color: MUTED,
    });
  }

  return doc.save();
}
