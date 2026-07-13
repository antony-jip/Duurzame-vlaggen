import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getAllProducts } from "@/lib/catalog/products";

/**
 * XML-sitemap (Next 16 metadata-route). Bevat alle publieke, indexeerbare
 * routes: de statische marketing-/info-pagina's, de productslugs uit de
 * catalogus en de kennisbank-artikelen. Transactioneel (winkelwagen,
 * afrekenen, order) en beheer (admin, api) horen hier bewust niet.
 */

/** Statische storefront-routes met hun relatieve prioriteit. */
const STATIC_ROUTES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/collectie", priority: 0.9 },
  { path: "/voor-bedrijven", priority: 0.8 },
  { path: "/voor-gemeenten", priority: 0.8 },
  { path: "/voor-verenigingen", priority: 0.8 },
  { path: "/duurzaamheid", priority: 0.7 },
  { path: "/materiaal", priority: 0.7 },
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

/** Kennisbank-artikelen (bestandsroutes onder /kennisbank). */
const KENNISBANK_SLUGS = [
  "flag-ciclo-technologie",
  "csrd-compliance",
  "microplastics",
  "vlaggen-kiezen",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: r.priority,
  }));

  const productEntries: MetadataRoute.Sitemap = getAllProducts().map((p) => ({
    url: `${SITE_URL}/collectie/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const kennisbankEntries: MetadataRoute.Sitemap = KENNISBANK_SLUGS.map(
    (slug) => ({
      url: `${SITE_URL}/kennisbank/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    }),
  );

  return [...staticEntries, ...productEntries, ...kennisbankEntries];
}
