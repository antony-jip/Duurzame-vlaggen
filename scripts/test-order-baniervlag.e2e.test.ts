import { afterAll, describe, expect, it } from "vitest";

import {
  advanceOrderStatus,
  getOrderById,
  getOrderItems,
  placeOrder,
  sendOrderToProbo,
  type CheckoutInput,
} from "@/lib/orders";
import { buildProboOptions } from "@/lib/catalog/probo-mapping";
import { getProduct } from "@/lib/catalog/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrderRow } from "@/lib/db/types";
import type { ProboAddress } from "@/lib/probo/products";
import { publicEnv } from "@/lib/env";

/**
 * Fase 3-bewijs: end-to-end test-order voor een GEMAPTE baniervlag.
 *
 * Anders dan probo.e2e (window-decal) gebruikt deze test de echte
 * storefront→Probo mapping (lib/catalog/probo-mapping) om de options-array te
 * bouwen, plaatst een order incl. een `files:[{uri}]`-artwork-URL, simuleert de
 * betaling en dient een `order_type:"test"` order in bij Probo. De order wordt
 * daarna weer verwijderd zodat herhaalde runs de DB niet vervuilen.
 */

const hasKeys =
  Boolean(process.env.PROBO_API_KEY) &&
  Boolean(process.env.MOLLIE_API_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

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

// A publicly-shaped artwork URL in our own order-artwork bucket. For a test
// order Probo does not synchronously fetch it; we only prove it is threaded
// through placeOrder → order_items.file_url → Probo `files:[{uri}]`.
const FILE_URL = `${publicEnv.supabaseUrl}/storage/v1/object/public/order-artwork/e2e/baniervlag-test.pdf`;

const banier = getProduct("baniervlag")!;
const size = banier.sizes[0]; // 250 × 100 cm
const mapped = buildProboOptions("baniervlag", {
  widthCm: size.widthCm!,
  heightCm: size.heightCm!,
  amount: 1,
  selections: { Afwerking: "Zoom met ringen", Bevestiging: "Karabijnhaken" },
})!;

const CHECKOUT_INPUT: CheckoutInput = {
  market: "nl-NL",
  email: "e2e-banier@example.com",
  shippingAddress: NL_ADDRESS,
  items: [
    {
      proboProductCode: banier.proboProductCode!,
      productType: "baniervlag",
      productName: banier.name,
      amount: 1,
      options: mapped.options,
      selections: { Afwerking: "Zoom met ringen", Bevestiging: "Karabijnhaken" },
      unmapped: mapped.unmapped,
      fileUrl: FILE_URL,
    },
  ],
};

describe.skipIf(!hasKeys)("e2e: gemapte baniervlag → paid → Probo", () => {
  let order: OrderRow;
  let prevAppUrl: string | undefined;

  // Mollie rejects a localhost webhookUrl → override to a public https URL.
  prevAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://duurzame-vlaggen.vercel.app";

  afterAll(async () => {
    process.env.NEXT_PUBLIC_APP_URL = prevAppUrl;
    if (order?.id) {
      const supabase = createSupabaseAdminClient();
      await supabase.from("orders").delete().eq("id", order.id);
    }
  });

  it("plaatst de order, prijst via Probo en bewaart de mapping-config", async () => {
    const result = await placeOrder(CHECKOUT_INPUT);
    order = result.order;

    expect(order.status).toBe("awaiting_payment");
    expect(order.total).toBeGreaterThan(0);

    const items = await getOrderItems(order.id);
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item.base_price).toBeGreaterThan(0);
    expect(item.file_url).toBe(FILE_URL);
    // The Probo options array + human selections + unmapped choice are stored.
    const config = item.configuration as {
      options: Array<{ code: string }>;
      selections: Record<string, string>;
      unmapped: Array<{ label: string; value: string }>;
    };
    expect(config.options).toContainEqual({ code: "band-and-plastic-rings" });
    expect(config.selections.Afwerking).toBe("Zoom met ringen");
    expect(config.unmapped).toContainEqual({
      label: "Bevestiging",
      value: "Karabijnhaken",
    });
  }, 60_000);

  it("gesimuleerde betaling → order naar Probo (order_type:test) met files", async () => {
    await advanceOrderStatus(order.id, "paid", { mollie_status: "paid" });
    await sendOrderToProbo(order.id);

    const reloaded = await getOrderById(order.id);
    expect(reloaded!.status).toBe("sent_to_probo");
    expect(reloaded!.probo_order_id).toBeTruthy();
    order = reloaded!;
    // eslint-disable-next-line no-console
    console.log(
      `[e2e baniervlag] order_number=${order.order_number} probo_order_id=${order.probo_order_id}`,
    );
  }, 60_000);
});
