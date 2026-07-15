import "server-only";

import type { Market } from "@/config/domains";
import { publicEnv, serverEnv } from "@/lib/env";
import type { Json, OrderRow } from "@/lib/db/types";

import type { ProboAddress, ProboOptionInput } from "@/lib/catalog/probo-mapping";
import { createPayment, getPayment } from "@/lib/mollie/payments";
import { computeVat } from "@/lib/vat";
import { computeOrderTotals } from "@/lib/pricing";
import { getProduct } from "@/lib/catalog/products";
import { getSize, localLinePrice, localShipping } from "@/lib/pricing/local-catalog";

import {
  advanceOrderStatus,
  getOrderById,
  getOrderByMolliePaymentId,
  getOrderItems,
  insertOrderWithItems,
  recordEventOnce,
} from "@/lib/orders/repository";
import { sendMateriaalpaspoortEmail } from "@/lib/email/send";

/**
 * Order orchestration — de ruggengraat die Mollie, btw en prijzen aan het
 * datamodel en de state-machine knoopt.
 *
 * Flow:
 *   buildLocalQuote      regelprijzen uit het lokale prijsmodel, btw + totalen
 *   placeOrder           order wegschrijven, Mollie-payment → checkout-URL
 *   handleMolliePayment  (webhook) betaald → order op `paid` voor handmatige
 *                        afhandeling in de admin; mislukt → als failed markeren
 *
 * Bestellen bij Probo gebeurt met de hand via hun portaal. De API-koppeling is
 * verwijderd (2026-07-15); wat een bestelling nodig heeft staat op
 * `order_items.configuration` (zie lib/catalog/probo-mapping).
 *
 * Bedragen zijn ex btw, `numeric(12,2)`.
 */

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface OrderItemDraft {
  /** Probo-productcode (bijv. "flag-ciclo") — voor de inkoop met de hand. */
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
   * Menselijk maatlabel uit de catalogus (bijv. "250 × 100 cm"). Gebruikt door
   * de lokale prijsberekening (`buildLocalQuote`) om de juiste `CatalogSize` te
   * vinden. Niet naar Probo gestuurd.
   */
  sizeLabel?: string;
  /**
   * Human-readable storefront selections (Dutch labels → chosen value), stored
   * on the order line for the admin. NOT sent to Probo — `options` is.
   */
  selections?: Record<string, string>;
  /**
   * Storefront choices that have no Probo equivalent (e.g. "Ontwerpservice").
   * Kept on the order line so staff can handle them manually.
   */
  unmapped?: Array<{ label: string; value: string }>;
  /**
   * Publieke URL van het aangeleverde ontwerp (order-artwork bucket).
   * Null/undefined voor offerte-only regels.
   */
  fileUrl?: string | null;
  /** Opslag %; in de handmatige flow altijd 0 (basePrice == linePrice). */
  markupPct?: number;
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
 * Bouwt de quote voor een bestelling: regelprijzen, btw en totalen.
 *
 * Rekent volledig met het lokale prijsmodel (`@/lib/pricing/local-catalog`):
 *
 *  - regelprijs via `localLinePrice` (product uit `getProduct`, maat uit `getSize`),
 *  - verzendkosten via `localShipping(subtotaal)`, packaging altijd 0,
 *  - geen inkoopprijs en geen markup (basePrice == linePrice, markupPct 0),
 *    want er is geen live inkoopcalculatie: `calculationId` blijft leeg.
 */
export async function buildLocalQuote(input: CheckoutInput): Promise<Quote> {
  if (input.items.length === 0) {
    throw new Error("buildLocalQuote: no items");
  }

  const lines: QuoteLine[] = [];
  for (const draft of input.items) {
    const product = getProduct(draft.productType);
    if (!product) {
      throw new Error(`buildLocalQuote: onbekend product ${draft.productType}`);
    }
    const size = draft.sizeLabel ? getSize(product, draft.sizeLabel) : undefined;

    // localLinePrice vouwt het aantal al in de regelprijs (× amount).
    const linePrice = localLinePrice({
      product,
      size,
      amount: draft.amount,
      selections: draft.selections,
    });

    lines.push({
      draft,
      // Geen Probo-calculatie in manual-modus.
      calculationId: "",
      // Geen aparte inkoopprijs lokaal → basePrice gelijk aan verkoopprijs.
      basePrice: linePrice,
      markupPct: 0,
      linePrice,
    });
  }

  // Subtotaal ex btw (afgerond op centen) → drijft de eigen verzendregel.
  const subtotaal = Math.round(lines.reduce((sum, l) => sum + l.linePrice, 0) * 100) / 100;
  const shippingPrice = localShipping(subtotaal);
  const packagingPrice = 0;

  const vat = await computeVat({
    isBusiness: Boolean(input.isBusiness),
    vatNumber: input.vatNumber ?? null,
    market: input.market,
    shippingCountry: input.shippingAddress.country ?? null,
  });

  const totals = computeOrderTotals({
    // linePrice is al de regeltotaal (aantal ingevouwen) → amount 1.
    lines: lines.map((l) => ({ unitPrice: l.linePrice, amount: 1 })),
    shippingPrice,
    packagingPrice,
    vatRatePct: vat.rate,
  });

  return {
    currency: "EUR",
    lines,
    shippingPrice,
    packagingPrice,
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
  const quote = await buildLocalQuote(input);

  // Raak de config aan vóór de eerste schrijfactie. Beide getters throwen als de
  // variabele ontbreekt, en dat gebeurde eerder pas bij `createPayment` — dus ná
  // de insert. Resultaat: een weesorder op `cart` zonder betaling, bij élke
  // poging, terwijl de klant "er is iets misgegaan" zag. Ontbreekt er iets, dan
  // klapt het nu voordat er een rij bestaat.
  const appUrl = publicEnv.appUrl;
  void serverEnv.mollieApiKey;

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
      configuration: {
        code: l.draft.proboProductCode,
        options: l.draft.options,
        // Menselijk maatlabel — nodig om de regel later te herbestellen in het
        // klantportaal (reconstructie van maat/afmetingen/prijs).
        ...(l.draft.sizeLabel ? { sizeLabel: l.draft.sizeLabel } : {}),
        // Human-readable choices + any non-mappable selections, for the admin.
        ...(l.draft.selections ? { selections: l.draft.selections } : {}),
        ...(l.draft.unmapped && l.draft.unmapped.length
          ? { unmapped: l.draft.unmapped }
          : {}),
      } as unknown as Json,
      amount: l.draft.amount,
      // Manual-modus heeft geen Probo-calculatie → leeg wordt null.
      calculation_id: l.calculationId || null,
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
    // Kernbelofte: elke betaalde bestelling krijgt een materiaalpaspoort per
    // aparte e-mail. Best-effort en idempotent — faalt stil met log, en mag de
    // betaalflow nooit blokkeren.
    await sendMateriaalpaspoortOnce(order.id);
    // De order blijft op `paid` staan: inkoop en verzending gaan met de hand,
    // vanuit de admin.
    return;
  }

  if (["failed", "canceled", "expired"].includes(payment.status)) {
    if (order.status === "awaiting_payment") {
      await advanceOrderStatus(order.id, "payment_failed", { mollie_status: payment.status });
    }
  }
}

// ---------------------------------------------------------------------------
// Materiaalpaspoort-mail (best-effort, idempotent)
// ---------------------------------------------------------------------------

/**
 * Verstuur het materiaalpaspoort exact één keer per order. Idempotent via
 * `recordEventOnce` (source `system`), zodat een dubbele Mollie-webhook niet
 * twee mails oplevert. Volledig best-effort: elke fout wordt gelogd en
 * ingeslikt — de betaal-/Probo-flow mag hier nooit op stuklopen.
 */
export async function sendMateriaalpaspoortOnce(orderId: string): Promise<void> {
  try {
    // Claim het event vóór verzenden → geen dubbele mail bij herhaalde webhook.
    const event = await recordEventOnce({
      orderId,
      source: "system",
      eventType: "materiaalpaspoort.sent",
    });
    if (!event.inserted) return;

    const order = await getOrderById(orderId);
    if (!order) return;
    const items = await getOrderItems(orderId);
    await sendMateriaalpaspoortEmail(order, items);
  } catch (err) {
    console.error(
      `[materiaalpaspoort] Verzenden mislukt voor order ${orderId}:`,
      err,
    );
  }
}

// ---------------------------------------------------------------------------
// Submit to Probo
// ---------------------------------------------------------------------------
