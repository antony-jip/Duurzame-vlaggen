import { describe, expect, it } from "vitest";
import { getProduct } from "@/lib/catalog/products";
import {
  DESIGN_SERVICE_PRICE,
  getSize,
  localLinePrice,
  localUnitPriceForLine,
  ontwerpserviceVoorOrder,
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
    expect(prijs).toBeCloseTo(122.67, 2);
  });

  it("laat een gewone catalogusmaat ongemoeid", () => {
    const size = mastvlag.sizes[0];
    const prijs = localUnitPriceForLine({
      product: mastvlag,
      size: getSize(mastvlag, size.label),
      widthCm: size.widthCm,
      heightCm: size.heightCm,
    });
    expect(prijs).toBe(23);
  });

  it("vouwt de eigen maat door in de regelprijs, mét staffel", () => {
    const regel = localLinePrice({
      product: mastvlag,
      size: getSize(mastvlag, "Eigen: 400 × 200 cm"),
      widthCm: 400,
      heightCm: 200,
      amount: 5, // 5% staffel
    });
    expect(regel).toBeCloseTo(122.67 * 5 * 0.95, 1);
  });
});

describe("ontwerpservice", () => {
  it("telt niet mee als niemand hem koos", () => {
    expect(ontwerpserviceVoorOrder([{ selections: { Mastzijde: "Links" } }])).toBe(0);
    expect(ontwerpserviceVoorOrder([{}])).toBe(0);
  });

  it("herkent de menselijke waarde uit de configurator", () => {
    // De configurator zet letterlijk `Ja (+€ 85,00)` op de regel.
    expect(
      ontwerpserviceVoorOrder([{ selections: { Ontwerpservice: "Ja (+€ 85,00)" } }]),
    ).toBe(DESIGN_SERVICE_PRICE);
  });

  it("rekent eenmalig per order, niet per regel", () => {
    const drieRegels = Array.from({ length: 3 }, () => ({
      selections: { Ontwerpservice: "Ja (+€ 85,00)" },
    }));
    expect(ontwerpserviceVoorOrder(drieRegels)).toBe(DESIGN_SERVICE_PRICE);
  });
});
