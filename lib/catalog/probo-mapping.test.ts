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
  it("maps size + 'Zoom met ringen' to the validated Probo chain", () => {
    const res = buildProboOptions("baniervlag", {
      widthCm: 250,
      heightCm: 100,
      amount: 2,
      selections: { Afwerking: "Zoom met ringen", Bevestiging: "Karabijnhaken" },
    });
    expect(res).not.toBeNull();
    expect(res!.productCode).toBe("flag-ciclo");
    expect(res!.options).toEqual([
      { code: "width", value: "250" },
      { code: "height", value: "100" },
      { code: "amount", value: "2" },
      { code: "finishing-all-sides" },
      { code: "band-and-plastic-rings" },
      { code: "every-corner" },
    ]);
    // Bevestiging has no Probo equivalent → recorded, not sent.
    expect(res!.unmapped).toEqual([
      { label: "Bevestiging", value: "Karabijnhaken" },
    ]);
    expect(res!.options.some((o) => o.code === "Karabijnhaken")).toBe(false);
  });

  it("maps 'Tunnelzoom' to a plain hem (no true tunnel in Probo)", () => {
    const res = buildProboOptions("baniervlag", {
      widthCm: 300,
      heightCm: 100,
      amount: 1,
      selections: { Afwerking: "Tunnelzoom", Bevestiging: "Spankoord" },
    });
    expect(res!.options).toContainEqual({ code: "hem" });
    expect(res!.options).not.toContainEqual({ code: "band-and-plastic-rings" });
  });
});

describe("buildProboOptions — mastvlag", () => {
  it("maps colour Wit → band-and-cord/white/200cm", () => {
    const res = buildProboOptions("mastvlag", {
      widthCm: 100,
      heightCm: 150,
      amount: 1,
      selections: {
        "Band- en koordkleur": "Wit",
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
    expect(res!.unmapped).toEqual([
      { label: "Ontwerpservice", value: "Eigen ontwerp" },
    ]);
  });

  it("maps colour Zwart → black code", () => {
    const res = buildProboOptions("mastvlag", {
      widthCm: 150,
      heightCm: 225,
      amount: 1,
      selections: { "Band- en koordkleur": "Zwart", Ontwerpservice: "Laat ontwerpen" },
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
      selections: { Mastzijde: "Links", Voet: "Kruisvoet" },
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
    // Voet is a cross-sell accessory → recorded, not sent.
    expect(res!.unmapped).toEqual([{ label: "Voet", value: "Kruisvoet" }]);
  });

  it("overrides to beachflag-square for a square size + maps Rechts", () => {
    const res = buildProboOptions("beachvlag", {
      widthCm: 75,
      heightCm: 300,
      amount: 1,
      selections: { Mastzijde: "Rechts", Voet: "Grondpin" },
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

  it("covers every catalogue size with a preset", () => {
    const product = getProduct("beachvlag")!;
    for (const size of product.sizes) {
      const res = buildProboOptions("beachvlag", {
        widthCm: size.widthCm!,
        heightCm: size.heightCm!,
        amount: 1,
        selections: { Mastzijde: "Links", Voet: "Grondpin" },
      });
      expect(res, `size ${size.label}`).not.toBeNull();
      expect(res!.productCode).toMatch(/^beachflag-(straight|square)$/);
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
