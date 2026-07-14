import { describe, expect, it } from "vitest";

import {
  MAPPED_SLUGS,
  buildProboOptions,
  hasProboMapping,
} from "./probo-mapping";
import { getAllProducts, getProduct, isOrderable } from "./products";

/**
 * Unit tests for the storefront → Probo option mapping. The option *codes*
 * asserted here were verified live against the Probo TEST API (2026-07-13);
 * these tests lock the pure mapping (size/finishing → options-array) so a code
 * change to the mapping can't silently break the order payload.
 */

describe("buildProboOptions — baniervlag", () => {
  it("maps size + 'Tunnel' to the validated chain; Mastzijde/Bandkleur ride along unmapped", () => {
    const res = buildProboOptions("baniervlag", {
      widthCm: 100,
      heightCm: 300,
      amount: 2,
      selections: { Mastzijde: "Links", Afwerking: "Tunnel", Bandkleur: "Wit" },
    });
    expect(res).not.toBeNull();
    expect(res!.productCode).toBe("flag-ciclo");
    expect(res!.options).toEqual([
      { code: "width", value: "100" },
      { code: "height", value: "300" },
      { code: "amount", value: "2" },
      { code: "finishing-all-sides" },
      { code: "hem" },
    ]);
    // Mastzijde/Bandkleur hebben (nog) geen geverifieerde code → recorded, not sent.
    expect(res!.unmapped).toEqual(
      expect.arrayContaining([
        { label: "Mastzijde", value: "Links" },
        { label: "Bandkleur", value: "Wit" },
      ]),
    );
    expect(res!.options.some((o) => o.code === "Links" || o.code === "Wit")).toBe(false);
  });

  it("maps 'Geen' afwerking to a plain hem too (no raw-cut code verified)", () => {
    const res = buildProboOptions("baniervlag", {
      widthCm: 125,
      heightCm: 400,
      amount: 1,
      selections: { Afwerking: "Geen" },
    });
    expect(res!.options).toContainEqual({ code: "hem" });
    expect(res!.options).not.toContainEqual({ code: "band-and-plastic-rings" });
  });

  it("records selections whose label is missing from the mapping (never silently drops)", () => {
    const res = buildProboOptions("baniervlag", {
      widthCm: 100,
      heightCm: 200,
      amount: 1,
      selections: { Afwerking: "Tunnel", Ontwerpservice: "Ja (+€ 85,00)" },
    });
    expect(res!.unmapped).toContainEqual({
      label: "Ontwerpservice",
      value: "Ja (+€ 85,00)",
    });
  });
});

describe("buildProboOptions — mastvlag", () => {
  it("maps colour Wit → band-and-cord/white/200cm", () => {
    const res = buildProboOptions("mastvlag", {
      widthCm: 100,
      heightCm: 150,
      amount: 1,
      selections: {
        Mastzijde: "Links",
        Afwerking: "Koord/Lus",
        Kleur: "Wit",
        Ontwerpservice: "Eigen ontwerp",
      },
    });
    expect(res!.productCode).toBe("flag-ciclo");
    expect(res!.options).toEqual([
      { code: "width", value: "100" },
      { code: "height", value: "150" },
      { code: "amount", value: "1" },
      { code: "finishing-all-sides" },
      { code: "band-and-cord" },
      { code: "white" },
      { code: "200cm" },
    ]);
    // Mastzijde en Afwerking hebben geen geverifieerde code → ride-along unmapped.
    expect(res!.unmapped).toEqual([
      { label: "Mastzijde", value: "Links" },
      { label: "Afwerking", value: "Koord/Lus" },
      { label: "Ontwerpservice", value: "Eigen ontwerp" },
    ]);
  });

  it("maps colour Zwart → black code", () => {
    const res = buildProboOptions("mastvlag", {
      widthCm: 150,
      heightCm: 225,
      amount: 1,
      selections: { Kleur: "Zwart", Ontwerpservice: "Laat ontwerpen" },
    });
    expect(res!.options).toContainEqual({ code: "black" });
  });
});

describe("buildProboOptions — beachvlag (preset sizes)", () => {
  it("maps a straight size to beachflag-straight with the validated chain", () => {
    const res = buildProboOptions("beachvlag", {
      widthCm: 65,
      heightCm: 315,
      amount: 2,
      selections: { Mastzijde: "Links", Accessoires: "Kruisvoet" },
    });
    expect(res).not.toBeNull();
    expect(res!.productCode).toBe("beachflag-straight");
    expect(res!.options).toEqual([
      { code: "amount", value: "2" },
      { code: "flag-ciclo" },
      { code: "65x315cm" },
      { code: "left" },
      { code: "flag-stick-bag-deluxe" },
    ]);
    // Accessoire is cross-sell → recorded, not sent.
    expect(res!.unmapped).toEqual([{ label: "Accessoires", value: "Kruisvoet" }]);
  });

  it("overrides to beachflag-square for a square size + maps Rechts", () => {
    const res = buildProboOptions("beachvlag", {
      widthCm: 75,
      heightCm: 300,
      amount: 1,
      selections: { Mastzijde: "Rechts", Accessoires: "Grondpen" },
    });
    expect(res!.productCode).toBe("beachflag-square");
    expect(res!.options).toEqual([
      { code: "amount", value: "1" },
      { code: "flag-ciclo" },
      { code: "75x300cm" },
      { code: "right" },
      { code: "flag-stick-bag-deluxe" },
    ]);
  });

  it("returns null for an unknown size (never guesses a preset code)", () => {
    expect(
      buildProboOptions("beachvlag", {
        widthCm: 60,
        heightCm: 200,
        amount: 1,
        selections: { Mastzijde: "Links" },
      }),
    ).toBeNull();
  });

  it("covers every online-bestelbare size with a preset (quoteOnly excluded)", () => {
    const product = getProduct("beachvlag")!;
    for (const size of product.sizes) {
      const res = buildProboOptions("beachvlag", {
        widthCm: size.widthCm!,
        heightCm: size.heightCm!,
        amount: 1,
        selections: { Mastzijde: "Links", Accessoires: "Grondpen" },
      });
      if (size.quoteOnly) {
        // Op-aanvraag-maten (geen geverifieerde Probo-preset) horen null te geven.
        expect(res, `quoteOnly size ${size.label}`).toBeNull();
      } else {
        expect(res, `size ${size.label}`).not.toBeNull();
        expect(res!.productCode).toMatch(/^beachflag-(straight|square)$/);
      }
    }
  });
});

describe("buildProboOptions — gevelvlag (preset sizes)", () => {
  it("maps size + Mastzijde to the validated facade-flag chain", () => {
    const res = buildProboOptions("gevelvlag", {
      widthCm: 100,
      heightCm: 70,
      amount: 3,
      selections: { Mastzijde: "Links", Uithouder: "Met uithouder" },
    });
    expect(res).not.toBeNull();
    expect(res!.productCode).toBe("facade-flag");
    expect(res!.options).toEqual([
      { code: "amount", value: "3" },
      { code: "flag-ciclo" },
      { code: "100x70cm" },
      { code: "left" },
      { code: "landscape-strap-cord-loop" },
    ]);
    // The bracket is our own cross-sell → recorded, not sent.
    expect(res!.unmapped).toEqual([
      { label: "Uithouder", value: "Met uithouder" },
    ]);
  });

  it("covers every catalogue size with a preset", () => {
    const product = getProduct("gevelvlag")!;
    for (const size of product.sizes) {
      const res = buildProboOptions("gevelvlag", {
        widthCm: size.widthCm!,
        heightCm: size.heightCm!,
        amount: 1,
        selections: { Mastzijde: "Rechts", Uithouder: "Zonder" },
      });
      expect(res, `size ${size.label}`).not.toBeNull();
      expect(res!.options).toContainEqual({ code: "right" });
    }
  });
});

describe("buildProboOptions — guards", () => {
  it("returns null for a product without a mapping", () => {
    expect(
      buildProboOptions("vlaggenmast", {
        widthCm: 0,
        heightCm: 0,
        amount: 1,
        selections: {},
      }),
    ).toBeNull();
    expect(hasProboMapping("vlaggenmast")).toBe(false);
  });

  it("records an unknown choice as unmapped instead of emitting a bad code", () => {
    const res = buildProboOptions("baniervlag", {
      widthCm: 250,
      heightCm: 100,
      amount: 1,
      selections: { Afwerking: "Iets nieuws" },
    });
    expect(res!.unmapped).toContainEqual({
      label: "Afwerking",
      value: "Iets nieuws",
    });
  });
});

describe("mapping ↔ catalogue agreement", () => {
  it("every mapped slug is an orderable catalogue product and vice-versa", () => {
    const orderableSlugs = getAllProducts()
      .filter((p) => isOrderable(p))
      .map((p) => p.slug)
      .sort();
    expect([...MAPPED_SLUGS].sort()).toEqual(orderableSlugs);
  });
});
