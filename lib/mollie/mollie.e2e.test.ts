import { describe, expect, it } from "vitest";

import { createPayment, getPayment } from "./payments";

/**
 * LIVE smoke test against the Mollie TEST API. Skipped when MOLLIE_API_KEY is
 * absent. Test-mode payments cost nothing. Run via `npm run test:e2e`.
 */
describe.skipIf(!process.env.MOLLIE_API_KEY)("Mollie payments (live test API)", () => {
  it("creates a payment and reads it back as open", async () => {
    const created = await createPayment({
      amount: 1.0,
      description: "e2e smoke",
      redirectUrl: "https://example.com/return",
    });

    expect(created.id).toMatch(/^tr_/);
    expect(created.checkoutUrl).toBeTruthy();
    expect(typeof created.checkoutUrl).toBe("string");

    const fetched = await getPayment(created.id);
    expect(fetched.id).toBe(created.id);
    expect(fetched.status).toBe("open");
    expect(fetched.amountValue).toBe("1.00");
    expect(fetched.currency).toBe("EUR");
  }, 30_000);
});
