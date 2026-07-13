import { describe, expect, it } from "vitest";
import {
  ALLOWED_TRANSITIONS,
  InvalidTransitionError,
  assertTransition,
  canTransition,
  isTerminal,
  timestampColumnFor,
} from "@/lib/orders/state-machine";

describe("order state machine", () => {
  it("allows the happy path forward", () => {
    const path = [
      "cart",
      "awaiting_payment",
      "paid",
      "sent_to_probo",
      "probo_accepted",
      "in_production",
      "shipped",
    ] as const;
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i + 1])).toBe(true);
    }
  });

  it("rejects backward transitions", () => {
    expect(canTransition("paid", "cart")).toBe(false);
    expect(canTransition("shipped", "in_production")).toBe(false);
    expect(canTransition("sent_to_probo", "paid")).toBe(false);
  });

  it("allows a payment retry from payment_failed", () => {
    expect(canTransition("payment_failed", "awaiting_payment")).toBe(true);
  });

  it("marks shipped and cancelled terminal", () => {
    expect(isTerminal("shipped")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("cart")).toBe(false);
  });

  it("assertTransition throws on illegal moves", () => {
    expect(() => assertTransition("cart", "awaiting_payment")).not.toThrow();
    expect(() => assertTransition("shipped", "cart")).toThrow(InvalidTransitionError);
  });

  it("rejects no-op transitions (caller must guard idempotency)", () => {
    expect(canTransition("paid", "paid")).toBe(false);
  });

  it("maps statuses to timestamp columns", () => {
    expect(timestampColumnFor("paid")).toBe("paid_at");
    expect(timestampColumnFor("sent_to_probo")).toBe("ordered_at");
    expect(timestampColumnFor("shipped")).toBe("shipped_at");
    expect(timestampColumnFor("cart")).toBeNull();
  });

  it("every status has an entry in the matrix", () => {
    const statuses = Object.keys(ALLOWED_TRANSITIONS);
    expect(statuses).toHaveLength(10);
    for (const targets of Object.values(ALLOWED_TRANSITIONS)) {
      expect(Array.isArray(targets)).toBe(true);
    }
  });
});
