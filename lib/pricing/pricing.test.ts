import { describe, expect, it } from "vitest";

import { computeLinePrice, computeOrderTotals } from "@/lib/pricing";

describe("computeLinePrice", () => {
  it("applies a 50% markup to a round base price", () => {
    expect(computeLinePrice(10, 50)).toBe(15);
  });

  it("rounds to 2 decimals (cents) — 3.33 + 50%", () => {
    // 3.33 * 1.5 = 4.995 → 5.00 (rounds up at the half-cent).
    expect(computeLinePrice(3.33, 50)).toBe(5);
  });

  it("handles a 0% markup as a pass-through", () => {
    expect(computeLinePrice(12.34, 0)).toBe(12.34);
  });

  it("avoids floating-point drift", () => {
    // 0.1 * 1.5 = 0.15 exactly after round2, not 0.150000000000000002.
    expect(computeLinePrice(0.1, 50)).toBe(0.15);
  });
});

describe("computeOrderTotals", () => {
  it("computes known totals with packaging folded into shipping and 21% VAT", () => {
    const totals = computeOrderTotals({
      lines: [
        { unitPrice: 15, amount: 2 }, // 30
        { unitPrice: 10, amount: 1 }, // 10
      ],
      shippingPrice: 6.95,
      packagingPrice: 3.05, // → shipping 10.00
      vatRatePct: 21,
    });

    expect(totals.subtotalExVat).toBe(40);
    expect(totals.shippingCost).toBe(10);
    // (40 + 10) * 21% = 10.50
    expect(totals.vatAmount).toBe(10.5);
    expect(totals.total).toBe(60.5);
  });

  it("keeps total = subtotal + shipping + vat as an invariant", () => {
    const totals = computeOrderTotals({
      lines: [{ unitPrice: 3.33, amount: 3 }],
      shippingPrice: 4.99,
      packagingPrice: 1.01,
      vatRatePct: 19,
    });

    expect(totals.total).toBe(
      Math.round((totals.subtotalExVat + totals.shippingCost + totals.vatAmount) * 100) / 100,
    );
  });

  it("gives zero VAT when the rate is 0 (reverse charge / export)", () => {
    const totals = computeOrderTotals({
      lines: [{ unitPrice: 100, amount: 1 }],
      shippingPrice: 15,
      packagingPrice: 0,
      vatRatePct: 0,
    });

    expect(totals.vatAmount).toBe(0);
    expect(totals.total).toBe(115);
  });

  it("handles an empty basket", () => {
    const totals = computeOrderTotals({
      lines: [],
      shippingPrice: 0,
      packagingPrice: 0,
      vatRatePct: 21,
    });

    expect(totals).toEqual({ subtotalExVat: 0, shippingCost: 0, vatAmount: 0, total: 0 });
  });
});
