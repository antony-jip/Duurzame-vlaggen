import { describe, expect, it } from "vitest";
import {
  assignedQuantity,
  cartDesignsComplete,
  designStatus,
  normalizeCartItem,
  type CartDesign,
  type CartItem,
} from "@/components/cart/types";

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "line-1",
    slug: "baniervlag",
    name: "Baniervlag",
    proboProductCode: "flag-ciclo",
    options: [],
    amount: 6,
    unitPriceEstimate: 38,
    sizeLabel: "250 × 100 cm",
    designs: [],
    ...overrides,
  };
}

function design(overrides: Partial<CartDesign> = {}): CartDesign {
  return {
    id: "d1",
    quantity: 1,
    fileUrl: "https://x.supabase.co/storage/v1/object/public/order-artwork/a.pdf",
    fileName: "a.pdf",
    filePath: "a.pdf",
    fileWarnings: [],
    ...overrides,
  };
}

describe("design-toewijzingsstatus", () => {
  it("telt toegewezen aantallen over de designs op", () => {
    const it6 = item({
      designs: [design({ quantity: 2 }), design({ id: "d2", quantity: 3 })],
    });
    expect(assignedQuantity(it6)).toBe(5);
    expect(designStatus(it6)).toEqual({
      assigned: 5,
      missing: 1,
      over: 0,
      complete: false,
    });
  });

  it("is pas compleet als de som EXACT gelijk is aan het aantal", () => {
    const exact = item({
      designs: [design({ quantity: 2 }), design({ id: "d2", quantity: 4 })],
    });
    expect(designStatus(exact).complete).toBe(true);

    const over = item({
      designs: [design({ quantity: 4 }), design({ id: "d2", quantity: 4 })],
    });
    expect(designStatus(over)).toMatchObject({ complete: false, over: 2 });
  });

  it("telt 'later aanleveren'-slots (fileUrl null) mee als toegewezen", () => {
    const later = item({
      designs: [
        design({ quantity: 2 }),
        design({ id: "d2", quantity: 4, fileUrl: null, filePath: null, fileName: null }),
      ],
    });
    expect(designStatus(later).complete).toBe(true);
  });

  it("mand is compleet als elke bestelbare regel compleet is (offerte-only telt niet)", () => {
    const done = item({ designs: [design({ quantity: 6 })] });
    const quoteOnly = item({ id: "q", proboProductCode: null, designs: [] });
    expect(cartDesignsComplete([done, quoteOnly])).toBe(true);
    expect(cartDesignsComplete([done, item({ id: "open" })])).toBe(false);
  });
});

describe("normalizeCartItem (migratie oude manden)", () => {
  it("zet een legacy fileUrl om naar één design over het hele aantal", () => {
    const legacy = item({
      designs: undefined,
      fileUrl: "https://x/order-artwork/f.png",
      fileName: "f.png",
      filePath: "f.png",
      fileWarnings: ["lage resolutie"],
      previewUrl: "data:image/png;base64,AAA",
    });
    const normalized = normalizeCartItem(legacy);
    expect(normalized.designs).toHaveLength(1);
    expect(normalized.designs?.[0]).toMatchObject({
      quantity: 6,
      fileUrl: "https://x/order-artwork/f.png",
      fileName: "f.png",
      previewUrl: "data:image/png;base64,AAA",
      fileWarnings: ["lage resolutie"],
    });
    expect(normalized.fileUrl).toBeUndefined();
    expect(normalized.previewUrl).toBeUndefined();
  });

  it("geeft een legacy regel zonder bestand een lege designlijst", () => {
    const normalized = normalizeCartItem(item({ designs: undefined }));
    expect(normalized.designs).toEqual([]);
  });

  it("laat een al genormaliseerde regel ongemoeid", () => {
    const current = item({ designs: [design({ quantity: 6 })] });
    expect(normalizeCartItem(current)).toBe(current);
  });
});
