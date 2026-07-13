import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  advanceOrderStatus,
  getOrderById,
  getOrderItems,
  placeOrder,
  sendOrderToProbo,
  type CheckoutInput,
} from "@/lib/orders";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrderItemRow, OrderRow } from "@/lib/db/types";
import type { ProboAddress } from "@/lib/probo/products";

/**
 * Fase 3-bewijs: end-to-end order-flow tegen de live TEST-integraties
 * (Probo test-catalogus, Mollie test-key, Supabase test-DB).
 *
 * Deze test draait ECHT: hij configureert + prijst een product bij Probo, maakt
 * een Mollie test-payment, schrijft de order weg, en dient (na een gesimuleerde
 * betaling) een echte `order_type:"test"` order in bij Probo. Aan het eind wordt
 * de order weer verwijderd zodat herhaalde runs de DB niet vervuilen.
 *
 * Gated op de aanwezigheid van de drie TEST-keys; zonder keys wordt hij geskipt.
 */

const hasKeys =
  Boolean(process.env.PROBO_API_KEY) &&
  Boolean(process.env.MOLLIE_API_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Round to 2 decimals, matching the money boundaries in lib/pricing. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const NL_ADDRESS: ProboAddress = {
  company_name: "Test BV",
  first_name: "Jan",
  last_name: "Test",
  street: "Teststraat",
  house_number: "1",
  postal_code: "1000AA",
  city: "Amsterdam",
  country: "NL",
};

const CHECKOUT_INPUT: CheckoutInput = {
  market: "nl-NL",
  email: "e2e@example.com",
  shippingAddress: NL_ADDRESS,
  items: [
    {
      proboProductCode: "window-decal",
      productType: "raamsticker",
      amount: 1,
      options: [
        { code: "width", value: "100" },
        { code: "height", value: "100" },
        { code: "amount", value: "1" },
        { code: "white" },
        { code: "backward-facing" },
        { code: "long-term" },
        { code: "ij40-114" },
        { code: "no-laminate" },
        { code: "cut" },
        { code: "customer-supplied-file" },
      ],
    },
  ],
};

describe.skipIf(!hasKeys)("e2e: order-flow placeOrder → paid → Probo", () => {
  // State shared across the sequential `it`s below.
  let order: OrderRow;
  let checkoutUrl: string | null;
  let items: OrderItemRow[];
  let prevAppUrl: string | undefined;

  beforeAll(() => {
    // `.env.local` sets NEXT_PUBLIC_APP_URL=http://localhost:3000, but Mollie
    // rejects a localhost webhookUrl with HTTP 422 ("unreachable from Mollie's
    // point of view"). Override to a publicly reachable https URL so the
    // webhook/redirect URLs pass Mollie's validation. This is a test-env config
    // override, not a lib change: the orchestration correctly derives these URLs
    // from publicEnv.appUrl — only the local value is unroutable.
    prevAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://duurzame-vlaggen.vercel.app";
  });

  afterAll(async () => {
    process.env.NEXT_PUBLIC_APP_URL = prevAppUrl;
    // Cleanup: verwijder de aangemaakte order (cascade ruimt items + events op),
    // zodat herhaalde runs de DB niet vervuilen. Draait ook bij een falende test.
    if (order?.id) {
      const supabase = createSupabaseAdminClient();
      await supabase.from("orders").delete().eq("id", order.id);
    }
  });

  it("1. placeOrder configureert + prijst bij Probo en maakt een Mollie-payment", async () => {
    const result = await placeOrder(CHECKOUT_INPUT);
    order = result.order;
    checkoutUrl = result.checkoutUrl;

    expect(order.id).toBeTruthy();
    expect(order.status).toBe("awaiting_payment");
    expect(order.order_number).toMatch(/^DV-/);
    expect(order.mollie_payment_id).toBeTruthy();
    expect(order.mollie_payment_id).toMatch(/^tr_/);
    expect(checkoutUrl).toBeTruthy();
    expect(order.total).toBeGreaterThan(0);
  }, 60_000);

  it("2. de order + item + events staan correct in de DB", async () => {
    const reloaded = await getOrderById(order.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.status).toBe("awaiting_payment");

    items = await getOrderItems(order.id);
    expect(items).toHaveLength(1);

    const item = items[0];
    expect(item.calculation_id).toBeTruthy();
    expect(item.base_price).toBeGreaterThan(0);
    // Standaard markup 50% → line_price = round2(base_price * 1.5).
    expect(item.line_price).toBe(round2(item.base_price! * 1.5));
    expect(item.markup_pct).toBe(50);

    const supabase = createSupabaseAdminClient();
    const { data: events, error } = await supabase
      .from("order_events")
      .select()
      .eq("order_id", order.id);
    expect(error).toBeNull();
    const created = (events ?? []).find(
      (e) => e.source === "mollie" && e.event_type === "payment.created",
    );
    expect(created).toBeTruthy();
  }, 30_000);

  it("3. gesimuleerde betaling → order gaat naar Probo (order_type:test)", async () => {
    // Mollie laat test-betalingen niet via de API op `paid` zetten; simuleer de
    // uitkomst van de webhook-tak en dien daarna in bij Probo.
    await advanceOrderStatus(order.id, "paid", { mollie_status: "paid" });
    await sendOrderToProbo(order.id);

    const reloaded = await getOrderById(order.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.status).toBe("sent_to_probo");
    expect(reloaded!.probo_order_id).toBeTruthy();
    expect(reloaded!.ordered_at).toBeTruthy();

    // Bewaar de laatste order-state voor de reporting-log hieronder.
    order = reloaded!;
    // eslint-disable-next-line no-console
    console.log(
      `[e2e] order_number=${order.order_number} probo_order_id=${order.probo_order_id}`,
    );
  }, 60_000);
});
