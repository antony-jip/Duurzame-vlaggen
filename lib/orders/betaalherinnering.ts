import "server-only";

import { sendMailInhoud } from "@/lib/email/send";
import { betaalherinneringMail } from "@/lib/email/templates";
import type { OrderRow } from "@/lib/db/types";
import { betaaltermijnVervaldatum } from "@/lib/orders/orchestration";
import {
  claimBetaalherinnering,
  listOpRekeningReminderCandidates,
  recordEvent,
} from "@/lib/orders/repository";

/**
 * Betaalherinnering voor op-rekening-orders: staat een order 7 dagen na
 * plaatsing nog op `awaiting_payment`, dan gaat er één vriendelijke
 * herinnering uit — met de betaallink en de boodschap dat we de vlaggen maken
 * en versturen zodra de betaling binnen is.
 *
 * Trigger: een dagelijkse Vercel Cron-scan (zie /api/cron/betaalherinnering).
 * De eenmaligheid bewaakt `orders.payment_reminder_sent_at`: de run claimt dat
 * veld vóór het verzenden (alleen als het nog leeg is), dus ook bij een
 * dubbele of gelijktijdige run gaat de mail hoogstens één keer. Transactionele
 * mail over een openstaande factuur, dus geen marketing-suppressielijst.
 */

/** Dagen na plaatsing waarna de herinnering gaat. */
export const HERINNERING_NA_DAGEN = 7;

export interface BetaalherinneringResult {
  candidates: number;
  sent: number;
  skippedClaimed: number;
  errors: number;
}

export async function runBetaalherinnering(
  now: Date = new Date(),
): Promise<BetaalherinneringResult> {
  const grens = new Date(
    now.getTime() - HERINNERING_NA_DAGEN * 24 * 60 * 60 * 1000,
  ).toISOString();
  const orders = await listOpRekeningReminderCandidates(grens);

  const result: BetaalherinneringResult = {
    candidates: orders.length,
    sent: 0,
    skippedClaimed: 0,
    errors: 0,
  };

  for (const order of orders) {
    try {
      const outcome = await sendHerinneringForOrder(order);
      result[outcome] += 1;
    } catch (err) {
      result.errors += 1;
      console.error(
        `[betaalherinnering] order ${order.order_number} mislukt:`,
        err,
      );
    }
  }
  return result;
}

async function sendHerinneringForOrder(
  order: OrderRow,
): Promise<"sent" | "skippedClaimed"> {
  // Claim vóór verzenden: hoogstens één herinnering, ook bij dubbele runs.
  const claimed = await claimBetaalherinnering(order.id);
  if (!claimed) return "skippedClaimed";

  const mail = betaalherinneringMail({
    order,
    betaallink: order.mollie_payment_link_url,
    vervaldatum: betaaltermijnVervaldatum(order),
  });
  await sendMailInhoud(order.email, mail);

  // Audit-spoor in het orderlogboek (best-effort; de claim is al gezet).
  await recordEvent({
    orderId: order.id,
    source: "system",
    eventType: "betaalherinnering.sent",
  }).catch(() => {});

  return "sent";
}
