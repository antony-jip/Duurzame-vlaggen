import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getAllProducts } from "@/lib/catalog/products";
import { STATIC_ROUTES, KENNISBANK_SLUGS } from "@/lib/routes";

/**
 * XML-sitemap (Next 16 metadata-route). Bevat alle publieke, indexeerbare
 * routes: de statische marketing-/info-pagina's, de productslugs uit de
 * catalogus en de kennisbank-artikelen. Transactioneel (winkelwagen,
 * afrekenen, order) en beheer (admin, api) horen hier bewust niet.
 *
 * De routelijst zelf staat in `lib/routes.ts`, omdat de migratie-check in de
 * admin-analytics dezelfde lijst nodig heeft.
 */

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
