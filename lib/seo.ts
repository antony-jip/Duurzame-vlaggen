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
 * Kruimelpad als `BreadcrumbList`.
 *
 * Geen van de zes marktleiders (dvc.nl, fabervlaggen.nl, stuntvlaggen.nl,
 * vlag-bedrukken.nl, printshopz.nl, expofit.nl) voert gestructureerde data op
 * productniveau. Dit beïnvloedt de wéérgave in de resultaten en daarmee de
 * doorklikratio, niet de positie zelf. Verkoop het intern niet als positiewinst.
 *
 * `items` gaat van algemeen naar specifiek; het pad is site-relatief.
 */
export function breadcrumbJsonLd(
  items: Array<{ naam: string; pad: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.naam,
      item: `${SITE_URL}${item.pad}`,
    })),
  };
}

/**
 * Veelgestelde vragen als `FAQPage`.
 *
 * Stond alleen op `/veelgestelde-vragen`, terwijl vier kennisbankpagina's ook
 * echte FAQ-blokken hebben. Let op: wat hier in gaat is precies wat er op de
 * pagina staat. Een antwoord dat je hier opvoert maar niet toont is tegen de
 * richtlijnen van Google, en een claim die je hier opvoert reist mee naar de
 * zoekresultaten.
 */
export function faqJsonLd(
  vragen: ReadonlyArray<{ q: string; a: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: vragen.map((v) => ({
      "@type": "Question",
      name: v.q,
      acceptedAnswer: { "@type": "Answer", text: v.a },
    })),
  };
}

/**
 * Kennisbankartikel als `Article`.
 *
 * BEWUST GEEN `aggregateRating` of `review`, hier niet en nergens: we hebben
 * geen echte reviews. Reviewmarkup zonder reviews is een handmatige maatregel
 * waard en kost meer dan het oplevert.
 */
export function articleJsonLd(input: {
  titel: string;
  omschrijving: string;
  pad: string;
  gewijzigd?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.titel,
    description: input.omschrijving,
    mainEntityOfPage: `${SITE_URL}${input.pad}`,
    image: OG_IMAGE,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: LOGO_URL },
    },
    ...(input.gewijzigd ? { dateModified: input.gewijzigd } : {}),
  };
}
