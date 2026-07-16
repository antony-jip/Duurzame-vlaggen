import "server-only";

import { publicEnv, serverEnv } from "@/lib/env";
import { sendMailInhoud } from "@/lib/email/send";
import { lifecycleMail } from "@/lib/email/templates";
import { signEmailToken } from "@/lib/email/links";
import type { OrderRow } from "@/lib/db/types";
import {
  getOrderItems,
  hasEvent,
  isEmailSuppressed,
  listShippedOrdersBetween,
  recordEventOnce,
} from "@/lib/orders/repository";

/**
 * Lifecycle-vervangingsmails: 4 en 8 maanden na levering (anker is
 * `shipped_at` — de state machine kent geen aparte "delivered"), elk met een
 * one-click herbestellink en een AVG-proof uitschrijflink.
 *
 * Trigger: een dagelijkse Vercel Cron-scan (zie /api/cron/lifecycle). Elke
 * fase kijkt één maand terug voorbij zijn drempel, dus een gemiste cron-dag
 * (of een paar) wordt de volgende run ingehaald; de order_events-dedupe
 * garandeert één verzending per fase per order. Het event wordt pas NA een
 * geslaagde verzending geschreven, zodat een providerfout de volgende dag
 * opnieuw geprobeerd wordt; de zeldzame crash tussen verzenden en registreren
 * kan één duplicaat opleveren, en dat is beter dan stilletjes nooit versturen.
 */

export const LIFECYCLE_STAGES = [
  { stage: "4m", months: 4, eventType: "lifecycle.reorder_4m" },
  { stage: "8m", months: 8, eventType: "lifecycle.reorder_8m" },
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

/** `date` minus `months` kalendermaanden (UTC; overflow klemt per Date). */
export function monthsBefore(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}

/**
 * Het shipped_at-venster van een fase op moment `now`: minstens `months`
 * maanden geleden, hoogstens `months + 1` (de inhaalmarge).
 */
export function stageWindow(stage: LifecycleStage, now: Date): { from: Date; to: Date } {
  return { from: monthsBefore(now, stage.months + 1), to: monthsBefore(now, stage.months) };
}

export interface LifecycleStageResult {
  stage: string;
  candidates: number;
  sent: number;
  skippedSuppressed: number;
  skippedAlreadySent: number;
  skippedNoToken: number;
  errors: number;
}

async function runStage(stage: LifecycleStage, now: Date): Promise<LifecycleStageResult> {
  const { from, to } = stageWindow(stage, now);
  const orders = await listShippedOrdersBetween(from.toISOString(), to.toISOString());

  const result: LifecycleStageResult = {
    stage: stage.stage,
    candidates: orders.length,
    sent: 0,
    skippedSuppressed: 0,
    skippedAlreadySent: 0,
    skippedNoToken: 0,
    errors: 0,
  };

  for (const order of orders) {
    try {
      const outcome = await sendLifecycleMailForOrder(order, stage);
      result[outcome] += 1;
    } catch (err) {
      result.errors += 1;
      console.error(
        `[lifecycle] ${stage.stage} mislukt voor ${order.order_number}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  return result;
}

async function sendLifecycleMailForOrder(
  order: OrderRow,
  stage: LifecycleStage,
): Promise<"sent" | "skippedSuppressed" | "skippedAlreadySent" | "skippedNoToken" | "errors"> {
  // Orders van vóór de herbestel-tokens hebben niets om naar te linken.
  if (!order.reorder_token) return "skippedNoToken";

  if (await isEmailSuppressed(order.email)) return "skippedSuppressed";

  if (
    await hasEvent({
      orderId: order.id,
      source: "system",
      eventType: stage.eventType,
      externalId: null,
    })
  ) {
    return "skippedAlreadySent";
  }

  const items = await getOrderItems(order.id);
  const appUrl = publicEnv.appUrl;
  const unsubscribeToken = signEmailToken(order.email, serverEnv.emailLinkSecret);
  const unsubscribeUrl = `${appUrl}/uitschrijven/${unsubscribeToken}`;
  // RFC 8058 one-click endpoint (POST) voor mailclients.
  const oneClickUrl = `${appUrl}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

  const mail = lifecycleMail({
    order,
    stage: stage.stage,
    flagNames: Array.from(
      new Set(items.map((it) => it.product_name ?? it.probo_product_code)),
    ),
    reorderUrl: `${appUrl}/opnieuw/${order.reorder_token}`,
    unsubscribeUrl,
  });

  const sendResult = await sendMailInhoud(order.email, mail, {
    "List-Unsubscribe": `<${oneClickUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  });

  // Alleen afvinken bij een échte verzending: een geskipte (niet
  // geconfigureerde) of mislukte poging moet een latere run opnieuw doen.
  if (!sendResult.sent) return "errors";

  await recordEventOnce({
    orderId: order.id,
    source: "system",
    eventType: stage.eventType,
    externalId: null,
    data: { email: order.email },
  });
  return "sent";
}

/** Draai elke lifecycle-fase één keer. Aangeroepen door de dagelijkse cron. */
export async function runLifecycle(now: Date = new Date()): Promise<LifecycleStageResult[]> {
  const results: LifecycleStageResult[] = [];
  for (const stage of LIFECYCLE_STAGES) {
    results.push(await runStage(stage, now));
  }
  return results;
}
