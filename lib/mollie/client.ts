import "server-only";

import { serverEnv } from "@/lib/env";
import { requestJson, type RequestOptions } from "@/lib/http";

/**
 * Low-level Mollie API client. Wraps {@link requestJson} with the Mollie v2
 * base URL and Bearer authentication. Everything returns `unknown`; callers
 * validate the shape with the zod schemas in `./schemas`.
 */

/**
 * Test-seam: de flow-e2e-test (lib/orders/flow.e2e.test.ts) wijst dit naar een
 * lokale mock-Mollie die onze payloads valideert. Zonder override praat alles
 * gewoon met het echte Mollie.
 */
const MOLLIE_BASE_URL =
  process.env.MOLLIE_BASE_URL ?? "https://api.mollie.com/v2";

/**
 * A Mollie amount object. Mollie ALWAYS represents money as a decimal string
 * with exactly two fraction digits plus an ISO 4217 currency code.
 */
export interface MollieAmount {
  value: string;
  currency: string;
}

/**
 * Convert a numeric euro amount into Mollie's `{ value, currency }` shape.
 * `value` is a string with exactly two decimals (e.g. `1` → `"1.00"`,
 * `10.5` → `"10.50"`). Negative zero is normalised to `"0.00"`.
 *
 * @throws {RangeError} when `euros` is not a finite number.
 */
export function toMollieAmount(euros: number, currency = "EUR"): MollieAmount {
  if (!Number.isFinite(euros)) {
    throw new RangeError(`toMollieAmount: amount must be a finite number, got ${euros}`);
  }
  // `-0` and tiny negatives from float noise would render as "-0.00"; clamp them.
  const normalised = Object.is(euros, -0) || (euros < 0 && euros > -0.005) ? 0 : euros;
  return { value: normalised.toFixed(2), currency };
}

/**
 * Perform an authenticated request against the Mollie API and return the parsed
 * JSON body as `unknown`. `path` is relative to the v2 base (e.g. `/payments`).
 * Throws {@link HttpError} on a non-2xx response or a network/timeout failure.
 */
export function mollieRequest(
  path: string,
  options: RequestOptions = {},
): Promise<unknown> {
  const url = `${MOLLIE_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  return requestJson(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${serverEnv.mollieApiKey}`,
      ...options.headers,
    },
  });
}
