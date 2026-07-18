import type { Metadata } from "next";
import styles from "./landenvlaggen.module.css";
import { Container, Check, Leaf, ShieldCheck, Truck } from "@/components/ui";
import { getProduct } from "@/lib/catalog/products";
import { SITE_NAME, SITE_URL, jsonLd } from "@/lib/seo";
import { BEDRIJF } from "@/lib/bedrijf";
import { LandenvlaggenShop } from "./LandenvlaggenShop";

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
        <ul className={styles.trustStrip}>
          <li>
            <Truck size={16} aria-hidden="true" />
            Binnen 5 werkdagen op je mast · buitenland 1,5 week
          </li>
          <li>
            <ShieldCheck size={16} aria-hidden="true" />
            Drukbestand maken wij
          </li>
          <li>
            <Leaf size={16} aria-hidden="true" />
            100% biologisch afbreekbaar doek
          </li>
          <li>
            <Check size={16} aria-hidden="true" />
            Gratis verzending vanaf &euro;&nbsp;100 incl. btw
          </li>
        </ul>
      </header>

      <LandenvlaggenShop />
    </Container>
  );
}
