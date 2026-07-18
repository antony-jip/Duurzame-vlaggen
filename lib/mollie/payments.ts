import "server-only";

import { mollieRequest, toMollieAmount } from "./client";
import { molliePaymentSchema, mollieWebhookSchema } from "./schemas";

/**
 * High-level Mollie payment operations. These normalise Mollie's raw JSON into
 * small, typed shapes while always returning `raw` for callers that need more.
 */

/** Adresvorm zoals Mollie hem verwacht (o.a. verplicht voor Billie). */
export interface MollieAddress {
  organizationName?: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  streetAndNumber?: string;
  postalCode?: string;
  city?: string;
  country?: string;
}

/**
 * Orderregel voor betaalmethodes die regel-informatie eisen (Billie, Klarna).
 * Bedragen zijn incl. btw; Mollie valideert dat `unitPrice × quantity` gelijk
 * is aan `totalAmount` en dat de regels optellen tot het betaalbedrag.
 */
export interface MolliePaymentLine {
  description: string;
  quantity: number;
  unitPrice: { currency: string; value: string };
  totalAmount: { currency: string; value: string };
  /** Percentage als string, bv. "21.00". */
  vatRate: string;
  vatAmount: { currency: string; value: string };
}

/** Input for {@link createPayment}. `amount` is a plain euro number. */
export interface CreatePaymentInput {
  amount: number;
  currency?: string;
  description: string;
  redirectUrl: string;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
  method?: string;
  /** Vereist voor factuur-methodes (Billie): factuuradres mét bedrijfsnaam. */
  billingAddress?: MollieAddress;
  shippingAddress?: MollieAddress;
  /** Vereist voor factuur-methodes (Billie): de orderregels incl. btw. */
  lines?: MolliePaymentLine[];
}

/** Normalised result of {@link createPayment}. */
export interface CreatePaymentResult {
  id: string;
  status: string;
  /** The URL to send the customer to, or `null` if Mollie omitted it. */
  checkoutUrl: string | null;
  raw: unknown;
}

/** Normalised result of {@link getPayment}. */
export interface GetPaymentResult {
  id: string;
  status: string;
  amountValue: string;
  currency: string;
  metadata: unknown;
  raw: unknown;
}

/**
 * Create a Mollie payment. Returns the payment id, its status, and the checkout
 * URL the customer must be redirected to. The raw Mollie response is included.
 */
export async function createPayment(
  input: CreatePaymentInput,
): Promise<CreatePaymentResult> {
  const body = {
    amount: toMollieAmount(input.amount, input.currency),
    description: input.description,
    redirectUrl: input.redirectUrl,
    ...(input.webhookUrl ? { webhookUrl: input.webhookUrl } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
    ...(input.method ? { method: input.method } : {}),
    ...(input.billingAddress ? { billingAddress: input.billingAddress } : {}),
    ...(input.shippingAddress ? { shippingAddress: input.shippingAddress } : {}),
    ...(input.lines ? { lines: input.lines } : {}),
  };

  const raw = await mollieRequest("/payments", { method: "POST", json: body });
  const payment = molliePaymentSchema.parse(raw);

  return {
    id: payment.id,
    status: payment.status,
    checkoutUrl: payment._links?.checkout?.href ?? null,
    raw,
  };
}

/**
 * Fetch a payment by id. Use this in the webhook handler: Mollie only sends the
 * id, so the authoritative status must always be re-fetched here — never trust
 * the webhook body for status.
 */
export async function getPayment(id: string): Promise<GetPaymentResult> {
  const raw = await mollieRequest(`/payments/${encodeURIComponent(id)}`);
  const payment = molliePaymentSchema.parse(raw);

  return {
    id: payment.id,
    status: payment.status,
    amountValue: payment.amount.value,
    currency: payment.amount.currency,
    metadata: payment.metadata,
    raw,
  };
}

/**
 * Parse a Mollie webhook request body (`application/x-www-form-urlencoded`) and
 * extract the payment `id`. The caller should then call {@link getPayment} to
 * obtain the authoritative status.
 *
 * @throws {Error} when the body contains no `id`.
 */
export function parseWebhookBody(rawBody: string): { id: string } {
  const params = new URLSearchParams(rawBody);
  const result = mollieWebhookSchema.safeParse({ id: params.get("id") ?? undefined });
  if (!result.success) {
    throw new Error("Mollie webhook body is missing a payment id");
  }
  return { id: result.data.id };
}
