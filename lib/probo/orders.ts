import "server-only";

import { proboRequest } from "./client";
import { OrderResponseSchema, OrderStatusResponseSchema } from "./schemas";
import type { ProboProductInput, ProboDeliveryInput } from "./products";

/**
 * Order placement and status polling against the Probo Reseller API.
 * Endpoints verified live: `POST /order`, `POST /order/status`.
 */

/**
 * A print file supplied by public URL, per Probo's "supply files for an order
 * request" flow. The `uri` must be publicly fetchable by Probo (we host it in
 * the public `order-artwork` Storage bucket).
 */
export interface ProboFileInput {
  /** Full public URL to the artwork (PDF/JPG/PNG). */
  uri: string;
  /** PDF page to use (default 1). */
  page?: number;
  /** Which side for double-sided products. */
  side?: "front" | "back";
}

/** A product line on an order — a configured product plus its artwork/uploader refs. */
export interface ProboOrderProductInput extends ProboProductInput {
  /**
   * Uploader session references (Probo white-label uploader). Not used in the
   * current build — we supply artwork by URL via {@link files} instead.
   */
  uploaders?: Array<{ id: number; external_id: number }>;
  /** Customer artwork supplied by public URL. */
  files?: ProboFileInput[];
}

/** Input for {@link createProboOrder}. */
export interface CreateProboOrderInput {
  /**
   * "test" places a non-billable test order; "normal" is a real order.
   * Defaults to "test" for now — flip the default (or always pass "normal")
   * once the flow is production-ready.
   */
  orderType?: "test" | "normal";
  /**
   * YOUR order id. REQUIRED by Probo (`required key [id] not found` otherwise).
   * It is echoed back and used to correlate the async accept/status callbacks.
   */
  id: string;
  reference?: string;
  contact_email?: string;
  error_email_addresses?: string[];
  /** URL(s) Probo calls back with status updates. */
  callback_url?: string[];
  deliveries: ProboDeliveryInput[];
  products: ProboOrderProductInput[];
}

/** Result of {@link createProboOrder}. */
export interface CreateProboOrderResult {
  /**
   * Best-available order identifier. Probo does NOT return its own
   * `supplier_order_number` synchronously (that arrives via callback), so this
   * falls back to the `id` you submitted — which is exactly the key you use to
   * match the later callback. Stringified.
   */
  proboOrderId: string;
  /** Top-level status, e.g. "queued" on a successful submit. */
  status: string;
  raw: unknown;
}

/**
 * Submit an order (`POST /order`). Returns HTTP 202 with `status: "queued"` on
 * success; Probo then processes and accepts it asynchronously.
 */
export async function createProboOrder(
  input: CreateProboOrderInput,
): Promise<CreateProboOrderResult> {
  const { orderType, ...rest } = input;
  const body: Record<string, unknown> = {
    // Default to a test order for now (non-billable). See CreateProboOrderInput.
    order_type: orderType ?? "test",
    ...rest,
  };
  const raw = await proboRequest("/order", { method: "POST", json: body });
  const parsed = OrderResponseSchema.parse(raw);

  const supplier = parsed.order?.supplier_order_number;
  const ownId = parsed.order?.id;
  const proboOrderId =
    supplier !== undefined && supplier !== null
      ? String(supplier)
      : ownId !== undefined && ownId !== null
        ? String(ownId)
        : input.id;

  return {
    proboOrderId,
    status: parsed.status ?? "unknown",
    raw,
  };
}

/** Result of {@link getProboOrderStatus}. */
export interface ProboOrderStatusResult {
  /** Per-order status string (e.g. "accepted", "shipment_delivered"). */
  status: string;
  /** Carrier name if known. Field naming is UNCERTAIN — see schemas.ts. */
  carrier: string | null;
  /** Track & trace URL if known. Field naming is UNCERTAIN — see schemas.ts. */
  trackingUrl: string | null;
  raw: unknown;
}

/**
 * Poll the status of an order (`POST /order/status`) by its Probo
 * `supplier_order_number`.
 *
 * The response is `{ orders: [...] }`; an unknown/not-yet-known order comes back
 * with an empty `orders` array, in which case `status` is "unknown".
 */
export async function getProboOrderStatus(
  proboOrderId: string,
): Promise<ProboOrderStatusResult> {
  const raw = await proboRequest("/order/status", {
    method: "POST",
    json: { orders: [{ supplier_order_number: proboOrderId }] },
  });
  const parsed = OrderStatusResponseSchema.parse(raw);
  const entry = parsed.orders?.[0];
  const pkg = entry?.shipped_packages?.[0];

  const carrier = entry?.carrier ?? pkg?.carrier ?? null;
  const trackingUrl =
    entry?.tracking_url ?? entry?.track_trace ?? pkg?.tracking_url ?? null;

  return {
    status: entry?.status ?? "unknown",
    carrier,
    trackingUrl,
    raw,
  };
}
