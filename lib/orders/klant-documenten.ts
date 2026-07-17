import "server-only";

import { getCustomerUser } from "@/app/(storefront)/account/auth";
import { getCustomerOrder } from "@/lib/orders/customer";
import { getOrderItems } from "@/lib/orders/repository";
import type { OrderItemRow, OrderRow } from "@/lib/db/types";

/**
 * Toegangspoort voor de documenten die een klant zelf kan downloaden
 * (factuur + materiaalpaspoort) vanuit /account.
 *
 * Eén plek voor de drie vragen die elk document moet stellen — is er een sessie,
 * is dit zijn order, en bestaat het document al — zodat twee routes en de
 * bestelpagina niet elk hun eigen versie van die regels krijgen.
 */

/**
 * Is er betaald? Zo ja, dan bestaan factuur en materiaalpaspoort.
 *
 * `paid_at` wordt gestempeld bij de overgang naar `paid` (zie
 * `timestampColumnFor`) en blijft daarna staan, dus dit blijft ook kloppen voor
 * een order die intussen verzonden is. De status-check staat er als vangnet
 * naast — zelfde voorwaarde als de factuur zelf gebruikt om "betaald" te
 * stempelen, zodat pagina en PDF het nooit oneens zijn.
 */
export function orderIsBetaald(order: OrderRow): boolean {
  return Boolean(order.paid_at) || order.status === "paid";
}

/** Waarom een document niet gegeven kan worden. */
export type DocumentWeigering = "geen-sessie" | "niet-gevonden" | "niet-betaald";

/**
 * Haal een order op vóór een klant, met alle controles.
 *
 * Geeft `niet-gevonden` óók terug wanneer de order bestaat maar van iemand
 * anders is: dat is bewust. Zou dit 403 geven, dan kon je met een reeks id's
 * uitvragen wélke orders bestaan.
 */
export async function getKlantDocumentOrder(
  orderId: string,
): Promise<
  | { ok: true; order: OrderRow; items: OrderItemRow[] }
  | { ok: false; reden: DocumentWeigering }
> {
  const user = await getCustomerUser();
  if (!user?.email) return { ok: false, reden: "geen-sessie" };

  const order = await getCustomerOrder(orderId, {
    authUserId: user.id,
    email: user.email,
  });
  if (!order) return { ok: false, reden: "niet-gevonden" };
  if (!orderIsBetaald(order)) return { ok: false, reden: "niet-betaald" };

  const items = await getOrderItems(order.id);
  return { ok: true, order, items };
}

/** HTTP-status per weigering. */
export const WEIGERING_STATUS: Record<DocumentWeigering, number> = {
  "geen-sessie": 401,
  "niet-gevonden": 404,
  "niet-betaald": 409,
};

/** Nette melding per weigering. */
export const WEIGERING_MELDING: Record<DocumentWeigering, string> = {
  "geen-sessie": "Log in om dit document te bekijken.",
  "niet-gevonden": "Bestelling niet gevonden.",
  "niet-betaald": "Dit document bestaat pas zodra de bestelling betaald is.",
};
