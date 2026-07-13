import "server-only";

import { z } from "zod";

/**
 * Zod schemas for the Probo Reseller API responses, plus inferred TypeScript
 * types.
 *
 * The schemas are intentionally TOLERANT — every object uses `z.looseObject`
 * (unknown keys pass through) and most fields are optional/nullable. Probo's
 * responses are large and evolve; we validate the handful of fields we depend
 * on and keep the raw body around for debugging, so a minor API change never
 * crashes an order flow.
 *
 * Field names were verified against the LIVE test API (GET /products,
 * POST /products/configure, POST /price, POST /order, POST /order/status).
 * Where a field could not be confirmed live, a comment flags it as UNCERTAIN.
 *
 * Note: numeric ids (`calculation_id`, uploader `id`/`external_id`) come back
 * as JSON numbers on the live API. Schemas accept `number | string` so the
 * module keeps working if Probo ever switches them to strings.
 */

const numberOrString = z.union([z.number(), z.string()]);

// ---------------------------------------------------------------------------
// GET /products
// ---------------------------------------------------------------------------

/** One entry from the `data` array of `GET /products`. */
export const ProboProductSchema = z.looseObject({
  code: z.string(),
  active: z.boolean().optional(),
  active_to: z.string().nullable().optional(),
  replaced_by_product: z.string().nullable().optional(),
  article_group_name: z.string().nullable().optional(),
  unit_code: numberOrString.nullable().optional(),
  translations: z
    .record(
      z.string(),
      z.looseObject({
        title: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      }),
    )
    .optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type ProboProduct = z.infer<typeof ProboProductSchema>;

/** Pagination block returned alongside `data`. */
export const ProboMetaSchema = z.looseObject({
  page: z.number().optional(),
  pages: z.number().optional(),
  items: z.number().optional(),
  per_page: z.number().optional(),
});
export type ProboMeta = z.infer<typeof ProboMetaSchema>;

/** Full `GET /products` response. */
export const ProductsResponseSchema = z.looseObject({
  meta: ProboMetaSchema.optional(),
  data: z.array(ProboProductSchema),
});
export type ProductsResponse = z.infer<typeof ProductsResponseSchema>;

// ---------------------------------------------------------------------------
// POST /products/configure
// ---------------------------------------------------------------------------

/** One configured product in the `products` array of the configure response. */
export const ConfiguredProductSchema = z.looseObject({
  id: z.number().optional(),
  code: z.string().optional(),
  can_order: z.boolean().nullable().optional(),
  amount: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  length: z.number().nullable().optional(),
  available_options: z.array(z.unknown()).optional(),
  selected_options: z.array(z.unknown()).optional(),
  uploaders: z.array(z.unknown()).optional(),
});
export type ConfiguredProduct = z.infer<typeof ConfiguredProductSchema>;

/**
 * `POST /products/configure` response.
 *
 * IMPORTANT: `calculation_id` is only present once the product is fully
 * configured (`can_order === true`). While options are still being selected it
 * is absent — hence optional here. On the live API it is a NUMBER.
 */
export const ConfigureResponseSchema = z.looseObject({
  status: z.string().optional(),
  code: numberOrString.optional(),
  message: z.string().optional(),
  products: z.array(ConfiguredProductSchema).optional(),
  calculation_id: numberOrString.optional(),
});
export type ConfigureResponse = z.infer<typeof ConfigureResponseSchema>;

// ---------------------------------------------------------------------------
// POST /price
// ---------------------------------------------------------------------------

/**
 * Per-delivery price block. `purchase_packaging_price` and
 * `purchase_shipping_price` live here (NOT at the top level of a price entry).
 */
export const DeliveryPricesSchema = z.looseObject({
  purchase_base_price: z.number().optional(),
  purchase_rush_surcharge: z.number().optional(),
  purchase_packaging_price: z.number().optional(),
  purchase_shipping_price: z.number().optional(),
  purchase_price: z.number().optional(),
  purchase_price_incl_vat: z.number().optional(),
  sales_price: z.number().nullable().optional(),
  sales_price_incl_vat: z.number().nullable().optional(),
});
export type DeliveryPrices = z.infer<typeof DeliveryPricesSchema>;

export const PriceDeliverySchema = z.looseObject({
  shipping_method_api_code: z.string().nullable().optional(),
  shipping_method_name: z.string().nullable().optional(),
  transit_days: z.number().nullable().optional(),
  prices: DeliveryPricesSchema.optional(),
});
export type PriceDelivery = z.infer<typeof PriceDeliverySchema>;

/** One entry from the `prices` array. Product totals live here. */
export const PriceEntrySchema = z.looseObject({
  products_purchase_base_price: z.number().optional(),
  products_purchase_rush_surcharge: z.number().optional(),
  products_purchase_price: z.number().optional(),
  products_purchase_price_incl_vat: z.number().optional(),
  products_sales_price: z.number().nullable().optional(),
  products_sales_price_incl_vat: z.number().nullable().optional(),
  delivery_date: z.string().nullable().optional(),
  final_delivery_date: z.string().nullable().optional(),
  shipping_date: z.string().nullable().optional(),
  production_hours: z.number().nullable().optional(),
  deliveries: z.array(PriceDeliverySchema).optional(),
});
export type PriceEntry = z.infer<typeof PriceEntrySchema>;

/**
 * `POST /price` response.
 *
 * NOTE: there is NO `currency` field in the live response — Probo prices are in
 * EUR. `calculation_id` (a NUMBER) is returned here and is the one you pass to
 * the order/uploader flow.
 */
export const PriceResponseSchema = z.looseObject({
  status: z.string().optional(),
  code: numberOrString.optional(),
  message: z.string().optional(),
  calculation_id: numberOrString.optional(),
  prices: z.array(PriceEntrySchema).optional(),
});
export type PriceResponse = z.infer<typeof PriceResponseSchema>;

// ---------------------------------------------------------------------------
// POST /order
// ---------------------------------------------------------------------------

/**
 * `POST /order` response (HTTP 202, `status: "queued"`).
 *
 * The synchronous body echoes back OUR `order.id` and `reference`. Probo's own
 * `supplier_order_number` is NOT returned here — it arrives asynchronously via
 * a callback once the order is accepted. `supplier_order_number` is included
 * optionally in case a future API version returns it synchronously.
 */
export const OrderResponseSchema = z.looseObject({
  status: z.string().optional(),
  code: numberOrString.optional(),
  message: z.string().optional(),
  errors: z.unknown().optional(),
  order: z
    .looseObject({
      id: numberOrString.nullable().optional(),
      reference: z.string().nullable().optional(),
      supplier_order_number: numberOrString.nullable().optional(),
    })
    .optional(),
});
export type OrderResponse = z.infer<typeof OrderResponseSchema>;

// ---------------------------------------------------------------------------
// POST /order/status
// ---------------------------------------------------------------------------

/**
 * One entry from the `orders` array of `POST /order/status`.
 *
 * UNCERTAIN: the per-order element shape is not documented and could not be
 * confirmed live (the test account has no shippable orders). Field names below
 * are best-effort, cross-referenced with the callbacks guide
 * (`shipped_packages[].tracking_url`, `barcode`). Kept fully tolerant.
 */
export const OrderStatusEntrySchema = z.looseObject({
  id: numberOrString.nullable().optional(),
  reference: z.string().nullable().optional(),
  supplier_order_number: numberOrString.nullable().optional(),
  status: z.string().nullable().optional(),
  // Carrier / track & trace naming is UNCERTAIN — try several plausible keys.
  carrier: z.string().nullable().optional(),
  track_trace: z.string().nullable().optional(),
  tracking_url: z.string().nullable().optional(),
  shipped_packages: z
    .array(
      z.looseObject({
        tracking_url: z.string().nullable().optional(),
        barcode: z.string().nullable().optional(),
        carrier: z.string().nullable().optional(),
      }),
    )
    .optional(),
});
export type OrderStatusEntry = z.infer<typeof OrderStatusEntrySchema>;

/** Full `POST /order/status` response. */
export const OrderStatusResponseSchema = z.looseObject({
  status: z.string().optional(),
  message: z.string().optional(),
  orders: z.array(OrderStatusEntrySchema).optional(),
});
export type OrderStatusResponse = z.infer<typeof OrderStatusResponseSchema>;

// ---------------------------------------------------------------------------
// Uploader session (endpoint UNCONFIRMED — see uploader.ts)
// ---------------------------------------------------------------------------

/**
 * Uploader-session response shape, per the "White label uploader" guide. The
 * exact endpoint path/method could NOT be confirmed live (all probed paths
 * 404'd), so this schema documents the expected body but is not exercised.
 */
export const UploaderResponseSchema = z.looseObject({
  status: z.string().optional(),
  id: numberOrString.optional(),
  external_id: numberOrString.optional(),
  calculation_id: numberOrString.optional(),
  callback_url: z.string().nullable().optional(),
});
export type UploaderResponse = z.infer<typeof UploaderResponseSchema>;
