"use server";

/**
 * Order-detail server actions. EVERY action re-verifies the admin session with
 * requireAdminUser() before touching data or calling Probo/Mollie — the layout
 * gate alone is never trusted. All order writes go through the existing
 * repository/orchestration helpers (service-role, server-side only).
 */

import { revalidatePath } from "next/cache";
import {
  countPendingDesigns,
  getOrderById,
  updateOrder,
  advanceOrderStatus,
  type OrderPatch,
} from "@/lib/orders/repository";
import { handleMolliePayment } from "@/lib/orders/orchestration";
import type { OrderStatus } from "@/lib/db/types";
import { requireAdminUser } from "../../../auth";
import { sendKlantMail } from "@/lib/email/send";
import { isEmailConfigured } from "@/lib/email/client";
import type { MailSoort } from "@/lib/email/templates";

function revalidateOrder(id: string): void {
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
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
  if (order.status === "paid" || order.status === "awaiting_files") {
    // Nooit bij Probo bestellen zonder drukbestanden: zolang er
    // design-toewijzingen zonder bestand zijn, blijft deze actie dicht.
    const pending = await countPendingDesigns(order.id);
    if (pending > 0) {
      throw new Error(
        `Er ${pending === 1 ? "ontbreekt nog 1 ontwerp" : `ontbreken nog ${pending} ontwerpen`} — bestellen kan zodra de klant alles heeft aangeleverd.`,
      );
    }
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

/* ── Klantmail ───────────────────────────────────────────────────────────── */

/**
 * Voorkom HTML-injectie in het vrije bericht. De tekst gaat rechtstreeks de
 * mail-HTML in, dus een klant-naam of een geplakt stuk tekst met `<` mag daar
 * niets kunnen breken.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface MailState {
  ok?: boolean;
  fout?: string;
}

/**
 * Verstuur een klantmail. Geeft — anders dan de automatische paspoortmail — een
 * echte fout terug: dit is een expliciete klik, dus je wilt weten of het lukte.
 */
export async function stuurKlantMailAction(
  _prev: MailState,
  formData: FormData,
): Promise<MailState> {
  await requireAdminUser();

  const orderId = String(formData.get("orderId") ?? "");
  const soort = String(formData.get("soort") ?? "") as MailSoort;
  const bericht = String(formData.get("bericht") ?? "").trim();

  if (!["in_productie", "verzonden", "vraag"].includes(soort)) {
    return { fout: `Onbekend mailtype: ${soort}` };
  }
  if (soort === "vraag" && !bericht) {
    return { fout: "Schrijf eerst een bericht." };
  }

  const order = await getOrderById(orderId);
  if (!order) return { fout: "Order niet gevonden." };

  if (!isEmailConfigured()) {
    return { fout: "E-mail is niet ingesteld (RESEND_API_KEY ontbreekt)." };
  }

  const res = await sendKlantMail(order, soort, escapeHtml(bericht));
  if (!res.sent) {
    return { fout: res.reason ?? "Versturen mislukt." };
  }

  revalidateOrder(orderId);
  return { ok: true };
}
