/**
 * Pricing math — line prices and order totals.
 *
 * All amounts are ex-VAT and stored as Postgres `numeric(12,2)` (2 decimals).
 * We compute in cents (`Math.round(n * 100) / 100`) to avoid floating-point
 * drift when summing/marking-up money.
 */

/** Round to 2 decimals via integer cents to dodge binary floating-point error. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Sell price for a line from the Probo purchase price and a markup percentage.
 *
 * @param basePrice  Probo `purchase_price` (ex-VAT).
 * @param markupPct  Markup in percent (caller supplies it; default 50 lives at
 *                   the call site, not here).
 * @returns basePrice increased by `markupPct`, rounded to 2 decimals.
 */
export function computeLinePrice(basePrice: number, markupPct: number): number {
  return round2(basePrice * (1 + markupPct / 100));
}

export interface OrderLine {
  /** Ex-VAT price per unit. */
  unitPrice: number;
  /** Quantity. */
  amount: number;
}

export interface ComputeOrderTotalsInput {
  lines: OrderLine[];
  /** Shipping cost ex-VAT. */
  shippingPrice: number;
  /** Packaging cost ex-VAT — added to shipping (FIXED product decision). */
  packagingPrice: number;
  /** VAT rate to apply, in percent. */
  vatRatePct: number;
}

export interface OrderTotals {
  subtotalExVat: number;
  shippingCost: number;
  vatAmount: number;
  total: number;
}

/**
 * Compute order totals from lines, shipping, packaging and a VAT rate.
 *
 * Fixed choices:
 *  - Packaging is folded into shipping cost (not a separate line).
 *  - VAT base = subtotal + shipping (so shipping is taxed).
 *  - `total` = subtotal + shipping + VAT.
 */
export function computeOrderTotals(input: ComputeOrderTotalsInput): OrderTotals {
  const { lines, shippingPrice, packagingPrice, vatRatePct } = input;

  const subtotalExVat = round2(
    lines.reduce((sum, line) => sum + line.unitPrice * line.amount, 0),
  );
  const shippingCost = round2(shippingPrice + packagingPrice);
  const vatAmount = round2(((subtotalExVat + shippingCost) * vatRatePct) / 100);
  const total = round2(subtotalExVat + shippingCost + vatAmount);

  return { subtotalExVat, shippingCost, vatAmount, total };
}
