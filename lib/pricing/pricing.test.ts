import { describe, expect, it } from "vitest";

import { computeOrderTotals } from "@/lib/pricing";

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
