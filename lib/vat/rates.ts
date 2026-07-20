import type { Market } from "@/config/domains";

/**
 * VAT rate configuration — the single source of truth for tariffs used across
 * checkout and order totals.
 *
 * Seller is Sign Company VOF, established in the Netherlands. Under the EU OSS
 * (One-Stop-Shop) scheme B2C sales are taxed at the CUSTOMER country's standard
 * rate. The rates below are the standard rates per country.
 *
 * NOTE: rates are configurable and MUST be confirmed by the accountant (OSS
 * registration, reduced-rate categories, thresholds). Treat these as sensible
 * defaults, not legal advice.
 */

/** Country where the seller (Sign Company VOF) is established. */
export const SELLER_COUNTRY = "NL";

/**
 * Standard VAT rates by ISO 3166-1 alpha-2 country code (percent).
 * Configurable — definitive values to be confirmed by the accountant (OSS).
 */
export const VAT_RATES: Record<string, number> = {
  NL: 21,
  BE: 21,
  DE: 19,
  FR: 20,
};

/**
 * Map a market to the customer's country (ISO alpha-2), or `null` when the
 * market does not pin down a single country.
 *
 * The `en` / .com market is country-indeterminate (it can serve any
 * English-speaking customer), so it returns `null` and MUST be handled
 * separately by the caller.
 *
 * TODO(accountant): confirm how the `en`/.com market maps to a taxable country
 * (fallback to seller country, ship-to country, or export handling).
 */
export function marketToCountry(market: Market): string | null {
  switch (market) {
    case "nl-NL":
      return "NL";
    case "nl-BE":
      return "BE";
    case "de-DE":
      return "DE";
    case "fr-FR":
      return "FR";
    case "en":
      return null;
    default: {
      // Exhaustiveness guard — a new Market must be handled explicitly.
      const _never: never = market;
      return _never;
    }
  }
}

/**
 * Standard VAT rate for a country (percent), or `null` when the country is not
 * configured (e.g. outside the OSS set we support).
 */
export function standardRateForCountry(country: string): number | null {
  return VAT_RATES[country] ?? null;
}

/**
 * Standard rate to SHOW on a market's shop pages (percent).
 *
 * Display-only: this is the B2C case a browsing visitor sees before we know
 * anything about them. The rate actually charged is decided at checkout by
 * `computeVat`, which additionally handles reverse charge, non-EU export and
 * the ship-to country. Keep the fallback here identical to `computeVat`'s
 * (seller country when the market pins down no country, i.e. `en`/.com) so the
 * price on the page matches the price in the basket.
 */
export function displayRateForMarket(market: Market): number {
  const country = marketToCountry(market);
  return (
    (country !== null ? standardRateForCountry(country) : null) ??
    standardRateForCountry(SELLER_COUNTRY) ??
    0
  );
}
