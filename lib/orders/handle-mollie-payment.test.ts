import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * Integratietest voor de betaald-tak van de Mollie-webhook
 * ({@link handleMolliePayment}), met de EXTERNE rand gemockt en de ECHTE
 * repository tegen de test-DB:
 *
 *   - `@/lib/mollie/payments`.getPayment → geeft `status: "paid"` terug.
 *     Mollie-testbetalingen zijn via de API niet op `paid` te forceren, dus we
 *     mocken de gezaghebbende her-ophaal die de webhook doet.
 *   - repository (`insertOrderWithItems`, `getOrderById`, `advanceOrderStatus`,
 *     `recordEventOnce`) is echt en praat met de Supabase-test-DB.
 *
 * Bewijst: een `paid`-webhook zet een `awaiting_payment`-order op `paid`,
 * stempelt `paid_at` en legt het event vast (idempotentie-grootboek). Daar stopt
 * het — inkoop bij Probo gaat met de hand vanuit de admin, dus de order blijft
 * bewust op `paid` staan tot iemand hem daar oppakt. Deze test bewees hiervoor
 * de automatische doorzet naar Probo; die API-koppeling is weg (2026-07-15).
 *
 * Gate op de service-role-key: slaat over in een hermetische CI zonder DB.
 */

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

import { handleMolliePayment } from "@/lib/orders/orchestration";
import { insertOrderWithItems } from "@/lib/orders/repository";
import { getOrderById } from "@/lib/orders/repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json, OrderRow } from "@/lib/db/types";

const hasDb = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

describe.skipIf(!hasDb)("handleMolliePayment: paid webhook → paid", () => {
  let order: OrderRow;
  const paymentId = `tr_test_${randomUUID().replace(/-/g, "").slice(0, 20)}`;

  beforeAll(async () => {
    // Seed een order die al op betaling wacht, zoals vlak na placeOrder.
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
          probo_product_code: "flag-ciclo",
          product_type: "baniervlag",
          configuration: { code: "flag-ciclo", options: [] } as unknown as Json,
          amount: 1,
          markup_pct: 0,
          base_price: 10,
          line_price: 10,
        },
      ],
    );
  });

  afterAll(async () => {
    if (order?.id) {
      const supabase = createSupabaseAdminClient();
      await supabase.from("orders").delete().eq("id", order.id);
    }
  });

  it("zet de order op paid en stempelt paid_at", async () => {
    await handleMolliePayment(paymentId);

    const reloaded = await getOrderById(order.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.status).toBe("paid");
    expect(reloaded!.paid_at).toBeTruthy();

    // Blijft bewust staan: er is geen automatische doorzet naar Probo meer.
    expect(reloaded!.probo_order_id).toBeNull();

    // Het paid-event hoort vastgelegd te zijn (idempotentie-grootboek).
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
