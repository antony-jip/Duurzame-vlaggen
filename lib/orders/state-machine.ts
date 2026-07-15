import type { OrderStatus } from "@/lib/db/types";

/**
 * Order status state machine (spec §11). Forward-only: an order advances through
 * the happy path and may branch to a failure/terminal state, but never moves
 * backwards — with one deliberate exception: a failed payment may return to
 * `awaiting_payment` so the customer can retry.
 *
 * The transition matrix is enforced in app logic (the DB enum only lists the
 * states). Every mutation of `orders.status` MUST go through `assertTransition`.
 */

/** Allowed next states for each status. Empty array = terminal. */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  cart: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["paid", "payment_failed", "cancelled"],
  // Retry: a failed payment may be re-attempted.
  payment_failed: ["awaiting_payment", "cancelled"],
  paid: ["sent_to_probo", "cancelled"],
  // `shipped` hoort hier vanwege de HANDMATIGE afhandeling (FULFILMENT_MODE
  // "manual", de standaard): we bestellen zelf in het Probo-portaal, dus er komt
  // geen callback die de order via probo_accepted/in_production verder duwt.
  // Zonder deze overgang blijft een handmatige order op sent_to_probo hangen.
  // De API-route (probo_accepted → in_production → shipped) blijft intact voor
  // als FULFILMENT_MODE ooit weer op "probo" gaat.
  sent_to_probo: ["probo_accepted", "probo_rejected", "shipped"],
  probo_accepted: ["in_production", "cancelled"],
  probo_rejected: ["cancelled"],
  in_production: ["shipped"],
  shipped: [],
  cancelled: [],
} as const;

/** Terminal states — no further transitions. */
export const TERMINAL_STATUSES: readonly OrderStatus[] = ["shipped", "cancelled"];

export function isTerminal(status: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  readonly from: OrderStatus;
  readonly to: OrderStatus;
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Illegal order status transition: ${from} → ${to}`);
    this.name = "InvalidTransitionError";
    this.from = from;
    this.to = to;
  }
}

/**
 * Throws {@link InvalidTransitionError} unless `from → to` is allowed. A no-op
 * transition (`from === to`) is rejected — callers should guard idempotency
 * before calling this (e.g. skip if the order is already in the target state).
 */
export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

/** Timestamp column that should be stamped when entering a given status. */
export function timestampColumnFor(status: OrderStatus): "paid_at" | "ordered_at" | "shipped_at" | null {
  switch (status) {
    case "paid":
      return "paid_at";
    case "sent_to_probo":
      return "ordered_at";
    case "shipped":
      return "shipped_at";
    default:
      return null;
  }
}
