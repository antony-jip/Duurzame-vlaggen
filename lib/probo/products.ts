import "server-only";

import { proboRequest } from "./client";
import {
  ConfigureResponseSchema,
  PriceResponseSchema,
  ProductsResponseSchema,
  type ProboProduct,
  type ProboMeta,
} from "./schemas";

/**
 * Product catalogue, configuration and pricing calls against the Probo Reseller
 * API. Every function validates the response with a tolerant zod schema and
 * always returns the parsed `raw` body for debugging.
 */

// ---------------------------------------------------------------------------
// Shared input shapes
// ---------------------------------------------------------------------------

/** A delivery address as Probo expects it in configure/price/order requests. */
export interface ProboAddress {
  company_name?: string;
  first_name?: string;
  last_name?: string;
  street?: string;
  house_number?: string;
  addition?: string;
  postal_code?: string;
  city?: string;
  country?: string;
}

/** A single option selection for a configurable product. */
export interface ProboOptionInput {
  code: string;
  /** Some options are boolean-style flags and carry no value. */
  value?: string | number;
}

/**
 * A product line for configure/price. Use `code` + `options` for a configurable
 * product, or `customer_code` for a pre-composed ("customer") product.
 */
export interface ProboProductInput {
  code?: string;
  customer_code?: string;
  options?: ProboOptionInput[];
}

/** A delivery block for the price/order request. */
export interface ProboDeliveryInput {
  address: ProboAddress;
  delivery_date_preset?: string;
  shipping_method_preset?: string;
}

// ---------------------------------------------------------------------------
// GET /products
// ---------------------------------------------------------------------------

/** Result of {@link getProducts}: the product page plus its pagination meta. */
export interface GetProductsResult {
  data: ProboProduct[];
  meta: ProboMeta | undefined;
  raw: unknown;
}

/**
 * Fetch a page of the Probo product catalogue (`GET /products`).
 *
 * Pass query params such as `{ page: 2, per_page: 50 }` to paginate; the
 * response's `meta` carries `page`/`pages`/`items`/`per_page`.
 */
export async function getProducts(
  params?: Record<string, string | number>,
): Promise<GetProductsResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    query.set(key, String(value));
  }
  const qs = query.toString();
  const raw = await proboRequest(`/products${qs ? `?${qs}` : ""}`);
  const parsed = ProductsResponseSchema.parse(raw);
  return { data: parsed.data, meta: parsed.meta, raw };
}

// ---------------------------------------------------------------------------
// POST /products/configure
// ---------------------------------------------------------------------------

/** Input for {@link configureProduct} — mirrors the configure request body. */
export interface ConfigureInput {
  /** ISO language code (e.g. "nl", "en"). Defaults to "nl". */
  language?: string;
  products: ProboProductInput[];
}

/** Result of {@link configureProduct}. */
export interface ConfigureResult {
  /**
   * The `calculation_id` (stringified). NOTE: it is only returned once every
   * product is fully configured (`can_order === true`); until then it is an
   * empty string. Inspect `raw` / `available_options` to drive further steps.
   */
  calculationId: string;
  raw: unknown;
}

/**
 * Configure one or more products (`POST /products/configure`). Returns the
 * `calculation_id` needed for pricing and ordering.
 */
export async function configureProduct(
  input: ConfigureInput,
): Promise<ConfigureResult> {
  const body = {
    language: input.language ?? "nl",
    products: input.products,
  };
  const raw = await proboRequest("/products/configure", {
    method: "POST",
    json: body,
  });
  const parsed = ConfigureResponseSchema.parse(raw);
  // calculation_id is absent while options are still being selected → "".
  const calculationId =
    parsed.calculation_id === undefined ? "" : String(parsed.calculation_id);
  return { calculationId, raw };
}

// ---------------------------------------------------------------------------
// POST /price
// ---------------------------------------------------------------------------

/** Input for {@link getPrice} — mirrors the price request body. */
export interface PriceInput {
  products: ProboProductInput[];
  deliveries?: ProboDeliveryInput[];
}

/** Normalised price result. All money values are in EUR (see `currency`). */
export interface PriceResult {
  /** `products_purchase_price` — what we pay Probo (ex VAT). 0 if missing. */
  purchasePrice: number;
  /** `products_sales_price` — Probo's suggested resale price. null if missing. */
  salesPrice: number | null;
  /** `purchase_shipping_price` of the (cheapest) delivery. 0 if missing. */
  shippingPrice: number;
  /** `purchase_packaging_price` of the (cheapest) delivery. 0 if missing. */
  packagingPrice: number;
  /** Always "EUR": the API returns no currency field and prices are in EUR. */
  currency: string;
  raw: unknown;
}

/**
 * Get a price for a configured product set (`POST /price`).
 *
 * Maps Probo's fields onto a flat, normalised shape. Product totals come from
 * the first `prices` entry; shipping/packaging come from that entry's first
 * `deliveries` block (Probo returns delivery options cheapest-first).
 */
export async function getPrice(input: PriceInput): Promise<PriceResult> {
  const raw = await proboRequest("/price", { method: "POST", json: input });
  const parsed = PriceResponseSchema.parse(raw);

  const entry = parsed.prices?.[0];
  const delivery = entry?.deliveries?.[0]?.prices;

  return {
    purchasePrice: entry?.products_purchase_price ?? 0,
    salesPrice: entry?.products_sales_price ?? null,
    shippingPrice: delivery?.purchase_shipping_price ?? 0,
    packagingPrice: delivery?.purchase_packaging_price ?? 0,
    // No currency field exists in the response; Probo bills in EUR.
    currency: "EUR",
    raw,
  };
}
