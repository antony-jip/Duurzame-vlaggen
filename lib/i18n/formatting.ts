/**
 * Locale-aware formatting helpers built on the `Intl` platform APIs — no
 * dependencies. Safe to import from both server and client components (they
 * do not read request headers; pass the catalog explicitly).
 */

import type { UiCatalog } from "@/config/domains";

/**
 * BCP-47 locale used for `Intl` formatting per UI catalog.
 *
 * `en` maps to `en-IE`: the English shop trades in EUR across the EU, and
 * `en-IE` renders the euro natively (symbol before the amount, comma
 * thousands) rather than the pound/dollar habits of en-GB/en-US.
 */
const CATALOG_LOCALE: Record<UiCatalog, string> = {
  nl: "nl-NL",
  de: "de-DE",
  fr: "fr-FR",
  en: "en-IE",
};

/**
 * Format a money amount for display. `amount` is in major currency units
 * (e.g. euros), not cents — convert before calling if you store cents.
 */
export function formatCurrency(
  amount: number,
  catalog: UiCatalog,
  currency = "EUR",
): string {
  return new Intl.NumberFormat(CATALOG_LOCALE[catalog], {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format a date for display. Accepts a `Date` or anything the `Date`
 * constructor understands (ISO string, epoch millis). Defaults to a medium
 * date style; pass `options` to override.
 */
export function formatDate(
  date: Date | string | number,
  catalog: UiCatalog,
  options: Intl.DateTimeFormatOptions = { dateStyle: "long" },
): string {
  const value = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(CATALOG_LOCALE[catalog], options).format(value);
}
