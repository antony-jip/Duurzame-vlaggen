import { describe, expect, it } from "vitest";

import { configureProduct, getPrice, getProducts } from "./products";

/**
 * LIVE smoke tests against the Probo TEST API. Gated on PROBO_API_KEY so they
 * are skipped in environments without credentials (e.g. CI without secrets).
 * Run with: `npm run test:e2e`.
 *
 * Assertions are deliberately loose — they confirm the request/response wiring
 * without hardcoding fragile catalogue-specific values.
 */

// A fully-configured product known to price on the test catalogue. If Probo
// retires it, this configure/price flow may need updating.
const WINDOW_DECAL = {
  code: "window-decal",
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
} as const;

describe.skipIf(!process.env.PROBO_API_KEY)("Probo live smoke tests", () => {
  it("getProducts returns at least one product with a code", async () => {
    const result = await getProducts({ per_page: 5 });
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(typeof result.data[0].code).toBe("string");
    expect(result.data[0].code.length).toBeGreaterThan(0);
  });

  it("configureProduct returns a calculationId for a fully configured product", async () => {
    const result = await configureProduct({
      language: "en",
      products: [{ ...WINDOW_DECAL, options: [...WINDOW_DECAL.options] }],
    });
    expect(typeof result.calculationId).toBe("string");
    // A fully-configured product yields a non-empty calculation_id.
    expect(result.calculationId.length).toBeGreaterThan(0);
  });

  it("getPrice returns a positive purchase price in EUR", async () => {
    const result = await getPrice({
      deliveries: [
        {
          address: {
            company_name: "Test BV",
            first_name: "Jan",
            last_name: "Test",
            street: "Teststraat",
            house_number: "1",
            postal_code: "1000AA",
            city: "Amsterdam",
            country: "NL",
          },
        },
      ],
      products: [{ ...WINDOW_DECAL, options: [...WINDOW_DECAL.options] }],
    });
    expect(result.currency).toBe("EUR");
    expect(result.purchasePrice).toBeGreaterThan(0);
    // salesPrice may be null on some accounts; when present it is a number.
    if (result.salesPrice !== null) {
      expect(typeof result.salesPrice).toBe("number");
    }
    expect(result.shippingPrice).toBeGreaterThanOrEqual(0);
    expect(result.packagingPrice).toBeGreaterThanOrEqual(0);
  });
});
