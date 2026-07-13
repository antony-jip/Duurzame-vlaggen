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
