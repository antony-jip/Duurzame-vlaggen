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

/**
 * FAQPage-structured data uit een vraag-antwoordlijst.
 *
 * Verwachting bijstellen: Google haalde op 7 mei 2026 de FAQ-rich-results uit
 * Search, dus dit levert géén uitklapbare vragen meer op in de SERP. Het
 * schematype zelf is niet afgeschaft en blijft gewoon uitgelezen. De reden om
 * het toch te zetten is extractie: AI Overviews, Gemini, ChatGPT en Perplexity
 * pakken ondubbelzinnig gemarkeerde Q&A makkelijker op. Google zegt er
 * uitdrukkelijk bij dat structured data géén voorwaarde is voor AI Overviews,
 * dus dit is goedkope hygiëne, geen hefboom.
 *
 * Alleen gebruiken op pagina's die écht een vraag-antwoordblok tonen. Schema
 * dat niet overeenkomt met zichtbare inhoud is misleidend en levert niets op.
 */
/**
 * BreadcrumbList uit een pad van kruimels, ondiepste eerst.
 *
 * Anders dan FAQPage heeft dit wél een zichtbaar effect: Google toont het pad
 * ("duurzame-vlaggen.nl › Kennisbank › Microplastics") in plaats van een kale
 * URL. Zelfde patroon als landenvlaggen en collectie al gebruiken, nu als
 * gedeelde functie zodat er niet drie varianten naast elkaar ontstaan.
 *
 * `pad` is site-relatief en begint met een slash; deze functie maakt er een
 * absolute URL van.
 */
export function breadcrumbJsonLd(
  kruimels: ReadonlyArray<{ naam: string; pad: string }>,
): string {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: kruimels.map((kruimel, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: kruimel.naam,
      item: `${SITE_URL}${kruimel.pad}`,
    })),
  });
}

export function faqJsonLd(items: ReadonlyArray<{ q: string; a: string }>): string {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  });
}
