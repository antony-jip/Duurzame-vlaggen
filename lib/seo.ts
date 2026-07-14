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

const rawSiteUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "https://duurzame-vlaggen.nl"
).trim();

export const SITE_URL = (
  /^https?:\/\//i.test(rawSiteUrl) ? rawSiteUrl : `https://${rawSiteUrl}`
).replace(/\/$/, "");

export const SITE_NAME = "Duurzame Vlaggen";

export const COMPANY_NAME = "Sign Company B.V.";

/** Standaard deelbeeld (OG/Twitter): merkfoto van wapperende vlaggen. */
export const OG_IMAGE =
  "https://hyvtseexvsdpdlrzwtgi.supabase.co/storage/v1/object/public/product-media/wp/756-duurzame-vlaggen-home-1.webp";

/** Volledig logo (lichte variant) als absolute URL voor structured data. */
export const LOGO_URL = `${SITE_URL}/logo-full-light.png`;

/** Rendert een JSON-LD payload veilig als string voor een <script>-tag. */
export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
