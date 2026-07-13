import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * Integration test for the paid → Probo branch of the Mollie webhook logic
 * ({@link handleMolliePayment}), with the EXTERNAL edges mocked and the REAL
 * repository running against the test DB:
 *
 *   - `@/lib/mollie/payments`.getPayment → returns `status: "paid"`
 *     (Mollie test payments can't be forced to `paid` via the API, so we mock
 *     the authoritative re-fetch the webhook performs).
 *   - `@/lib/probo/orders`.createProboOrder → returns a fake Probo order id
 *     (so the assertion doesn't depend on a live Probo submission).
 *   - repository (`insertOrderWithItems`, `getOrderById`, `advanceOrderStatus`,
 *     `recordEventOnce`) is the real thing, hitting the Supabase test DB.
 *
 * Proves: a `paid` webhook moves an `awaiting_payment` order to `sent_to_probo`
 * and stamps the Probo order id. Gated on the service-role key (skips in a
 * hermetic CI with no DB).
 */

// Hoisted so the vi.mock factory below can safely reference it.
const { FAKE_PROBO_ID } = vi.hoisted(() => ({ FAKE_PROBO_ID: "probo-test-fake-0001" }));

vi.mock("@/lib/mollie/payments", () => ({
  getPayment: vi.fn(async (id: string) => ({
    id,
    status: "paid",
    amountValue: "10.00",
    currency: "EUR",
    metadata: null,
    raw: {},
  })),
  createPayment: vi.fn(),
}));

vi.mock("@/lib/probo/orders", () => ({
  createProboOrder: vi.fn(async () => ({ proboOrderId: FAKE_PROBO_ID, status: "queued", raw: {} })),
  getProboOrderStatus: vi.fn(),
}));

import { handleMolliePayment } from "@/lib/orders/orchestration";
import { insertOrderWithItems } from "@/lib/orders/repository";
import { getOrderById } from "@/lib/orders/repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json, OrderRow } from "@/lib/db/types";

const hasDb = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

describe.skipIf(!hasDb)("handleMolliePayment: paid webhook → sent_to_probo", () => {
  let order: OrderRow;
  const paymentId = `tr_test_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const prevFulfilmentMode = process.env.FULFILMENT_MODE;

  beforeAll(async () => {
    // Deze test bewijst de Probo-tak van de webhook; forceer daarom probo-modus
    // (de default is inmiddels "manual", waarin er níét naar Probo wordt gestuurd).
    process.env.FULFILMENT_MODE = "probo";
    // Seed an order that is already awaiting payment, as it would be right after
    // placeOrder created the Mollie payment.
    order = await insertOrderWithItems(
      {
        market: "nl-NL",
        currency: "EUR",
        email: "webhook@example.com",
        status: "awaiting_payment",
        mollie_payment_id: paymentId,
        mollie_status: "open",
        shipping_address: { country: "NL" } as unknown as Json,
        total: 10,
      },
      [
        {
          probo_product_code: "window-decal",
          product_type: "raamsticker",
          configuration: { code: "window-decal", options: [] } as unknown as Json,
          amount: 1,
          markup_pct: 50,
          base_price: 6.67,
          line_price: 10,
        },
      ],
    );
  });

  afterAll(async () => {
    if (prevFulfilmentMode === undefined) {
      delete process.env.FULFILMENT_MODE;
    } else {
      process.env.FULFILMENT_MODE = prevFulfilmentMode;
    }
    if (order?.id) {
      const supabase = createSupabaseAdminClient();
      await supabase.from("orders").delete().eq("id", order.id);
    }
  });

  it("moves the order to sent_to_probo and stores the Probo order id", async () => {
    await handleMolliePayment(paymentId);

    const reloaded = await getOrderById(order.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.status).toBe("sent_to_probo");
    expect(reloaded!.probo_order_id).toBe(FAKE_PROBO_ID);
    expect(reloaded!.paid_at).toBeTruthy();
    expect(reloaded!.ordered_at).toBeTruthy();

    // The paid payment event should be recorded (idempotency ledger).
    const supabase = createSupabaseAdminClient();
    const { data: events } = await supabase
      .from("order_events")
      .select()
      .eq("order_id", order.id);
    const paidEvent = (events ?? []).find(
      (e) => e.source === "mollie" && e.event_type === "payment.paid",
    );
    expect(paidEvent).toBeTruthy();
  }, 30_000);
});
