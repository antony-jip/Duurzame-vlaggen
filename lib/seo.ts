/**
 * Gedeelde SEO-constanten en JSON-LD-bouwstenen.
 *
 * `SITE_URL` volgt `NEXT_PUBLIC_APP_URL` wanneer die gezet is (op Vercel het
 * echte domein) en valt anders terug op het productiedomein. Trailing slash
 * wordt weggehaald zodat canonical-paden schoon aansluiten.
 *
 * Belangrijk: Vercel-env-waarden (bv. `duurzame-vlaggen.vercel.app`) komen vaak
 * ZONDER protocol binnen. `new URL()` in de metadataBase crasht dan met
 * "Invalid URL". Daarom forceren we hier altijd een `https://`-schema.
 */

import {
  MARKET_DOMAINS,
  getMarketConfig,
  normalizeHost,
  type Market,
} from "@/config/domains";

const rawSiteUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "https://duurzame-vlaggen.nl"
).trim();

export const SITE_URL = (
  /^https?:\/\//i.test(rawSiteUrl) ? rawSiteUrl : `https://${rawSiteUrl}`
).replace(/\/$/, "");

export const SITE_NAME = "Duurzame Vlaggen";

/**
 * @deprecated Gebruik `BEDRIJF` uit `lib/bedrijf.ts`.
 *
 * Stond hier als "Sign Company B.V." en werd in JSON-LD als `Organization.name`
 * gebruikt. Twee dingen klopten daar niet: de rechtsvorm (het is een VOF) en de
 * plek — `name` hoort het merk te zijn waarop gezocht wordt, de rechtspersoon
 * hoort in `legalName`.
 */
export const COMPANY_NAME = "Duurzame Vlaggen";

/** Standaard deelbeeld (OG/Twitter): merkfoto van wapperende vlaggen. */
export const OG_IMAGE =
  "https://hyvtseexvsdpdlrzwtgi.supabase.co/storage/v1/object/public/product-media/wp/756-duurzame-vlaggen-home-1.webp";

/** Volledig logo (lichte variant) als absolute URL voor structured data. */
export const LOGO_URL = `${SITE_URL}/logo-full-light.png`;

/** Rendert een JSON-LD payload veilig als string voor een <script>-tag. */
export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// ── Host-aware SEO (multi-domein) ──────────────────────────────────────────
// Eén Vercel-project bedient vijf marktdomeinen. Zonder host-bewustzijn zenden
// .be/.de/.fr/.com allemaal een canonical naar .nl → Google vouwt ze als
// duplicaat weg en ze ranken nooit in eigen markt. Onderstaande helpers leiden
// de juiste origin/taal/hreflang af uit het request-host. Bewust hier (geen
// Next-import) zodat `config/domains.ts` de enige bron van waarheid blijft.
// (De config-import staat bovenaan dit bestand.)

/** OG-locale (underscore-vorm) per markt, voor <meta property="og:locale">. */
const OG_LOCALE: Record<Market, string> = {
  "nl-NL": "nl_NL",
  "nl-BE": "nl_BE",
  "de-DE": "de_DE",
  "fr-FR": "fr_FR",
  en: "en",
};

/**
 * Absolute site-URL voor de markt die bij dit request-host hoort. Canonicals
 * moeten self-referentieel zijn op het HUIDIGE domein. Onbekende hosts
 * (Vercel-preview, lokaal) vallen terug op `SITE_URL`.
 */
export function siteUrlForHost(host: string | null | undefined): string {
  if (!host) return SITE_URL;
  const h = normalizeHost(host);
  return MARKET_DOMAINS[h] ? `https://${h}` : SITE_URL;
}

/** BCP-47 taalcode voor <html lang> op basis van het request-host. */
export function htmlLangForHost(host: string | null | undefined): string {
  return getMarketConfig(host ?? "").hreflang;
}

/** OG-locale voor het request-host. */
export function ogLocaleForHost(host: string | null | undefined): string {
  return OG_LOCALE[getMarketConfig(host ?? "").market];
}

/**
 * hreflang-cluster voor één pad. De vijf marktdomeinen vormen samen één cluster:
 * elk pad verwijst naar zichzelf op elk domein, plus een x-default (.nl). De
 * lijst is host-onafhankelijk (voor elk domein identiek) — alleen de canonical
 * (`siteUrlForHost`) verschilt per request.
 */
export function hreflangAlternates(path: string): Record<string, string> {
  const clean = path === "/" ? "" : path.replace(/\/$/, "");
  const langs: Record<string, string> = {};
  for (const [host, cfg] of Object.entries(MARKET_DOMAINS)) {
    langs[cfg.hreflang] = `https://${host}${clean}`;
  }
  langs["x-default"] = `https://duurzame-vlaggen.nl${clean}`;
  return langs;
}

/**
 * Kant-en-klaar `alternates`-blok voor een pagina: self-referentiële canonical
 * (relatief, lost op tegen de host-aware metadataBase) + de hreflang-cluster.
 * Gebruik in elke `generateMetadata`: `alternates: pageAlternates("/collectie")`.
 */
export function pageAlternates(path: string) {
  return { canonical: path, languages: hreflangAlternates(path) };
}
