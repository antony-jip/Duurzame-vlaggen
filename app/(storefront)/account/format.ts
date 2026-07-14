import type { BadgeVariant } from "@/components/ui";
import type { OrderStatus } from "@/lib/db/types";

/** Klantvriendelijke statuslabels voor het portaal (Nederlands). */
export const CUSTOMER_STATUS_LABELS: Record<OrderStatus, string> = {
  cart: "Winkelmand",
  awaiting_payment: "Wacht op betaling",
  paid: "Betaald",
  sent_to_probo: "In behandeling",
  probo_accepted: "In behandeling",
  in_production: "In productie",
  shipped: "Verzonden",
  payment_failed: "Betaling mislukt",
  probo_rejected: "Geannuleerd",
  cancelled: "Geannuleerd",
};

/** Badge-variant per status (visuele toon). */
export function customerStatusVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case "paid":
    case "shipped":
      return "success";
    case "sent_to_probo":
    case "probo_accepted":
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

/** Bedrag als NL-valuta, of "—". */
export function formatMoney(value: number | null | undefined, currency = "EUR"): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(value);
}

/** ISO-timestamp als korte NL-datum. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "long" }).format(new Date(iso));
}

/** Is een URL een direct toonbare rasterafbeelding (vs PDF)? */
export function isImageUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && /\.(png|jpe?g|webp)$/i.test(url);
}
