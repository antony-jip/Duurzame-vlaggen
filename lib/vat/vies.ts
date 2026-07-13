import "server-only";

import { requestJson } from "@/lib/http";

/**
 * VIES VAT number validation (EU VAT Information Exchange System).
 *
 * Chosen endpoint form: the official VIES REST API POST endpoint
 *
 *   POST https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number
 *   body: { "countryCode": "NL", "vatNumber": "810433941B01" }
 *
 * which responds with a JSON object that includes a boolean `valid` field
 * (verified live: it also returns `name`, `address`, `requestDate`, …). We use
 * the POST variant rather than the GET `.../ms/{country}/vat/{number}` form
 * because the request body cleanly separates country and number and the
 * response `valid` field is directly what we need.
 *
 * IMPORTANT: VIES is frequently unavailable (member-state services go down,
 * rate limits, timeouts). A service/network failure MUST NOT block checkout, so
 * on any error we return `valid: null` ("unknown") instead of throwing. Only a
 * successful response with an explicit boolean produces `true`/`false`.
 */

const VIES_CHECK_URL =
  "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

/**
 * Normalise a raw VAT number for a given country: strip whitespace, dots and
 * dashes, uppercase, and remove a leading country-code prefix if the user
 * included one (e.g. "NL 8104.33.941.B01" → "810433941B01").
 */
function normalizeVatNumber(countryCode: string, vatNumber: string): string {
  let n = vatNumber.replace(/[\s.\-]/g, "").toUpperCase();
  const cc = countryCode.toUpperCase();
  if (n.startsWith(cc)) {
    n = n.slice(cc.length);
  }
  return n;
}

/**
 * Validate an EU VAT number via VIES.
 *
 * @returns `{ valid: true|false }` on a successful VIES response, or
 *   `{ valid: null }` when VIES could not be reached / returned an
 *   unexpected shape. `raw` carries the parsed response (or the error) for
 *   logging/debugging.
 */
export async function validateVatNumber(
  countryCode: string,
  vatNumber: string,
): Promise<{ valid: boolean | null; raw: unknown }> {
  const cc = countryCode.trim().toUpperCase();
  const number = normalizeVatNumber(cc, vatNumber);

  if (!cc || !number) {
    return { valid: null, raw: null };
  }

  try {
    const raw = await requestJson(VIES_CHECK_URL, {
      method: "POST",
      json: { countryCode: cc, vatNumber: number },
    });

    if (raw && typeof raw === "object" && "valid" in raw) {
      const valid = (raw as { valid: unknown }).valid;
      if (typeof valid === "boolean") {
        return { valid, raw };
      }
    }

    // Unexpected shape — treat as unknown rather than assuming invalid.
    return { valid: null, raw };
  } catch (error) {
    // VIES is unstable; never throw upward. Unknown result.
    return { valid: null, raw: error };
  }
}
