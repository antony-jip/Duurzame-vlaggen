import { describe, expect, it } from "vitest";

import { getProduct } from "@/lib/catalog/products";
import {
  formatArtikelDeel,
  localAccessoiresTotal,
  parseArtikelDeel,
  volgAccessoiresMetAantal,
} from "./local-catalog";

/**
 * Accessoires en het vlaggenaantal. De klacht die dit afdekt: "bij de
 * berekening wordt telkens 1 accessoire meegeteld in plaats van hetzelfde
 * aantal als het aantal gewenste vlaggen".
 */
describe("volgAccessoiresMetAantal", () => {
  const opties = (acc: string) => [
    { code: "Formaat", value: "Straight Small — 80 × 220 cm" },
    { code: "Samenstelling", value: "Vlag + stok" },
    { code: "Accessoires", value: acc },
  ];

  it("laat accessoires meeschuiven die het vlaggenaantal volgden", () => {
    const out = volgAccessoiresMetAantal(opties("5× Kruisvoet"), 5, 8);
    expect(out[2].value).toBe("8× Kruisvoet");
  });

  it("neemt een kaal accessoire (1 stuk bij 1 vlag) mee naar het nieuwe aantal", () => {
    const out = volgAccessoiresMetAantal(opties("Kruisvoet"), 1, 3);
    expect(out[2].value).toBe("3× Kruisvoet");
  });

  it("laat een handmatig afwijkend aantal met rust", () => {
    const out = volgAccessoiresMetAantal(
      opties("5× Kruisvoet · 2× Waterzak Zwart"),
      5,
      10,
    );
    expect(out[2].value).toBe("10× Kruisvoet · 2× Waterzak Zwart");
  });

  it("schrijft terug naar de kale vorm als het nieuwe aantal 1 is", () => {
    const out = volgAccessoiresMetAantal(opties("4× Grondpen"), 4, 1);
    expect(out[2].value).toBe("Grondpen");
  });

  it("raakt andere opties en regels zonder accessoires niet aan", () => {
    const input = opties("3× Grondpen");
    const out = volgAccessoiresMetAantal(input, 3, 6);
    expect(out[0]).toBe(input[0]);
    expect(out[1]).toBe(input[1]);
    const zonder = input.slice(0, 2);
    expect(volgAccessoiresMetAantal(zonder, 3, 6)).toEqual(zonder);
  });

  it("geeft dezelfde array terug als het aantal niet wijzigt", () => {
    const input = opties("3× Grondpen");
    expect(volgAccessoiresMetAantal(input, 3, 3)).toBe(input);
  });

  it("rekent het meegeschoven aantal ook echt af", () => {
    const product = getProduct("beachvlag")!;
    const out = volgAccessoiresMetAantal(opties("Kruisvoet"), 1, 5);
    const selections = Object.fromEntries(
      out.map((o) => [o.code, String(o.value ?? "")]),
    );
    // 5 × €27 = €135, niet 1 × €27.
    expect(localAccessoiresTotal(product, selections)).toBe(135);
  });
});

describe("parseArtikelDeel / formatArtikelDeel", () => {
  it("zijn elkaars omgekeerde", () => {
    expect(parseArtikelDeel("2× Kruisvoet")).toEqual({ qty: 2, name: "Kruisvoet" });
    expect(parseArtikelDeel("Kruisvoet")).toEqual({ qty: 1, name: "Kruisvoet" });
    expect(formatArtikelDeel(2, "Kruisvoet")).toBe("2× Kruisvoet");
    expect(formatArtikelDeel(1, "Kruisvoet")).toBe("Kruisvoet");
  });
});
