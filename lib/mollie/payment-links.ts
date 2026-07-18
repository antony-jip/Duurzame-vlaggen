import "server-only";

import { mollieRequest, toMollieAmount } from "./client";
import { molliePaymentLinkSchema } from "./schemas";

/**
 * Mollie Payment Links API (`/v2/payment-links`) — de motor achter "op
 * rekening". Anders dan een gewone betaling heeft een betaallink geen korte
 * vervaltijd: hij blijft geldig tot hij betaald is, en de klant kiest op de
 * Mollie-pagina zelf de methode (iDEAL, kaart, overboeking).
 *
 * Webhook-gedrag (Mollie-docs): de `webhookUrl` van de link wordt aangeroepen
 * bij elke statuswijziging van de ONDERLIGGENDE betaling, met het betalings-id
 * (`tr_…`) in de body. De Payment Links API kent géén `metadata`, dus de
 * koppeling betaling → order kan niet via metadata; daarom hangt `placeOrder`
 * het order-id als queryparameter aan de webhook-URL en verifieert de
 * webhook-afhandeling die hint tegen de order (zie handleMolliePayment).
 */

export interface CreatePaymentLinkInput {
  amount: number;
  currency?: string;
  description: string;
  /** Waar de klant na betalen landt (de orderbevestiging). */
  redirectUrl: string;
  webhookUrl?: string;
}

export interface PaymentLinkResult {
  id: string;
  /** De betaal-URL voor de klant, of `null` als Mollie hem wegliet. */
  url: string | null;
  paidAt: string | null;
  raw: unknown;
}

function normalise(raw: unknown): PaymentLinkResult {
  const link = molliePaymentLinkSchema.parse(raw);
  return {
    id: link.id,
    url: link._links?.paymentLink?.href ?? null,
    paidAt: link.paidAt ?? null,
    raw,
  };
}

/** Maak een betaallink aan. Geen `expiresAt`: de link verloopt niet vanzelf. */
export async function createPaymentLink(
  input: CreatePaymentLinkInput,
): Promise<PaymentLinkResult> {
  const body = {
    amount: toMollieAmount(input.amount, input.currency),
    description: input.description,
    redirectUrl: input.redirectUrl,
    ...(input.webhookUrl ? { webhookUrl: input.webhookUrl } : {}),
  };
  const raw = await mollieRequest("/payment-links", { method: "POST", json: body });
  return normalise(raw);
}

/** Haal een betaallink op (o.a. om `paidAt` gezaghebbend te checken). */
export async function getPaymentLink(id: string): Promise<PaymentLinkResult> {
  const raw = await mollieRequest(`/payment-links/${encodeURIComponent(id)}`);
  return normalise(raw);
}
