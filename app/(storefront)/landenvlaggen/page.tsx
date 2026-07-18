import type { Metadata } from "next";
import styles from "./landenvlaggen.module.css";
import { Container } from "@/components/ui";
import { getProduct } from "@/lib/catalog/products";
import { alleLanden, slugsPerLandcode } from "@/lib/landen/landen";
import { SITE_NAME, SITE_URL, jsonLd } from "@/lib/seo";
import { BEDRIJF } from "@/lib/bedrijf";
import { LandenvlaggenShop } from "./LandenvlaggenShop";
import { Afwerking, TrustStrip } from "./Deelblokken";

/**
 * Landenvlaggen — één goed vindbare bestelpagina voor alle landvlaggen.
 *
 * De klant kiest een land, een mastvlag-formaat en een aantal; het drukklare
 * bestand wordt automatisch gegenereerd en geüpload (zie LandenvlaggenShop),
 * dus er hoeft niets aangeleverd te worden.
 */

export const metadata: Metadata = {
  alternates: { canonical: "/landenvlaggen" },
  title: "Landenvlag kopen. Biologisch afbreekbaar.",
  description:
    "Bestel de vlag van elk land als mastvlag van biologisch afbreekbaar doek. Kies je land en formaat, wij maken het drukbestand. Zonder microplastics, binnen 5 werkdagen.",
};

export default function LandenvlaggenPage() {
  const mastvlag = getProduct("mastvlag");

  // De landenlijst (Nederlandse namen + NL-sortering) komt uit Intl.DisplayNames.
  // Dat gebeurt bewust hier, server-side: de ICU-tabellen van Node en de browser
  // verschillen per versie, dus als de client-component deze lijst zelf zou
  // opbouwen kregen sommige landnamen een andere tekst dan de SSR-HTML en
  // klapte de hydration om. Nu rendert client exact wat de server stuurde.
  const landen = alleLanden();
  // Landcode → unieke slug, zodat de tegels echte links naar de landpagina's zijn.
  const slugs = slugsPerLandcode();

  // Product-structured data: de landenvlag als eigen aanbieding, geprijsd
  // vanaf de kleinste mastvlag-maat.
  const productJsonLd = jsonLd({
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Landenvlag",
    description:
      "Officiële landvlag, gedrukt op biologisch afbreekbaar mastvlag-doek. Alle landen, vijf formaten, drukbestand inbegrepen.",
    category: "Vlag",
    brand: { "@type": "Brand", name: SITE_NAME },
    url: `${SITE_URL}/landenvlaggen`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: mastvlag?.priceFrom ?? 23,
      offerCount: mastvlag?.sizes.length ?? 5,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: BEDRIJF.handelsnaam },
    },
  });

  return (
    <Container as="section" className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: productJsonLd }}
      />

      {/* Kop als één compact blok: titel, intro en de zekerheden (levertijd
          voorop) vlak boven de shop. De USP-rij die hier eerst onderaan de
          pagina stond is hierin opgegaan; niets staat dubbel. */}
      <header className={styles.kop}>
        <h1 className={styles.titel}>
          De vlag van <span className={styles.titelAccent}>elk land</span>
        </h1>
        <p className={styles.intro}>
          Kies je land en formaat, wij regelen de rest. Het drukbestand maken we
          automatisch van de officiële vlag, gedrukt op biologisch afbreekbaar
          mastvlag-doek. Niets aanleveren, geen microplastics.
        </p>
        <TrustStrip />
      </header>

      <LandenvlaggenShop landen={landen} slugs={slugs} />

      {/* Afwerking: compact infoblok onder de shop. Inhoud komt 1-op-1 uit de
          mastvlag-catalogus en de configurator-hints; wie iets anders wil dan
          de standaard (haken, wit) kan door naar de mastvlag-configurator. */}
      <Afwerking />
    </Container>
  );
}
