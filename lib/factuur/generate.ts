import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type RGB } from "pdf-lib";

import type { OrderRow, OrderItemRow } from "@/lib/db/types";
import { getProduct } from "@/lib/catalog/products";
import { BEDRIJF, bedrijfsAdresRegels, factuurVoetRegels } from "@/lib/bedrijf";

/**
 * Factuur (PDF).
 *
 * Anders dan de pakbon is dit een juridisch document. Twee regels die het
 * ontwerp bepalen:
 *
 *  1. Alle bedragen en btw komen uit de SNAPSHOT op de order
 *     (`vat_rate`, `vat_amount`, `subtotal_ex_vat`, `total`), niet uit
 *     lib/vat/rates.ts. Die tarieventabel kan wijzigen; een verstuurde factuur
 *     mag nooit met terugwerkende kracht een ander bedrag tonen.
 *  2. Niets verzinnen. Ontbreekt het straatadres of is het KvK-nummer niet
 *     bevestigd, dan laten we het weg (zie lib/bedrijf.ts) in plaats van er
 *     iets plausibels neer te zetten.
 *
 * Huisstijl (docs/STYLEGUIDE.md) zit in het briefpapier: forest kopband,
 * terracotta accentlijn, sage-blue voor secundaire informatie, off-white vlakken.
 */

// Volledige V5.0-palet.
const FOREST: RGB = rgb(0x2c / 255, 0x5f / 255, 0x4f / 255);
const TERRACOTTA: RGB = rgb(0xc6 / 255, 0x6b / 255, 0x4e / 255);
const SAGE_BLUE: RGB = rgb(0x5c / 255, 0x8a / 255, 0x9d / 255);
const COPPER: RGB = rgb(0xa4 / 255, 0x6b / 255, 0x4a / 255);
const OFFWHITE: RGB = rgb(0xf7 / 255, 0xf5 / 255, 0xf2 / 255);
const INK: RGB = rgb(0.23, 0.23, 0.23);
const MUTED: RGB = rgb(0.55, 0.55, 0.48);
const WHITE: RGB = rgb(1, 1, 1);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const euro = (n: number | null | undefined) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n ?? 0);

function datumNL(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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
  return regels.length ? regels : [valEmail];
}

interface Configuratie {
  sizeLabel?: string;
  selections?: Record<string, string>;
  options?: Array<{ code: string; value?: string | number }>;
}

function regelTekst(item: OrderItemRow): { titel: string; detail: string } {
  const product = getProduct(item.product_type);
  const titel = item.product_name ?? product?.name ?? item.product_type;
  const config = (item.configuration ?? {}) as Configuratie;

  const stukjes: string[] = [];
  if (config.sizeLabel) stukjes.push(config.sizeLabel);
  if (config.selections) {
    for (const [label, waarde] of Object.entries(config.selections)) {
      if (typeof waarde === "string" && waarde.trim()) stukjes.push(`${label}: ${waarde}`);
    }
  }
  return { titel, detail: stukjes.join(" · ") };
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
    } else huidig = kandidaat;
  }
  if (huidig) regels.push(huidig);
  return regels;
}

/**
 * Btw-regel op de factuur. Drie gevallen, elk met een eigen wettelijke
 * vermelding — dit is geen cosmetica.
 */
function btwToelichting(order: OrderRow): { label: string; vermelding: string | null } {
  if (order.reverse_charge) {
    return {
      label: "Btw verlegd",
      vermelding: order.vat_number
        ? `Btw verlegd naar ${order.vat_number} · artikel 138 Btw-richtlijn`
        : "Btw verlegd · artikel 138 Btw-richtlijn",
    };
  }
  if (!order.vat_rate || Number(order.vat_rate) === 0) {
    return { label: "Btw 0%", vermelding: "0% btw · export buiten de EU" };
  }
  return { label: `Btw ${Number(order.vat_rate)}%`, vermelding: null };
}

export async function generateFactuur(
  order: OrderRow,
  items: OrderItemRow[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Factuur ${order.order_number}`);
  doc.setAuthor(BEDRIJF.rechtspersoon);
  doc.setSubject(`Factuur ${order.order_number}`);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_W, PAGE_H]);

  // === Briefpapier ==========================================================
  // Forest kopband met een terracotta accentlijn eronder, en een smalle
  // sage-blue zijstrook over de volle hoogte. Zo draagt de huisstijl het vel
  // zonder dat het een reclamefolder wordt.
  const headerH = 104;
  page.drawRectangle({ x: 0, y: PAGE_H - headerH, width: PAGE_W, height: headerH, color: FOREST });
  page.drawRectangle({ x: 0, y: PAGE_H - headerH - 4, width: PAGE_W, height: 4, color: TERRACOTTA });
  page.drawRectangle({ x: 0, y: 0, width: 6, height: PAGE_H - headerH - 4, color: SAGE_BLUE });

  let logoDrawn = false;
  try {
    // Volledig woordmerk (lichte variant) op de forest kopband; ~10:1, dus de
    // hoogte bepaalt de breedte.
    const logoBytes = await readFile(path.join(process.cwd(), "public", "logo-full-light.png"));
    const logo = await doc.embedPng(logoBytes);
    const targetH = 16;
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
    // Asset mag de factuur nooit breken.
  }

  page.drawText("Factuur", { x: MARGIN, y: PAGE_H - 48, size: 26, font: bold, color: WHITE });
  page.drawText(BEDRIJF.tenaamstelling, {
    x: MARGIN,
    y: PAGE_H - 70,
    size: 9,
    font,
    color: OFFWHITE,
  });
  const adresKop = bedrijfsAdresRegels().join(" · ");
  if (adresKop) {
    page.drawText(adresKop, { x: MARGIN, y: PAGE_H - 84, size: 9, font, color: OFFWHITE });
  }
  if (!logoDrawn) {
    const t = BEDRIJF.handelsnaam;
    page.drawText(t, {
      x: PAGE_W - MARGIN - bold.widthOfTextAtSize(t, 12),
      y: PAGE_H - 48,
      size: 12,
      font: bold,
      color: WHITE,
    });
  }

  let y = PAGE_H - headerH - 40;

  // === Factuuradres + factuurgegevens ======================================
  const kolomW = (CONTENT_W - 24) / 2;
  page.drawText("FACTUURADRES", { x: MARGIN, y, size: 8, font: bold, color: SAGE_BLUE });
  page.drawText("FACTUURGEGEVENS", {
    x: MARGIN + kolomW + 24,
    y,
    size: 8,
    font: bold,
    color: SAGE_BLUE,
  });
  y -= 16;

  let yL = y;
  for (const regel of adresRegels(order.billing_address ?? order.shipping_address, order.email)) {
    page.drawText(regel, { x: MARGIN, y: yL, size: 10, font, color: INK });
    yL -= 14;
  }
  if (order.vat_number) {
    yL -= 4;
    page.drawText(`Btw-nummer: ${order.vat_number}`, {
      x: MARGIN,
      y: yL,
      size: 9,
      font,
      color: MUTED,
    });
    yL -= 14;
  }

  let yR = y;
  const gegevens: [string, string][] = [
    ["Factuurnummer", order.order_number],
    ["Factuurdatum", datumNL(order.paid_at ?? order.created_at)],
    ["Markt", order.market],
  ];
  for (const [label, waarde] of gegevens) {
    page.drawText(label, { x: MARGIN + kolomW + 24, y: yR, size: 9, font, color: MUTED });
    page.drawText(waarde, {
      x: MARGIN + kolomW + 24 + 86,
      y: yR,
      size: 10,
      font: bold,
      color: INK,
    });
    yR -= 14;
  }

  y = Math.min(yL, yR) - 24;

  // === Regels ===============================================================
  const xAantal = PAGE_W - MARGIN - 150;
  const xStuk = PAGE_W - MARGIN - 96;
  const xTotaal = PAGE_W - MARGIN;

  page.drawRectangle({ x: MARGIN, y: y - 6, width: CONTENT_W, height: 22, color: OFFWHITE });
  page.drawText("OMSCHRIJVING", { x: MARGIN + 8, y, size: 8, font: bold, color: MUTED });
  page.drawText("AANTAL", { x: xAantal, y, size: 8, font: bold, color: MUTED });
  page.drawText("STUKPRIJS", { x: xStuk - 10, y, size: 8, font: bold, color: MUTED });
  const tKop = "TOTAAL";
  page.drawText(tKop, { x: xTotaal - bold.widthOfTextAtSize(tKop, 8), y, size: 8, font: bold, color: MUTED });
  y -= 26;

  for (const item of items) {
    const { titel, detail } = regelTekst(item);
    // line_price is de prijs PER STUK (base_price + markup), ex btw.
    const stuk = Number(item.line_price ?? 0);
    const regelTotaal = stuk * item.amount;

    page.drawText(titel, { x: MARGIN + 8, y, size: 10, font: bold, color: INK });
    page.drawText(String(item.amount), { x: xAantal, y, size: 10, font, color: INK });
    page.drawText(euro(stuk), { x: xStuk - 10, y, size: 10, font, color: INK });
    const tt = euro(regelTotaal);
    page.drawText(tt, { x: xTotaal - font.widthOfTextAtSize(tt, 10), y, size: 10, font, color: INK });
    y -= 13;

    if (detail) {
      for (const regel of wrap(detail, font, 8.5, CONTENT_W - 180)) {
        page.drawText(regel, { x: MARGIN + 8, y, size: 8.5, font, color: MUTED });
        y -= 11;
      }
    }
    y -= 8;
    page.drawLine({
      start: { x: MARGIN, y: y + 3 },
      end: { x: PAGE_W - MARGIN, y: y + 3 },
      thickness: 0.5,
      color: rgb(0.88, 0.88, 0.86),
    });
    y -= 10;
  }

  // === Totalen ==============================================================
  const btw = btwToelichting(order);
  const totalen: [string, string, boolean][] = [
    ["Subtotaal (ex btw)", euro(order.subtotal_ex_vat), false],
    ["Verzendkosten", Number(order.shipping_cost ?? 0) === 0 ? "Gratis" : euro(order.shipping_cost), false],
    [btw.label, euro(order.vat_amount), false],
    ["Totaal", euro(order.total), true],
  ];

  y -= 6;
  const blokX = PAGE_W - MARGIN - 210;
  for (const [label, waarde, isTotaal] of totalen) {
    if (isTotaal) {
      // Extra lucht: het forest vlak is hoger dan een tekstregel en zou anders
      // over de btw-regel erboven heen vallen.
      y -= 10;
      // Het eindbedrag krijgt een forest vlak: dat is waar het oog moet landen.
      page.drawRectangle({ x: blokX - 10, y: y - 7, width: 220, height: 24, color: FOREST });
      page.drawText(label, { x: blokX, y, size: 11, font: bold, color: WHITE });
      page.drawText(waarde, {
        x: xTotaal - bold.widthOfTextAtSize(waarde, 12),
        y,
        size: 12,
        font: bold,
        color: WHITE,
      });
    } else {
      page.drawText(label, { x: blokX, y, size: 9.5, font, color: MUTED });
      page.drawText(waarde, {
        x: xTotaal - font.widthOfTextAtSize(waarde, 9.5),
        y,
        size: 9.5,
        font,
        color: INK,
      });
    }
    y -= isTotaal ? 30 : 16;
  }

  // Wettelijke btw-vermelding (verlegd/export) — copper, ingetogen maar zichtbaar.
  if (btw.vermelding) {
    page.drawText(btw.vermelding, { x: MARGIN, y, size: 9, font: bold, color: COPPER });
    y -= 18;
  }

  // === Betaalinstructie =====================================================
  const betaald = order.status === "paid" || Boolean(order.paid_at);
  y -= 6;
  page.drawRectangle({ x: MARGIN, y: y - 22, width: CONTENT_W, height: 34, color: OFFWHITE });
  page.drawText(
    betaald
      ? `Betaald via iDEAL op ${datumNL(order.paid_at ?? order.created_at)}. Dit bedrag hoeft niet te worden overgemaakt.`
      : `Te voldoen op ${BEDRIJF.iban} t.n.v. ${BEDRIJF.rechtspersoon}, onder vermelding van ${order.order_number}.`,
    { x: MARGIN + 10, y: y - 10, size: 9, font, color: betaald ? FOREST : INK },
  );

  // === Voet =================================================================
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 3, color: TERRACOTTA });
  let yVoet = MARGIN - 12;
  for (const regel of factuurVoetRegels().reverse()) {
    page.drawText(regel, { x: MARGIN, y: yVoet, size: 7.5, font, color: MUTED });
    yVoet += 10;
  }

  return doc.save();
}
