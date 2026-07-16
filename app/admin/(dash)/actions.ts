"use server";

import { revalidatePath } from "next/cache";
import { deleteOrder, getOrderById } from "@/lib/orders/repository";
import { requireAdminUser } from "../auth";

/**
 * Verwijder een order definitief uit de lijst (regels/designs/events cascaden
 * mee). De bevestiging zit in de UI (twee-staps-knop); hier alleen de
 * admin-gate en de daad zelf.
 */
export async function verwijderOrderAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const orderId = String(formData.get("orderId") ?? "");
  const order = await getOrderById(orderId);
  if (!order) return; // al weg — klaar
  await deleteOrder(order.id);
  revalidatePath("/admin");
}
