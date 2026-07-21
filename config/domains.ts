/**
 * Central domain configuration — single source of truth for locale routing.
 *
 * One Vercel project serves every shop domain. `proxy.ts` reads the request
 * hostname and uses these maps to decide between two behaviours:
 *
 *  1. Market sites  → serve localized content, set market/locale/currency
 *                     headers (NO redirect).
 *  2. Redirect sites → 301 to their target on the main market domain.
 *
 * See build spec §3. Keep this file free of any runtime/Next imports so it can
 * be used from both `proxy.ts` and server code.
 */

/** Market identifier — mirrors `orders.market` in the database. */
export type Market = "nl-NL" | "nl-BE" | "de-DE" | "fr-FR" | "en";

/** UI message-catalog key (`messages/{catalog}.json`). nl-NL and nl-BE share `nl`. */
export type UiCatalog = "nl" | "de" | "fr" | "en";

export interface MarketConfig {
  market: Market;
  /** Which `messages/*.json` catalog this market renders its UI from. */
  uiCatalog: UiCatalog;
  /** BCP-47 tag used for hreflang + Intl formatting. `x-default` handled separately. */
  hreflang: string;
  currency: "EUR";
}

/**
 * Market sites — real localized content. These form one hreflang cluster.
 * nl-NL and nl-BE share the `nl` UI catalog; the difference is market/VAT/legal.
 */
export const MARKET_DOMAINS: Record<string, MarketConfig> = {
  "duurzame-vlaggen.nl": { market: "nl-NL", uiCatalog: "nl", hreflang: "nl-NL", currency: "EUR" },
  "duurzame-vlaggen.be": { market: "nl-BE", uiCatalog: "nl", hreflang: "nl-BE", currency: "EUR" },
  "nachhaltige-flaggen.de": { market: "de-DE", uiCatalog: "de", hreflang: "de-DE", currency: "EUR" },
  "drapeaux-durables.fr": { market: "fr-FR", uiCatalog: "fr", hreflang: "fr-FR", currency: "EUR" },
  "sustainable-flags.com": { market: "en", uiCatalog: "en", hreflang: "en", currency: "EUR" },
};

/**
 * Redirect domains — no content of their own. 301 to a path on a market domain.
 * Paths are relative to the target host; proxy builds the absolute https URL.
 */
export const REDIRECT_DOMAINS: Record<string, { toHost: string; toPath: string }> = {
  "biologisch-afbreekbare-vlaggen.nl": { toHost: "duurzame-vlaggen.nl", toPath: "/" },
  // De paden stonden op /mastvlaggen, /baniervlaggen en /beachvlaggen. Die
  // routes bestaan niet: de echte slug is /collectie/<enkelvoud>. Elk van deze
  // domeinen leverde dus een 301 naar een 404, wat de linkwaarde van het
  // doorverwijzende domein weggooit. Gecontroleerd tegen lib/catalog/products.ts.
  "duurzame-mastvlaggen.nl": { toHost: "duurzame-vlaggen.nl", toPath: "/collectie/mastvlag" },
  "duurzame-baniervlaggen.nl": { toHost: "duurzame-vlaggen.nl", toPath: "/collectie/baniervlag" },
  "duurzame-beachvlaggen.nl": { toHost: "duurzame-vlaggen.nl", toPath: "/collectie/beachvlag" },
  // Open decision (spec §3): .com → en/x-default OR 301 → .nl.
  // Default to 301 → .nl until Antony decides. Remove this line to make it a market site.
  "duurzame-vlaggen.com": { toHost: "duurzame-vlaggen.nl", toPath: "/" },
};

/** Fallback market for local dev, Vercel preview URLs, and unknown hosts. */
export const DEFAULT_MARKET: MarketConfig = MARKET_DOMAINS["duurzame-vlaggen.nl"];

/** Strip a leading `www.` and port, lowercase — so `www.Duurzame-Vlaggen.nl:443` → `duurzame-vlaggen.nl`. */
export function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().split(":")[0].replace(/^www\./, "");
}

export function getRedirectTarget(hostname: string) {
  return REDIRECT_DOMAINS[normalizeHost(hostname)] ?? null;
}

export function getMarketConfig(hostname: string): MarketConfig {
  return MARKET_DOMAINS[normalizeHost(hostname)] ?? DEFAULT_MARKET;
}
