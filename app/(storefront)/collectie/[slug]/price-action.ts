"use server";

/**
 * Live-price server action for the product configurator.
 *
 * On every size/finishing/quantity change the client calls {@link getLivePrice}
 * (debounced). It maps the storefront selection to a valid Probo options array
 * (lib/catalog/probo-mapping), asks Probo for the purchase price, and applies the
 * standard resale markup — reusing the exact same building blocks as checkout so
 * the configurator price and the order price cannot drift.
 *
 * Identical requests are cached in-memory for a short TTL to soak up the rapid
 * calls a slider/qty-stepper produces. On any Probo failure the action returns
 * `ok:false` and the client falls back to the indicative "vanaf" price.
 */

import { getProduct, isOrderable } from "@/lib/catalog/products";
import { buildProboOptions } from "@/lib/catalog/probo-mapping";
import { getPrice } from "@/lib/probo/products";
import { computeLinePrice } from "@/lib/pricing";
import { DEFAULT_MARKUP_PCT } from "@/lib/orders/orchestration";

/**
 * A fixed NL delivery address. The product purchase price is delivery-independent
 * (shipping is priced separately at checkout), but Probo's /price wants a
 * delivery block — so we send a stable placeholder.
 */
const PRICE_ADDRESS = {
  first_name: "Prijs",
  last_name: "Indicatie",
  street: "Teststraat",
  house_number: "1",
  postal_code: "1000AA",
  city: "Amsterdam",
  country: "NL",
} as const;

export interface LivePriceInput {
  slug: string;
  widthCm: number;
  heightCm: number;
  amount: number;
  /** Storefront selections keyed by option label. */
  selections: Record<string, string>;
}

export interface LivePriceResult {
  ok: boolean;
  /** Sell price for the whole line (all `amount` units), ex VAT. */
  lineTotal?: number;
  /** Sell price per unit, ex VAT (lineTotal / amount, rounded). */
  unitPrice?: number;
  currency?: string;
}

/** Short-lived in-memory cache of identical price lookups. */
const CACHE = new Map<string, { value: LivePriceResult; expires: number }>();
const TTL_MS = 60_000;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function getLivePrice(
  input: LivePriceInput,
): Promise<LivePriceResult> {
  const product = getProduct(input.slug);
  if (
    !product ||
    !isOrderable(product) ||
    product.proboProductCode === null ||
    !Number.isFinite(input.widthCm) ||
    !Number.isFinite(input.heightCm) ||
    !Number.isInteger(input.amount) ||
    input.amount < 1
  ) {
    return { ok: false };
  }

  const mapped = buildProboOptions(input.slug, {
    widthCm: input.widthCm,
    heightCm: input.heightCm,
    amount: input.amount,
    selections: input.selections,
  });
  if (!mapped) return { ok: false };

  // The mapping decides the effective product code (e.g. a Squareflag size
  // routes to `beachflag-square` while the catalogue default is `-straight`).
  const products = [{ code: mapped.productCode, options: mapped.options }];
  const cacheKey = JSON.stringify(products);

  const cached = CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expires > now) return cached.value;

  try {
    const price = await getPrice({
      products,
      deliveries: [{ address: PRICE_ADDRESS }],
    });
    const lineTotal = computeLinePrice(price.purchasePrice, DEFAULT_MARKUP_PCT);
    const value: LivePriceResult = {
      ok: lineTotal > 0,
      lineTotal,
      unitPrice: round2(lineTotal / input.amount),
      currency: price.currency,
    };
    if (value.ok) CACHE.set(cacheKey, { value, expires: now + TTL_MS });
    return value;
  } catch {
    // Probo unreachable / config rejected → let the client show the indicative price.
    return { ok: false };
  }
}
