import { getAllProducts } from "@/lib/catalog/products";

/**
 * Publieke, indexeerbare routes — één bron van waarheid.
 *
 * Stond eerder alleen in `app/sitemap.ts`. Nu apart, omdat twee dingen dezelfde
 * lijst nodig hebben: de sitemap zelf én de migratie-check in de admin-analytics
 * (welke WP-URL's met verkeer hebben straks geen tegenhanger?).
 *
 * Transactioneel (winkelwagen/afrekenen/order) en beheer (admin/api) horen hier
 * bewust niet: die zijn ge-noindex'd via `app/robots.ts`.
 */

export const STATIC_ROUTES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/collectie", priority: 0.9 },
  { path: "/voor-bedrijven", priority: 0.8 },
  { path: "/voor-gemeenten", priority: 0.8 },
  { path: "/voor-verenigingen", priority: 0.8 },
  { path: "/duurzaamheid", priority: 0.7 },
  { path: "/materiaal", priority: 0.7 },
  // De claimpagina: elke afbreekbaarheidsclaim op de site linkt hierheen. Hoge
  // prioriteit omdat hij de onderbouwing draagt onder de zoektermen waarop we
  // staan, en omdat elke productpagina er intern naar verwijst.
  { path: "/afbreekbaarheid", priority: 0.8 },
  // Het materiaaldossier: de achtergrondpagina waar andere sites naar kunnen
  // linken. Verwijst zelf door naar /afbreekbaarheid voor de cijfers.
  { path: "/materiaaldossier", priority: 0.7 },
  // De bestektekst voor inkopers: er bestaat geen landelijk inkoopcriterium
  // voor vlaggen, dus deze pagina levert de formulering aan.
  { path: "/aanbesteding", priority: 0.7 },
  // Landingspagina op een zoekterm die geen concurrent bedient, met een
  // terugkerende aankoop erachter.
  { path: "/beachflag-doek-vervangen", priority: 0.7 },
  { path: "/garantie", priority: 0.6 },
  { path: "/certificeringen", priority: 0.6 },
  { path: "/csrd", priority: 0.7 },
  { path: "/kennisbank", priority: 0.7 },
  { path: "/veelgestelde-vragen", priority: 0.6 },
  { path: "/over-ons", priority: 0.6 },
  { path: "/contact", priority: 0.6 },
  { path: "/algemene-voorwaarden", priority: 0.2 },
  { path: "/privacyverklaring", priority: 0.2 },
  { path: "/cookiebeleid", priority: 0.2 },
];

/** Kennisbank-artikelen (bestandsroutes onder `/kennisbank`). */
export const KENNISBANK_SLUGS = [
  "flag-ciclo-technologie",
  "csrd-compliance",
  "microplastics",
  "vlaggen-kiezen",
  "rpet-ciclo-polyester",
];

/** Elk publiek pad van de nieuwe site, zonder trailing slash. */
export function allePublicRoutes(): string[] {
  return [
    ...STATIC_ROUTES.map((r) => r.path),
    ...getAllProducts().map((p) => `/collectie/${p.slug}`),
    ...KENNISBANK_SLUGS.map((s) => `/kennisbank/${s}`),
  ];
}
