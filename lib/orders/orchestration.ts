import "server-only";

import type { Market } from "@/config/domains";
import { publicEnv } from "@/lib/env";
import type { Json, OrderRow } from "@/lib/db/types";

import { configureProduct, getPrice } from "@/lib/probo/products";
import type { ProboAddress, ProboOptionInput } from "@/lib/probo/products";
import { createProboOrder } from "@/lib/probo/orders";
import { createPayment, getPayment } from "@/lib/mollie/payments";
import { computeVat } from "@/lib/vat";
import { computeLinePrice, computeOrderTotals } from "@/lib/pricing";

import {
  advanceOrderStatus,
  getOrderById,
  getOrderByMolliePaymentId,
  getOrderItems,
  insertOrderWithItems,
  recordEventOnce,
} from "@/lib/orders/repository";

/**
 * Order orchestration — the integration spine that ties Probo, Mollie, VAT and
 * pricing to the datamodel and the state machine (spec §6–§11).
 *
 * Flow:
 *   buildQuote   configure + price each line, compute VAT + totals
 *   placeOrder   persist the order, create a Mollie payment → checkout URL
 *   handleMolliePayment   (webhook) paid → Probo test order; failed → mark failed
 *   handleProboStatus     (webhook) accept/production/shipped → advance status
 *
 * Money is ex-VAT `numeric(12,2)`. All external responses are validated in their
 * client modules; here we only orchestrate.
 */

/** Default resale markup on the Probo purchase price (spec §10). */
export const DEFAULT_MARKUP_PCT = 50;

/**
 * Probo order type. The whole current build targets a non-billable test order
 * (`order_type:"test"`). Override with PROBO_ORDER_TYPE=normal once live.
 */
const PROBO_ORDER_TYPE: "test" | "normal" =
  process.env.PROBO_ORDER_TYPE === "normal" ? "normal" : "test";

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface OrderItemDraft {
  /** Probo product `code` (e.g. "window-decal"). */
  proboProductCode: string;
  /** Our own product category label (e.g. "baniervlag"). */
  productType: string;
  /** Localized product name snapshot. */
  productName?: string;
  /** Probo option selections, including the quantity (`amount`) option. */
  options: ProboOptionInput[];
  /** Quantity, mirrored from the Probo `amount` option, for our records. */
  amount: number;
  /**
   * Public URL of the customer's uploaded artwork (order-artwork bucket).
   * Passed to Probo as `files:[{uri}]`. Null/undefined for quote-only lines.
   */
  fileUrl?: string | null;
  /** Resale markup %; defaults to {@link DEFAULT_MARKUP_PCT}. */
  markupPct?: number;
  /** Uploader session refs for products that need customer artwork. */
  uploaders?: Array<{ id: number; external_id: number }>;
}

export interface CheckoutInput {
  market: Market;
  email: string;
  phone?: string;
  isBusiness?: boolean;
  vatNumber?: string | null;
  customerId?: string | null;
  billingAddress?: ProboAddress;
  /** Ship-to address — drives Probo delivery pricing and the VAT country. */
  shippingAddress: ProboAddress;
  items: OrderItemDraft[];
}

// ---------------------------------------------------------------------------
// Quote
// ---------------------------------------------------------------------------

export interface QuoteLine {
  draft: OrderItemDraft;
  /** Probo `calculation_id` (audit; the order re-sends code+options). */
  calculationId: string;
  /** Probo purchase price for the line (our cost, ex-VAT). */
  basePrice: number;
  markupPct: number;
  /** Sell price = basePrice marked up. */
  linePrice: number;
}

export interface Quote {
  currency: string;
  lines: QuoteLine[];
  shippingPrice: number;
  packagingPrice: number;
  vat: Awaited<ReturnType<typeof computeVat>>;
  totals: ReturnType<typeof computeOrderTotals>;
}

/**
 * Configure + price every line, then compute VAT and order totals.
 *
 * - Each line is configured (validates it is orderable + yields a
 *   `calculation_id`) and priced individually for its `basePrice`.
 * - Order-level shipping/packaging come from a single combined price call for
 *   all lines to one delivery, so shipping is not counted per line.
 */
export async function buildQuote(input: CheckoutInput): Promise<Quote> {
  if (input.items.length === 0) {
    throw new Error("buildQuote: no items");
  }

  const delivery = { address: input.shippingAddress };

  const lines: QuoteLine[] = [];
  for (const draft of input.items) {
    const products = [{ code: draft.proboProductCode, options: draft.options }];

    const configured = await configureProduct({ products });
    if (!configured.calculationId) {
      throw new Error(
        `buildQuote: product ${draft.proboProductCode} is not fully configured (no calculation_id)`,
      );
    }

    const price = await getPrice({ products, deliveries: [delivery] });
    const markupPct = draft.markupPct ?? DEFAULT_MARKUP_PCT;
    const linePrice = computeLinePrice(price.purchasePrice, markupPct);

    lines.push({
      draft,
      calculationId: configured.calculationId,
      basePrice: price.purchasePrice,
      markupPct,
      linePrice,
    });
  }

  // Combined price call → order-level shipping + packaging (one delivery).
  const combined = await getPrice({
    products: input.items.map((it) => ({ code: it.proboProductCode, options: it.options })),
    deliveries: [delivery],
  });

  const vat = await computeVat({
    isBusiness: Boolean(input.isBusiness),
    vatNumber: input.vatNumber ?? null,
    market: input.market,
    shippingCountry: input.shippingAddress.country ?? null,
  });

  const totals = computeOrderTotals({
    // Probo prices each line for its full quantity → treat linePrice as the
    // line total (amount already folded into the Probo `amount` option).
    lines: lines.map((l) => ({ unitPrice: l.linePrice, amount: 1 })),
    shippingPrice: combined.shippingPrice,
    packagingPrice: combined.packagingPrice,
    vatRatePct: vat.rate,
  });

  return {
    currency: combined.currency,
    lines,
    shippingPrice: combined.shippingPrice,
    packagingPrice: combined.packagingPrice,
    vat,
    totals,
  };
}

// ---------------------------------------------------------------------------
// Place order + create payment
// ---------------------------------------------------------------------------

export interface PlaceOrderResult {
  order: OrderRow;
  quote: Quote;
  /** Mollie hosted-checkout URL to redirect the customer to. */
  checkoutUrl: string | null;
}

/**
 * Persist a new order + items (status `cart`), create a Mollie payment, and move
 * the order to `awaiting_payment`. Returns the checkout URL for redirect.
 */
export async function placeOrder(input: CheckoutInput): Promise<PlaceOrderResult> {
  const quote = await buildQuote(input);
  const appUrl = publicEnv.appUrl;

  const order = await insertOrderWithItems(
    {
      market: input.market,
      currency: quote.currency,
      customer_id: input.customerId ?? null,
      email: input.email,
      phone: input.phone ?? null,
      status: "cart",
      billing_address: (input.billingAddress ?? null) as Json | null,
      shipping_address: input.shippingAddress as unknown as Json,
      is_business: Boolean(input.isBusiness),
      vat_number: input.vatNumber ?? null,
      vat_number_valid: quote.vat.vatNumberValid,
      vat_validated_at: quote.vat.vatNumberValid !== null ? new Date().toISOString() : null,
      reverse_charge: quote.vat.reverseCharge,
      vat_rate: quote.vat.rate,
      subtotal_ex_vat: quote.totals.subtotalExVat,
      shipping_cost: quote.totals.shippingCost,
      vat_amount: quote.totals.vatAmount,
      total: quote.totals.total,
    },
    quote.lines.map((l) => ({
      probo_product_code: l.draft.proboProductCode,
      product_type: l.draft.productType,
      product_name: l.draft.productName ?? null,
      configuration: { code: l.draft.proboProductCode, options: l.draft.options } as unknown as Json,
      amount: l.draft.amount,
      calculation_id: l.calculationId,
      file_url: l.draft.fileUrl ?? null,
      base_price: l.basePrice,
      markup_pct: l.markupPct,
      line_price: l.linePrice,
    })),
  );

  const payment = await createPayment({
    amount: quote.totals.total,
    currency: quote.currency,
    description: `Duurzame-Vlaggen ${order.order_number}`,
    redirectUrl: `${appUrl}/order/${order.id}`,
    webhookUrl: `${appUrl}/api/webhooks/mollie`,
    metadata: { orderId: order.id, orderNumber: order.order_number },
  });

  const updated = await advanceOrderStatus(order.id, "awaiting_payment", {
    mollie_payment_id: payment.id,
    mollie_status: payment.status,
  });

  await recordEventOnce({
    orderId: order.id,
    source: "mollie",
    eventType: "payment.created",
    externalId: payment.id,
    data: { status: payment.status },
  });

  return { order: updated, quote, checkoutUrl: payment.checkoutUrl };
}

// ---------------------------------------------------------------------------
// Mollie webhook → payment status
// ---------------------------------------------------------------------------

/**
 * Handle a Mollie payment status change (called from the webhook after
 * re-fetching the payment — never trust the webhook body). Idempotent.
 *
 * paid → mark order paid, then submit the Probo order.
 * failed/canceled/expired → mark payment_failed.
 */
export async function handleMolliePayment(paymentId: string): Promise<void> {
  const payment = await getPayment(paymentId);
  const order = await getOrderByMolliePaymentId(paymentId);
  if (!order) {
    // Unknown payment — log-and-ignore (could be a stale/foreign webhook).
    return;
  }

  const event = await recordEventOnce({
    orderId: order.id,
    source: "mollie",
    eventType: `payment.${payment.status}`,
    externalId: paymentId,
    data: { status: payment.status },
  });
  // Already processed this exact event → nothing to do.
  if (!event.inserted) return;

  if (payment.status === "paid") {
    if (order.status === "awaiting_payment") {
      await advanceOrderStatus(order.id, "paid", { mollie_status: payment.status });
    }
    await sendOrderToProbo(order.id);
    return;
  }

  if (["failed", "canceled", "expired"].includes(payment.status)) {
    if (order.status === "awaiting_payment") {
      await advanceOrderStatus(order.id, "payment_failed", { mollie_status: payment.status });
    }
  }
}

// ---------------------------------------------------------------------------
// Submit to Probo
// ---------------------------------------------------------------------------

/**
 * Submit a paid order to Probo (`order_type:"test"` for now). Advances the order
 * to `sent_to_probo` and stores the returned Probo order id. Idempotent: skips
 * if the order already left `paid`.
 */
export async function sendOrderToProbo(orderId: string): Promise<void> {
  const order = await getOrderById(orderId);
  if (!order) throw new Error(`sendOrderToProbo: order ${orderId} not found`);
  if (order.status !== "paid") return; // already sent or not payable

  const items = await getOrderItems(orderId);
  const appUrl = publicEnv.appUrl;

  const result = await createProboOrder({
    orderType: PROBO_ORDER_TYPE,
    // Our order id is echoed back by Probo to correlate async callbacks.
    id: order.id,
    reference: order.order_number,
    contact_email: order.email,
    callback_url: [`${appUrl}/api/webhooks/probo`],
    // Probo's POST /order requires the delivery to specify HOW/WHEN it ships;
    // an address-only delivery is rejected (HTTP 400 "required key
    // [shipping_method_preset] / [delivery_date_preset] not found"). We default
    // to the cheapest method and the first possible date, which matches the
    // delivery buildQuote priced against (Probo returns options cheapest-first).
    deliveries: [
      {
        address: (order.shipping_address ?? {}) as ProboAddress,
        shipping_method_preset: "cheapest",
        delivery_date_preset: "first_possible",
      },
    ],
    products: items.map((it) => {
      const config = (it.configuration ?? {}) as { code?: string; options?: ProboOptionInput[] };
      return {
        code: it.probo_product_code,
        options: config.options ?? [],
        // Customer artwork is supplied to Probo by public URL (order-artwork
        // bucket). See ProboFileInput / lib/probo/orders.ts.
        files: it.file_url ? [{ uri: it.file_url }] : undefined,
        uploaders:
          it.uploader_id !== null && it.uploader_external_id !== null
            ? [{ id: it.uploader_id, external_id: it.uploader_external_id }]
            : undefined,
      };
    }),
  });

  await advanceOrderStatus(order.id, "sent_to_probo", {
    probo_order_id: result.proboOrderId,
    probo_status: result.status,
  });

  await recordEventOnce({
    orderId: order.id,
    source: "probo",
    eventType: "order.submitted",
    externalId: result.proboOrderId,
    data: { status: result.status },
  });
}

// ---------------------------------------------------------------------------
// Probo status webhook
// ---------------------------------------------------------------------------

export interface ProboStatusUpdate {
  /** Our order id (echoed by Probo) — the primary correlation key. */
  ourOrderId?: string | null;
  /** Probo's supplier_order_number, if provided. */
  supplierOrderNumber?: string | null;
  /** Raw Probo status string. */
  status: string;
  carrier?: string | null;
  trackingUrl?: string | null;
}

/** Map a raw Probo status onto our order status (forward-only). */
function mapProboStatus(raw: string): OrderRow["status"] | null {
  const s = raw.toLowerCase();
  if (s.includes("reject") || s.includes("declin") || s.includes("cancel")) return "probo_rejected";
  if (s.includes("accept")) return "probo_accepted";
  if (s.includes("production") || s.includes("printing")) return "in_production";
  if (s.includes("ship") || s.includes("deliver") || s.includes("sent")) return "shipped";
  return null;
}

/**
 * Handle an inbound Probo status callback. Correlates by our order id (preferred)
 * or the stored Probo order id, records the event idempotently, and advances the
 * order status when the mapped target is a legal forward transition.
 */
export async function handleProboStatus(update: ProboStatusUpdate): Promise<void> {
  const order = update.ourOrderId ? await getOrderById(update.ourOrderId) : null;
  if (!order) return;

  const target = mapProboStatus(update.status);

  const event = await recordEventOnce({
    orderId: order.id,
    source: "probo",
    eventType: `status.${update.status.toLowerCase()}`,
    externalId: update.supplierOrderNumber ?? update.ourOrderId ?? null,
    data: { status: update.status, carrier: update.carrier, trackingUrl: update.trackingUrl },
  });
  if (!event.inserted) return;

  const extra: Record<string, unknown> = {
    probo_status: update.status,
  };
  if (update.supplierOrderNumber) extra.probo_order_id = update.supplierOrderNumber;
  if (update.carrier) extra.carrier = update.carrier;
  if (update.trackingUrl) extra.tracking_url = update.trackingUrl;

  if (target && order.status !== target) {
    try {
      await advanceOrderStatus(order.id, target, extra);
    } catch {
      // Illegal/duplicate transition (e.g. out-of-order callback) — record only.
      await advanceOrderStatus(order.id, order.status, extra).catch(() => {});
    }
  }
}
