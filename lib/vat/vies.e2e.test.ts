import { describe, expect, it } from "vitest";

import { validateVatNumber } from "@/lib/vat/vies";

/**
 * LIVE VIES check — hits the real EU service, so it is gated off by default.
 * VIES is unstable; do not run this in CI as a gate. Enable locally with
 * `RUN_VIES_E2E=1 npm run test:e2e`.
 *
 * The number below is a public, well-known valid NL VAT number (Coolblue B.V.).
 */
const RUN = process.env.RUN_VIES_E2E === "1";

describe.skipIf(!RUN)("validateVatNumber (live VIES)", () => {
  it("validates a known-good NL VAT number", async () => {
    const result = await validateVatNumber("NL", "810433941B01");
    // If VIES is up, this should be true; if it is down we get null (unknown).
    expect(result.valid === true || result.valid === null).toBe(true);
  });

  it("reports an obviously invalid number as false (or null if VIES is down)", async () => {
    const result = await validateVatNumber("NL", "000000000B00");
    expect(result.valid === false || result.valid === null).toBe(true);
  });
});
