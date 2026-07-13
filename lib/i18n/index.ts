import "server-only";

/**
 * Server-side i18n helpers.
 *
 * `proxy.ts` sets `x-ui-catalog` and `x-market` request headers on every
 * market domain. These helpers read those headers (Next 16: `headers()` is
 * async) and resolve the right message catalog. Catalogs are statically
 * imported so they are bundled at build time — no runtime fetch.
 */

import { headers } from "next/headers";
import type { UiCatalog, Market } from "@/config/domains";
import type { Dictionary } from "./types";
import nl from "@/messages/nl.json";
import de from "@/messages/de.json";
import fr from "@/messages/fr.json";
import en from "@/messages/en.json";

/** Static catalog map — every catalog shares the `nl` key structure. */
const CATALOGS: Record<UiCatalog, Dictionary> = { nl, de, fr, en };

/** The four UI catalogs; used to validate the incoming header value. */
const UI_CATALOGS: readonly UiCatalog[] = ["nl", "de", "fr", "en"];

/** All markets; used to validate the incoming `x-market` header value. */
const MARKETS: readonly Market[] = ["nl-NL", "nl-BE", "de-DE", "fr-FR", "en"];

const DEFAULT_CATALOG: UiCatalog = "nl";
const DEFAULT_MARKET: Market = "nl-NL";

function isUiCatalog(value: string | null): value is UiCatalog {
  return value !== null && (UI_CATALOGS as readonly string[]).includes(value);
}

function isMarket(value: string | null): value is Market {
  return value !== null && (MARKETS as readonly string[]).includes(value);
}

/**
 * Resolve the active UI catalog from the `x-ui-catalog` request header,
 * validated against the four allowed values. Falls back to `"nl"`.
 */
export async function getUiCatalog(): Promise<UiCatalog> {
  const h = await headers();
  const value = h.get("x-ui-catalog");
  return isUiCatalog(value) ? value : DEFAULT_CATALOG;
}

/**
 * Resolve the active market from the `x-market` request header, validated
 * against the five known markets. Falls back to `"nl-NL"`.
 */
export async function getMarket(): Promise<Market> {
  const h = await headers();
  const value = h.get("x-market");
  return isMarket(value) ? value : DEFAULT_MARKET;
}

/** Load the message dictionary for a given catalog. No async work — kept
 * `async` for a uniform call site and future-proofing. */
export async function getDictionary(catalog: UiCatalog): Promise<Dictionary> {
  return CATALOGS[catalog];
}

/**
 * Convenience for server components: resolve catalog + market and load the
 * matching dictionary in one call.
 */
export async function getMessages(): Promise<{
  catalog: UiCatalog;
  market: Market;
  dict: Dictionary;
}> {
  const [catalog, market] = await Promise.all([getUiCatalog(), getMarket()]);
  const dict = await getDictionary(catalog);
  return { catalog, market, dict };
}
