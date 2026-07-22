import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * robots.txt (Next 16 metadata-route). Indexeren mag; de transactionele en
 * beheerroutes blijven buiten de index. Verwijst naar de sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // `/account`, `/aanleveren`, `/opnieuw` en `/uitschrijven` horen hier
      // ook in: ze zijn transactioneel, en de laatste drie zijn tokenroutes die
      // om meer dan indexeringsredenen niet in een zoekmachine thuishoren.
      disallow: [
        "/admin",
        "/api",
        "/afrekenen",
        "/winkelwagen",
        "/order",
        "/account",
        "/aanleveren",
        "/opnieuw",
        "/uitschrijven",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
