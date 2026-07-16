import type { BadgeVariant } from "@/components/ui";
import type { OrderStatus } from "@/lib/db/types";

/** Dutch labels for every order status (used in tables, filters, badges). */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  cart: "Winkelwagen",
  awaiting_payment: "Wacht op betaling",
  paid: "Betaald",
  awaiting_files: "Wacht op bestand",
  sent_to_probo: "Naar Probo",
  probo_accepted: "Probo geaccepteerd",
  in_production: "In productie",
  shipped: "Verzonden",
  payment_failed: "Betaling mislukt",
  probo_rejected: "Probo afgewezen",
  cancelled: "Geannuleerd",
};

/** Map an order status onto a UI badge variant. */
export function statusBadgeVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case "paid":
    case "probo_accepted":
    case "shipped":
      return "success";
    case "sent_to_probo":
    case "in_production":
      return "primary";
    case "payment_failed":
    case "probo_rejected":
    case "cancelled":
      return "personal";
    default:
      return "outline";
  }
}

/** Format a numeric amount as a localized currency string. Falls back to "—". */
export function formatMoney(value: number | null | undefined, currency = "EUR"): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(value);
}

/** Format an ISO timestamp as a short Dutch date-time. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
