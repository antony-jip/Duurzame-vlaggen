import { describe, expect, it } from "vitest";
import { getProduct } from "@/lib/catalog/products";
import {
  DESIGN_SERVICE_PRICE,
  FREE_SHIPPING_THRESHOLD,
  FREE_SHIPPING_THRESHOLD_INCL_VAT,
  MASTVLAG_PRIJS_PER_M2,
  SHIPPING_FLAT,
  STAFFEL_TIERS,
  getSize,
  localLinePrice,
  localShipping,
  localUnitPriceForLine,
  ontwerpserviceVoorOrder,
  sizeAreaM2,
} from "./local-catalog";

/**
 * Regressietests voor twee lekken die bij ELKE bestelling geld kostten
 * (gevonden 2026-07-15).
 *
 * 1. Eigen maat werd afgerekend tegen `priceFrom`. `getSize()` matcht op label
 *    en een vrije maat heet "Eigen: 245 × 130 cm" — die staat nooit in
 *    `product.sizes`. `size` bleef undefined en `localUnitPrice` viel door naar
 *    `priceFrom`. Gemeten: een mastvlag van 400 × 200 cm ging voor €23 weg
 *    i.p.v. €122,67. De configurator rekende het wél goed, maar
 *    `buildLocalQuote` riep `localCustomSizePrice` nooit aan.
 *
 * 2. De ontwerpservice (€85) werd getoond in de configurator maar zat in geen
 *    enkel totaal: niet in `unitPriceEstimate` (het is eenmalig per order, geen
 *    stukprijs) en niet in `buildLocalQuote`. Hij werd dus nooit gefactureerd.
 */

const mastvlag = getProduct("mastvlag")!;

describe("eigen maat", () => {
  it("rekent per m² i.p.v. terug te vallen op priceFrom", () => {
    const label = "Eigen: 400 × 200 cm";
    // De kern van het lek: de catalogus kent dit label niet.
    expect(getSize(mastvlag, label)).toBeUndefined();

    const prijs = localUnitPriceForLine({
      product: mastvlag,
      size: getSize(mastvlag, label),
      widthCm: 400,
      heightCm: 200,
    });

    expect(prijs).toBeGreaterThan(mastvlag.priceFrom);
    // 8,00 m² × € 18,50/m² (MASTVLAG_PRIJS_PER_M2).
    expect(prijs).toBeCloseTo(148, 2);
  });

  it("laat een gewone catalogusmaat ongemoeid", () => {
    const size = mastvlag.sizes[0];
    const prijs = localUnitPriceForLine({
      product: mastvlag,
      size: getSize(mastvlag, size.label),
      widthCm: size.widthCm,
      heightCm: size.heightCm,
    });
    expect(prijs).toBe(27.5);
  });

  it("vouwt de eigen maat door in de regelprijs, mét staffel", () => {
    const regel = localLinePrice({
      product: mastvlag,
      size: getSize(mastvlag, "Eigen: 400 × 200 cm"),
      widthCm: 400,
      heightCm: 200,
      amount: 5, // 5% staffel
    });
    expect(regel).toBeCloseTo(148 * 5 * 0.95, 1);
  });
});

describe("ontwerpservice", () => {
  it("telt niet mee als niemand hem koos", () => {
    expect(
      ontwerpserviceVoorOrder([{ selections: { Mastzijde: "Links" } }]),
    ).toBe(0);
    expect(ontwerpserviceVoorOrder([{}])).toBe(0);
  });

  it("herkent de menselijke waarde uit de configurator", () => {
    // De configurator zet letterlijk `Ja (+€ 85,00)` op de regel.
    expect(
      ontwerpserviceVoorOrder([
        { selections: { Ontwerpservice: "Ja (+€ 85,00)" } },
      ]),
    ).toBe(DESIGN_SERVICE_PRICE);
  });

  it("rekent eenmalig per order, niet per regel", () => {
    const drieRegels = Array.from({ length: 3 }, () => ({
      selections: { Ontwerpservice: "Ja (+€ 85,00)" },
    }));
    expect(ontwerpserviceVoorOrder(drieRegels)).toBe(DESIGN_SERVICE_PRICE);
  });
});

describe("accessoires als losse artikelen (eigen aantal, buiten de staffel)", () => {
  const beachvlag = getProduct("beachvlag")!;
  const maat = getSize(beachvlag, "Straight Medium S — 65 × 315 cm");

  it("telt accessoires niet mee in de stukprijs", () => {
    const zonder = localUnitPriceForLine({ product: beachvlag, size: maat });
    const met = localUnitPriceForLine({
      product: beachvlag,
      size: maat,
      selections: { Accessoires: "Kruisvoet" },
    });
    expect(met).toBe(zonder);
  });

  it("rekent accessoires één keer per regel, niet × het vlaggenaantal", () => {
    // 2 vlaggen + 1 kruisvoet (€27): voorheen 2×27 in de regel, nu 1×27.
    const kaal = localLinePrice({ product: beachvlag, size: maat, amount: 2 });
    const met = localLinePrice({
      product: beachvlag,
      size: maat,
      amount: 2,
      selections: { Accessoires: "Kruisvoet" },
    });
    expect(met - kaal).toBeCloseTo(27, 2);
  });

  it("respecteert het eigen aantal per accessoire (N×-prefix), buiten de staffel", () => {
    // 10 vlaggen (10% staffel) + 3 kruisvoeten + 1 waterzak zwart:
    // accessoires = 3×27 + 8 = 89, zónder korting.
    const kaal = localLinePrice({ product: beachvlag, size: maat, amount: 10 });
    const met = localLinePrice({
      product: beachvlag,
      size: maat,
      amount: 10,
      selections: { Accessoires: "3× Kruisvoet · Waterzak Zwart" },
    });
    expect(met - kaal).toBeCloseTo(89, 2);
  });
});

/**
 * De staffelknik (gevonden 2026-07-20).
 *
 * Onze korting daalde sneller dan Probo's inkoopstaffel, waardoor 25 stuks
 * MINDER marge opleverde dan 10 stuks: precies de trede die we als "grote
 * order" verkopen. De 25-trede ging daarom van 15% naar 12%.
 *
 * Deze test rekent op de vier ECHTE Probo-portaaloffertes van 2026-07-15
 * (baniervlag 100×300 cm, tunnel, wit). Geen model, geen schatting: als de
 * staffel weer scheefloopt, valt hij hier om.
 */
describe("staffelknik", () => {
  const baniervlag = getProduct("baniervlag")!;
  const maat = getSize(baniervlag, "100 × 300 cm");

  /** Totale Probo-inkoop (ex btw) per aantal — echte offertes. */
  const PROBO_OFFERTES: ReadonlyArray<{ aantal: number; inkoop: number }> = [
    { aantal: 1, inkoop: 25.4 },
    { aantal: 10, inkoop: 202.9 },
    { aantal: 25, inkoop: 487.9 },
    { aantal: 40, inkoop: 714.4 },
  ];

  /** Brutomarge als fractie: (omzet − inkoop) / omzet. */
  function marge(aantal: number, inkoop: number): number {
    const omzet = localLinePrice({
      product: baniervlag,
      size: maat,
      amount: aantal,
    });
    return (omzet - inkoop) / omzet;
  }

  it("laat de marge niet dalen bij een hogere staffel", () => {
    const marges = PROBO_OFFERTES.map((o) => marge(o.aantal, o.inkoop));
    for (let i = 1; i < marges.length; i++) {
      expect(
        marges[i],
        `marge bij ${PROBO_OFFERTES[i].aantal} st zakt onder ${PROBO_OFFERTES[i - 1].aantal} st`,
      ).toBeGreaterThan(marges[i - 1]);
    }
  });

  it("houdt 25 stuks boven 10 stuks — de trede die eerder omsloeg", () => {
    // Was 39,6% tegen 40,7% op de oude 15%-trede.
    expect(marge(25, 487.9)).toBeGreaterThan(marge(10, 202.9));
    expect(marge(25, 487.9)).toBeCloseTo(0.416, 3);
  });

  it("pint de 25-trede vast op 12%", () => {
    const tier = STAFFEL_TIERS.find((t) => t.qty === 25);
    expect(tier?.discount).toBe(0.12);
  });

  it("houdt de staffel oplopend en op volgorde", () => {
    for (let i = 1; i < STAFFEL_TIERS.length; i++) {
      expect(STAFFEL_TIERS[i].qty).toBeGreaterThan(STAFFEL_TIERS[i - 1].qty);
      expect(STAFFEL_TIERS[i].discount).toBeGreaterThan(
        STAFFEL_TIERS[i - 1].discount,
      );
    }
  });
});

describe("mastvlag-herprijzing (stap 2: € 18,50/m²)", () => {
  it("prijst elke catalogusmaat op het tarief, afgerond op € 0,50", () => {
    for (const size of mastvlag.sizes) {
      const area = sizeAreaM2(size);
      if (area == null) continue;
      const prijs = localUnitPriceForLine({ product: mastvlag, size });
      // Op het halve-eurorooster, dus maximaal € 0,25 van het tarief af.
      expect(
        Math.abs(prijs - area * MASTVLAG_PRIJS_PER_M2),
      ).toBeLessThanOrEqual(0.25);
      expect(prijs * 2).toBe(Math.round(prijs * 2));
    }
  });

  it("rekent een eigen maat op het volle tarief, niet op de afgeronde kleinste maat", () => {
    // Het lek dat CUSTOM_SIZE_RATES.mastvlag dichtzet: zonder die regel leidt
    // `customRatePerM2` het tarief af uit 27,50 / 1,50 m² = € 18,33/m².
    const prijs = localUnitPriceForLine({
      product: mastvlag,
      widthCm: 200,
      heightCm: 100,
    });
    expect(prijs).toBeCloseTo(2 * MASTVLAG_PRIJS_PER_M2, 2);
  });
});

describe("verzenddrempel", () => {
  it("volgt de referentiedocs op € 150 incl btw", () => {
    expect(FREE_SHIPPING_THRESHOLD_INCL_VAT).toBe(150);
  });

  it("rekent onder de drempel verzendkosten en erboven niet", () => {
    expect(localShipping(FREE_SHIPPING_THRESHOLD - 0.01)).toBe(SHIPPING_FLAT);
    expect(localShipping(FREE_SHIPPING_THRESHOLD)).toBe(0);
  });
});
