import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";

import { BEDRIJF } from "@/lib/bedrijf";

import { OFFERTE_GELDIG_DAGEN, type OfferteBerekening } from "./bereken";

/**
 * Offerte (PDF) op het briefpapier van Duurzame Vlaggen.
 *
 * Het briefpapier is het ontwerp uit doen. (bedrijfsprofiel Duurzame Vlaggen):
 * logo en adres rechtsboven, grijze voetbalk met KvK, btw en IBAN. We tekenen
 * het als achtergrond op volle A4 en zetten de inhoud in het witte vlak ertussen.
 * Pagina 1 gebruikt `briefpapier.jpg`, volgende pagina's `vervolgpapier.jpg`
 * (kleiner logo, geen adresblok). Bedrijfsgegevens staan dus al op het papier
 * en worden hier niet nog eens getekend.
 */

const FOREST: RGB = rgb(0x2c / 255, 0x5f / 255, 0x4f / 255);
const TERRACOTTA: RGB = rgb(0xc6 / 255, 0x6b / 255, 0x4e / 255);
const OFFWHITE: RGB = rgb(0xf5 / 255, 0xf3 / 255, 0xef / 255);
const INK: RGB = rgb(0.2, 0.2, 0.2);
const MUTED: RGB = rgb(0.52, 0.53, 0.47);
const LIJN: RGB = rgb(0.88, 0.88, 0.86);
const WHITE: RGB = rgb(1, 1, 1);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
/** Linker- en rechterkant van het briefpapier (lijnt uit met adres en voetbalk). */
const MARGIN_L = 57;
const MARGIN_R = 52;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const RECHTS = PAGE_W - MARGIN_R;
/** Onder deze hoogte begint de grijze voetbalk van het briefpapier. */
const ONDERGRENS = 92;
/** Eerste tekstregel onder de kop, per soort papier. */
const START_EERSTE = PAGE_H - 160;
const START_VERVOLG = PAGE_H - 92;

const euro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const datumNL = (d: Date) =>
  d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

function wrap(tekst: string, font: PDFFont, size: number, maxW: number): string[] {
  const regels: string[] = [];
  let huidig = "";
  for (const w of tekst.split(/\s+/).filter(Boolean)) {
    const kandidaat = huidig ? `${huidig} ${w}` : w;
    if (font.widthOfTextAtSize(kandidaat, size) > maxW && huidig) {
      regels.push(huidig);
      huidig = w;
    } else huidig = kandidaat;
  }
  if (huidig) regels.push(huidig);
  return regels;
}

export interface OfferteKlant {
  organisatie: string;
  naam: string;
  email: string;
  telefoon?: string;
  referentie?: string;
}

export async function generateOfferte(input: {
  nummer: string;
  datum: Date;
  klant: OfferteKlant;
  offerte: OfferteBerekening;
  opmerking?: string;
}): Promise<Uint8Array> {
  const { nummer, datum, klant, offerte, opmerking } = input;
  const geldigTot = new Date(datum.getTime() + OFFERTE_GELDIG_DAGEN * 86_400_000);

  const doc = await PDFDocument.create();
  doc.setTitle(`Offerte ${nummer}`);
  doc.setAuthor(BEDRIJF.rechtspersoon);
  doc.setSubject(`Offerte ${nummer} · ${offerte.onderwerp}`);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const dir = path.join(process.cwd(), "public", "briefpapier");
  const [eersteBytes, vervolgBytes] = await Promise.all([
    readFile(path.join(dir, "briefpapier.jpg")),
    readFile(path.join(dir, "vervolgpapier.jpg")),
  ]);
  const eerste = await doc.embedJpg(eersteBytes);
  const vervolg = await doc.embedJpg(vervolgBytes);

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  page.drawImage(eerste, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
  let y = START_EERSTE;

  /** Nieuwe pagina op vervolgpapier als het blok niet meer past. */
  const ruimte = (nodig: number) => {
    if (y - nodig >= ONDERGRENS) return;
    page = doc.addPage([PAGE_W, PAGE_H]);
    page.drawImage(vervolg, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
    y = START_VERVOLG;
  };

  const tekst = (
    t: string,
    x: number,
    opts: { size?: number; f?: PDFFont; color?: RGB; rechts?: boolean } = {},
  ) => {
    const size = opts.size ?? 10;
    const f = opts.f ?? font;
    const breedte = f.widthOfTextAtSize(t, size);
    page.drawText(t, {
      x: opts.rechts ? x - breedte : x,
      y,
      size,
      font: f,
      color: opts.color ?? INK,
    });
  };

  // === Titel in het lege vlak links van het logo ============================
  page.drawText("Offerte", { x: MARGIN_L, y: PAGE_H - 62, size: 26, font: bold, color: FOREST });
  page.drawRectangle({ x: MARGIN_L, y: PAGE_H - 74, width: 36, height: 2, color: TERRACOTTA });
  page.drawText(nummer, { x: MARGIN_L, y: PAGE_H - 92, size: 10, font, color: MUTED });

  // === Klant + offertegegevens ==============================================
  const kolom2 = MARGIN_L + CONTENT_W / 2 + 12;
  tekst("OFFERTE VOOR", MARGIN_L, { size: 8, f: bold, color: MUTED });
  tekst("GEGEVENS", kolom2, { size: 8, f: bold, color: MUTED });
  y -= 16;

  const startY = y;
  for (const [i, regel] of [klant.organisatie, klant.naam, klant.email, klant.telefoon]
    .filter((r): r is string => Boolean(r && r.trim()))
    .entries()) {
    tekst(regel, MARGIN_L, { f: i === 0 ? bold : font });
    y -= 14;
  }
  const yLinks = y;

  y = startY;
  const gegevens: [string, string][] = [
    ["Offertenummer", nummer],
    ["Datum", datumNL(datum)],
    ["Geldig tot", datumNL(geldigTot)],
  ];
  if (klant.referentie) gegevens.push(["Je referentie", klant.referentie]);
  for (const [label, waarde] of gegevens) {
    tekst(label, kolom2, { size: 9, color: MUTED });
    tekst(waarde.slice(0, 40), kolom2 + 84, { f: bold });
    y -= 14;
  }
  y = Math.min(yLinks, y) - 22;

  // === Aanhef ===============================================================
  const aanhef = `Beste ${klant.naam.split(" ")[0]},`;
  tekst(aanhef, MARGIN_L);
  y -= 16;
  for (const regel of wrap(
    "Bedankt voor je aanvraag. Hieronder vind je de prijs voor wat je op onze site hebt samengesteld. De bedragen zijn dezelfde als in de winkelmand.",
    font,
    10,
    CONTENT_W,
  )) {
    tekst(regel, MARGIN_L);
    y -= 14;
  }
  y -= 14;

  // === Regels ===============================================================
  const xAantal = RECHTS - 170;
  const xStuk = RECHTS - 78;

  const kop = () => {
    page.drawRectangle({ x: MARGIN_L, y: y - 7, width: CONTENT_W, height: 22, color: OFFWHITE });
    tekst("OMSCHRIJVING", MARGIN_L + 8, { size: 8, f: bold, color: MUTED });
    tekst("AANTAL", xAantal, { size: 8, f: bold, color: MUTED, rechts: true });
    tekst("STUKPRIJS", xStuk, { size: 8, f: bold, color: MUTED, rechts: true });
    tekst("TOTAAL", RECHTS - 8, { size: 8, f: bold, color: MUTED, rechts: true });
    y -= 26;
  };
  kop();

  for (const regel of offerte.regels) {
    const detail = regel.detail ? wrap(regel.detail, font, 8.5, xAantal - MARGIN_L - 60) : [];
    const hoogte = 13 + detail.length * 11 + 18;
    if (y - hoogte < ONDERGRENS) {
      ruimte(hoogte + 40);
      kop();
    }
    tekst(regel.omschrijving, MARGIN_L + 8, { f: bold });
    tekst(String(regel.aantal), xAantal, { rechts: true });
    if (regel.stukprijs === null || regel.totaal === null) {
      tekst("Prijs volgt", RECHTS - 8, { color: MUTED, rechts: true });
    } else {
      tekst(euro(regel.stukprijs), xStuk, { rechts: true });
      tekst(euro(regel.totaal), RECHTS - 8, { rechts: true });
    }
    y -= 13;
    for (const d of detail) {
      tekst(d, MARGIN_L + 8, { size: 8.5, color: MUTED });
      y -= 11;
    }
    y -= 7;
    page.drawLine({
      start: { x: MARGIN_L, y: y + 3 },
      end: { x: RECHTS, y: y + 3 },
      thickness: 0.5,
      color: LIJN,
    });
    y -= 11;
  }

  // === Totalen ==============================================================
  ruimte(120);
  y -= 4;
  const blokX = RECHTS - 220;
  const totalen: [string, string][] = [
    ["Subtotaal excl. btw", euro(offerte.subtotaal)],
    ["Verzendkosten", offerte.verzending === 0 ? "Gratis" : euro(offerte.verzending)],
    [`Btw ${offerte.btwPct}%`, euro(offerte.btw)],
  ];
  for (const [label, waarde] of totalen) {
    tekst(label, blokX, { size: 9.5, color: MUTED });
    tekst(waarde, RECHTS - 8, { size: 9.5, rechts: true });
    y -= 16;
  }
  y -= 8;
  page.drawRectangle({ x: blokX - 10, y: y - 8, width: RECHTS - blokX + 10, height: 26, color: FOREST });
  tekst("Totaal incl. btw", blokX, { size: 11, f: bold, color: WHITE });
  tekst(euro(offerte.totaal), RECHTS - 8, { size: 12, f: bold, color: WHITE, rechts: true });
  y -= 30;

  if (offerte.handwerk) {
    for (const r of wrap(
      "Niet alle regels zijn online te prijzen. Die prijs sturen we je binnen één werkdag, het totaal hierboven is zonder die regels.",
      font,
      9,
      CONTENT_W,
    )) {
      ruimte(14);
      tekst(r, MARGIN_L, { size: 9, color: TERRACOTTA });
      y -= 12;
    }
  }
  y -= 10;

  // === Opmerking van de klant ===============================================
  if (opmerking) {
    const regels = wrap(opmerking.replace(/\s+/g, " "), font, 9, CONTENT_W - 20).slice(0, 12);
    ruimte(30 + regels.length * 12);
    tekst("JOUW OPMERKING", MARGIN_L, { size: 8, f: bold, color: MUTED });
    y -= 14;
    for (const r of regels) {
      tekst(r, MARGIN_L, { size: 9 });
      y -= 12;
    }
    y -= 12;
  }

  // === Voorwaarden en akkoord ===============================================
  const voorwaarden = [
    `Deze offerte is geldig tot en met ${datumNL(geldigTot)}.`,
    "Levering binnen 5 werkdagen na akkoord op de offerte en het ontwerp, door heel Nederland.",
    `Op deze offerte zijn de algemene voorwaarden van ${BEDRIJF.handelsnaam} van toepassing (${BEDRIJF.website}/algemene-voorwaarden).`,
  ];
  const akkoord = `Akkoord? Beantwoord de mail bij deze offerte of mail naar ${BEDRIJF.email}, met offertenummer ${nummer} en je inkoopnummer als je dat gebruikt. Dan zetten wij de order klaar en sturen we de factuur.`;

  const voorwaardenRegels = voorwaarden.flatMap((v) => wrap(v, font, 9, CONTENT_W - 12));
  const akkoordRegels = wrap(akkoord, font, 9.5, CONTENT_W - 24);
  // Exacte hoogte van kop + voorwaarden + akkoordblok, zodat het blok niet
  // onnodig naar een vervolgpagina springt.
  ruimte(14 + voorwaardenRegels.length * 12 + 12 + akkoordRegels.length * 13 + 12);

  tekst("VOORWAARDEN", MARGIN_L, { size: 8, f: bold, color: MUTED });
  y -= 14;
  for (const v of voorwaarden) {
    const regels = wrap(v, font, 9, CONTENT_W - 12);
    regels.forEach((r, i) => {
      if (i === 0) tekst("·", MARGIN_L, { size: 9, color: MUTED });
      tekst(r, MARGIN_L + 12, { size: 9 });
      y -= 12;
    });
  }
  y -= 12;

  const blokH = akkoordRegels.length * 13 + 18;
  page.drawRectangle({ x: MARGIN_L, y: y - blokH + 12, width: CONTENT_W, height: blokH, color: OFFWHITE });
  page.drawRectangle({ x: MARGIN_L, y: y - blokH + 12, width: 3, height: blokH, color: FOREST });
  y -= 3;
  for (const r of akkoordRegels) {
    tekst(r, MARGIN_L + 14, { size: 9.5 });
    y -= 13;
  }

  return doc.save();
}
