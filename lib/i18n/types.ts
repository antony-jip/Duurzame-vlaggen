/**
 * i18n type surface.
 *
 * The `nl` catalog is the source of truth: every other catalog
 * (`de`/`fr`/`en`) must share its exact key structure. We derive the
 * `Dictionary` type from `messages/nl.json` so that any component reading
 * `dict.section.key` is type-checked against the real catalog shape.
 */

import type nl from "@/messages/nl.json";

/** Shape of a message catalog, inferred from the Dutch base catalog. */
export type Dictionary = typeof nl;

/** Re-export the catalog union so consumers import everything i18n from here. */
export type { UiCatalog, Market } from "@/config/domains";
