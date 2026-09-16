import { writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getProduct } from "@/lib/catalog/products";
import {
  cartRegelTotaal,
  localShipping,
  localUnitPriceWithOptions,
  ontwerpserviceVoorOrder,
} from "@/lib/pricing/local-catalog";

import { berekenOfferte, nieuwOffertenummer, type OfferteInvoerRegel } from "./bereken";
import { generateOfferte } from "./generate";

/**
 * De belofte aan de klant: de offerte noemt hetzelfde bedrag als de winkelmand.
 * Deze tests rekenen een mandregel na zoals CartProvider dat doet
 * (`unitPriceEstimate` uit de configurator → `cartRegelTotaal`) en vergelijken.
 */

const BEACH_MAAT = "Straight Medium S — 65 × 315 cm";

function mandTotaal(regels: OfferteInvoerRegel[]): number {
  const sub = regels.reduce((som, r) => {
    const product = getProduct(r.slug)!;
    const selections = Object.fromEntries(
      r.options.filter((o) => o.code !== "Formaat").map((o) => [o.code, String(o.value ?? "")]),
    );
    const size = product.sizes.find((s) => s.label === r.sizeLabel);
    const unitPriceEstimate = localUnitPriceWithOptions(product, size, selections);
    return som + cartRegelTotaal({ slug: r.slug, unitPriceEstimate, amount: r.amount, options: r.options });
  }, 0);
  const ontwerp = ontwerpserviceVoorOrder(
    regels.map((r) => ({
      selections: Object.fromEntries(r.options.map((o) => [o.code, String(o.value ?? "")])),
    })),
  );
  return Math.round((sub + localShipping(sub) + ontwerp) * 100) / 100;
}

const beachRegel = (amount: number, acc?: string): OfferteInvoerRegel => ({
  slug: "beachvlag",
  sizeLabel: BEACH_MAAT,
  widthCm: 65,
  heightCm: 315,
  amount,
  options: [
    { code: "Formaat", value: BEACH_MAAT },
    { code: "Mastzijde", value: "Links" },
    { code: "Samenstelling", value: "Vlag + stok" },
    ...(acc ? [{ code: "Accessoires", value: acc }] : []),
  ],
});

describe("berekenOfferte", () => {
  it("noemt excl. btw hetzelfde bedrag als de winkelmand (1 stuk)", () => {
    const regels = [beachRegel(1)];
    const r = berekenOfferte(regels);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.offerte.subtotaal + r.offerte.verzending).toBeCloseTo(mandTotaal(regels), 2);
    // Zelfde afronding als computeOrderTotals in de checkout.
    expect(r.offerte.btw).toBe(Math.round((r.offerte.subtotaal + r.offerte.verzending) * 21) / 100);
  });

  it("rekent staffel en accessoires-aantal net als de mand", () => {
    const regels = [beachRegel(12, "12× Kruisvoet · Waterzak Zwart")];
    const r = berekenOfferte(regels);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.offerte.subtotaal + r.offerte.verzending).toBeCloseTo(mandTotaal(regels), 2);
    expect(r.offerte.regels[0].detail).toContain("staffelkorting");
  });

  it("telt de ontwerpservice één keer per offerte, ook over meerdere regels", () => {
    const met = (r: OfferteInvoerRegel) => ({
      ...r,
      options: [...r.options, { code: "Ontwerpservice", value: "Ja (+€ 85,00)" }],
    });
    const regels = [met(beachRegel(2)), met(beachRegel(3))];
    const r = berekenOfferte(regels);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.offerte.regels.filter((x) => x.omschrijving === "Ontwerpservice")).toHaveLength(1);
    expect(r.offerte.subtotaal + r.offerte.verzending).toBeCloseTo(mandTotaal(regels), 2);
  });

  it("weigert een keuze die het product niet kent", () => {
    const regel = beachRegel(1);
    regel.options[1] = { code: "Mastzijde", value: "Gratis" };
    expect(berekenOfferte([regel])).toEqual({ ok: false, fout: "Onbekende keuze bij Mastzijde." });
  });

  it("weigert onbekende producten en lege aanvragen", () => {
    expect(berekenOfferte([]).ok).toBe(false);
    expect(berekenOfferte([{ ...beachRegel(1), slug: "bestaat-niet" }]).ok).toBe(false);
  });

  it("negeert een meegestuurd bedrag: prijs komt alleen uit het prijsmodel", () => {
    const vervalst = { ...beachRegel(1), unitPriceEstimate: 0.01 } as OfferteInvoerRegel;
    const r = berekenOfferte([vervalst]);
    expect(r.ok && r.offerte.subtotaal).toBeGreaterThan(10);
  });

  it("zet niet-online-prijsbare producten op 'prijs volgt'", () => {
    const mast = getProduct("vlaggenmast")!;
    const r = berekenOfferte([
      beachRegel(1),
      { slug: "vlaggenmast", sizeLabel: mast.sizes[0]?.label ?? "", amount: 1, options: [] },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.offerte.handwerk).toBe(true);
    expect(r.offerte.regels[1].totaal).toBeNull();
  });
});

describe("landenvlaggen", () => {
  it("noemt hetzelfde bedrag als de landenvlaggen-winkel, per formaat", () => {
    const mast = getProduct("mastvlag")!;
    const standaard = Object.fromEntries(mast.options.map((o) => [o.label, o.choices[0]]));
    const regels: OfferteInvoerRegel[] = mast.sizes.slice(0, 2).map((size, i) => ({
      slug: "mastvlag",
      sizeLabel: size.label,
      widthCm: size.widthCm,
      heightCm: size.heightCm,
      amount: i === 0 ? 3 : 12,
      options: [
        { code: "Formaat", value: size.label },
        { code: "Landenvlag", value: "Nederland" },
        ...Object.entries(standaard).map(([code, value]) => ({ code, value })),
      ],
    }));
    const r = berekenOfferte(regels);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.offerte.subtotaal + r.offerte.verzending).toBeCloseTo(mandTotaal(regels), 2);
    expect(r.offerte.regels[0].detail).toContain("Landenvlag: Nederland");
  });
});

describe("nieuwOffertenummer", () => {
  it("heeft de vorm OF-jjmmdd-XXXX", () => {
    expect(nieuwOffertenummer(new Date("2026-09-16T10:00:00Z"))).toMatch(/^OF-260916-[A-Z2-9]{4}$/);
  });
});

describe("generateOfferte", () => {
  it("maakt een geldige PDF op het briefpapier", async () => {
    const r = berekenOfferte([beachRegel(12, "12× Kruisvoet"), beachRegel(1)]);
    if (!r.ok) throw new Error(r.fout);
    const pdf = await generateOfferte({
      nummer: "OF-260916-TEST",
      datum: new Date("2026-09-16T10:00:00Z"),
      klant: {
        organisatie: "Gemeente Enkhuizen",
        naam: "Sanne de Vries",
        email: "inkoop@example.nl",
        telefoon: "0228 123 456",
        referentie: "PO-2026-0412",
      },
      offerte: r.offerte,
      opmerking: "Graag levering vóór de braderie.",
    });
    expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
    // Handmatig bekijken: OFFERTE_PDF_OUT=/pad/naar/map npx vitest run lib/offerte
    const out = process.env.OFFERTE_PDF_OUT;
    if (out) await writeFile(path.join(out, "offerte-test.pdf"), pdf);
  });
});
