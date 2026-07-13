import "server-only";

import type { Market } from "@/config/domains";
import { marketToCountry, SELLER_COUNTRY, standardRateForCountry } from "@/lib/vat/rates";
import { validateVatNumber } from "@/lib/vat/vies";

/**
 * VAT computation for an order (v1).
 *
 * The rules below are a pragmatic first version and are CONFIGURABLE — they
 * MUST be reviewed by the accountant (OSS registration, distance-selling
 * thresholds, reduced-rate categories, the `en`/.com market mapping, and the
 * exact non-EU export handling). See TODOs inline.
 */

/**
 * EU member-state country codes (ISO 3166-1 alpha-2). Used to distinguish
 * intra-EU sales (reverse charge / OSS) from non-EU exports (0% export).
 *
 * TODO(accountant): confirm the definitive list and any special territories
 * (e.g. Canary Islands, Åland) that are outside the EU VAT area.
 */
export const EU_COUNTRIES: ReadonlySet<string> = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

export interface ComputeVatInput {
  isBusiness: boolean;
  vatNumber?: string | null;
  market: Market;
  /** ISO alpha-2 ship-to country. Overrides the market-derived country. */
  shippingCountry?: string | null;
}

export interface ComputeVatResult {
  /** VAT rate to apply, in percent. */
  rate: number;
  /** True when the sale is an intra-EU B2B reverse-charge supply (0% here). */
  reverseCharge: boolean;
  /** VIES result for the supplied number: true/false, or null (no number / VIES unknown). */
  vatNumberValid: boolean | null;
}

/**
 * Compute the VAT rate and reverse-charge flag for a checkout.
 *
 * Rules (v1):
 *  - Customer country = `shippingCountry` if given, else `marketToCountry(market)`.
 *  - B2B with a VALID VIES number, customer country ≠ seller country, and
 *    customer country in the EU → reverse charge (rate 0, vatNumberValid true).
 *  - Non-EU customer country → 0% export (no reverse charge).
 *  - Otherwise (domestic / B2C / EU) → standard rate of the customer country,
 *    falling back to the seller-country rate when the customer country is
 *    unknown/unconfigured (e.g. the `en`/.com market).
 *
 * VIES is only called when a VAT number is present.
 */
export async function computeVat(input: ComputeVatInput): Promise<ComputeVatResult> {
  const { isBusiness, vatNumber, market, shippingCountry } = input;

  const customerCountry = (shippingCountry ?? marketToCountry(market))?.toUpperCase() ?? null;
  const hasVatNumber = Boolean(vatNumber && vatNumber.trim());

  // Only hit VIES when there is a number to validate.
  let vatNumberValid: boolean | null = null;
  if (hasVatNumber && customerCountry) {
    const result = await validateVatNumber(customerCountry, vatNumber!.trim());
    vatNumberValid = result.valid;
  }

  const isEuCustomer = customerCountry !== null && EU_COUNTRIES.has(customerCountry);

  // Intra-EU B2B reverse charge: valid VAT number, different EU country.
  if (
    isBusiness &&
    hasVatNumber &&
    vatNumberValid === true &&
    customerCountry !== null &&
    customerCountry !== SELLER_COUNTRY &&
    isEuCustomer
  ) {
    return { rate: 0, reverseCharge: true, vatNumberValid: true };
  }

  // Non-EU export: no EU VAT. (A known customer country that is not in the EU.)
  if (customerCountry !== null && !isEuCustomer) {
    return { rate: 0, reverseCharge: false, vatNumberValid: hasVatNumber ? vatNumberValid : null };
  }

  // Domestic / B2C / EU without valid reverse-charge → destination standard rate,
  // falling back to the seller country when the customer country is unknown.
  const rate =
    (customerCountry !== null ? standardRateForCountry(customerCountry) : null) ??
    standardRateForCountry(SELLER_COUNTRY) ??
    0;

  return {
    rate,
    reverseCharge: false,
    vatNumberValid: hasVatNumber ? vatNumberValid : null,
  };
}
