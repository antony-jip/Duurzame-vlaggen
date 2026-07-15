"use server";

/**
 * Order-detail server actions. EVERY action re-verifies the admin session with
 * requireAdminUser() before touching data or calling Probo/Mollie — the layout
 * gate alone is never trusted. All order writes go through the existing
 * repository/orchestration helpers (service-role, server-side only).
 */

import { revalidatePath } from "next/cache";
import {
  getOrderById,
  updateOrder,
  advanceOrderStatus,
  type OrderPatch,
} from "@/lib/orders/repository";
import {
  sendOrderToProbo,
  handleProboStatus,
  handleMolliePayment,
} from "@/lib/orders/orchestration";
import { getProboOrderStatus } from "@/lib/probo/orders";
import type { OrderStatus } from "@/lib/db/types";
import { requireAdminUser } from "../../../auth";

function revalidateOrder(id: string): void {
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
}

/** Poll Probo for the latest status and persist it; advance if it maps forward. */
export async function refreshProboStatusAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const orderId = String(formData.get("orderId") ?? "");
  const order = await getOrderById(orderId);
  if (!order?.probo_order_id) return;

  const status = await getProboOrderStatus(order.probo_order_id);

  // Persist only the fields Probo actually returned. An empty/unknown poll
  // (e.g. Probo momentarily returns no order) must NOT wipe an already-stored
  // carrier / tracking URL, so we merge non-null values only.
  const patch: OrderPatch = {};
  if (status.status && status.status !== "unknown") patch.probo_status = status.status;
  if (status.carrier) patch.carrier = status.carrier;
  if (status.trackingUrl) patch.tracking_url = status.trackingUrl;
  if (Object.keys(patch).length > 0) {
    await updateOrder(order.id, patch);
  }

  // If the polled status implies a further transition, let the orchestration
  // apply it (idempotent, respects the state machine).
  await handleProboStatus({
    ourOrderId: order.id,
    status: status.status,
    carrier: status.carrier,
    trackingUrl: status.trackingUrl,
  });

  revalidateOrder(order.id);
}

/** Submit a paid order to Probo. */
export async function sendToProboAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const orderId = String(formData.get("orderId") ?? "");
  await sendOrderToProbo(orderId);
  revalidateOrder(orderId);
}

/** Re-fetch the Mollie payment and reconcile order state. */
export async function refreshPaymentAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const orderId = String(formData.get("orderId") ?? "");
  const order = await getOrderById(orderId);
  if (!order?.mollie_payment_id) return;
  await handleMolliePayment(order.mollie_payment_id);
  revalidateOrder(orderId);
}

/** Manually advance the order to a valid next status (state machine enforced). */
export async function advanceStatusAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const orderId = String(formData.get("orderId") ?? "");
  const to = String(formData.get("to") ?? "") as OrderStatus;
  await advanceOrderStatus(orderId, to);
  revalidateOrder(orderId);
}

/* ── Handmatige afhandeling (FULFILMENT_MODE "manual") ─────────────────────
 * We bestellen zelf in het Probo-portaal; er is geen API-call en dus ook geen
 * callback die de order verder duwt. Deze twee acties zijn de handbediening.
 */

/**
 * "Markeer besteld": order is met de hand bij Probo geplaatst. De track &
 * trace-link is optioneel — die heb je vaak pas later, en dan wil je de order
 * nu al kunnen afvinken.
 */
export async function markeerBesteldAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const orderId = String(formData.get("orderId") ?? "");
  const trackingUrl = String(formData.get("trackingUrl") ?? "").trim();

  const order = await getOrderById(orderId);
  if (!order) throw new Error("Order niet gevonden");

  // Link eerst wegschrijven: mislukt de statusovergang, dan is de link niet weg.
  if (trackingUrl) {
    // Alleen http(s) opslaan — dit veld gaat richting de klant.
    if (!/^https?:\/\//i.test(trackingUrl)) {
      throw new Error("De track & trace-link moet met http:// of https:// beginnen.");
    }
    await updateOrder(order.id, { tracking_url: trackingUrl });
  }

  // Idempotent: al besteld ⇒ alleen de link bijwerken, geen tweede overgang.
  if (order.status === "paid") {
    await advanceOrderStatus(order.id, "sent_to_probo");
  }

  revalidateOrder(order.id);
}

/** "Markeer verzonden": pakket is de deur uit. */
export async function markeerVerzondenAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const orderId = String(formData.get("orderId") ?? "");
  const trackingUrl = String(formData.get("trackingUrl") ?? "").trim();

  const order = await getOrderById(orderId);
  if (!order) throw new Error("Order niet gevonden");

  if (trackingUrl) {
    if (!/^https?:\/\//i.test(trackingUrl)) {
      throw new Error("De track & trace-link moet met http:// of https:// beginnen.");
    }
    await updateOrder(order.id, { tracking_url: trackingUrl });
  }

  if (order.status !== "shipped") {
    await advanceOrderStatus(order.id, "shipped");
  }

  revalidateOrder(order.id);
}
