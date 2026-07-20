import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "../landenvlaggen.module.css";
import { Container } from "@/components/ui";
import { getProduct } from "@/lib/catalog/products";
import {
  alleLanden,
  alleLandenMetSlug,
  slugsPerLandcode,
  vindLandOpSlug,
} from "@/lib/landen/landen";
import { SITE_NAME, SITE_URL, jsonLd } from "@/lib/seo";
import { BEDRIJF } from "@/lib/bedrijf";
import { LandenvlaggenShop } from "../LandenvlaggenShop";
import { Afwerking, TrustStrip } from "../Deelblokken";

/**
 * Per-land-landingspagina voor de landenvlaggen (/landenvlaggen/{slug}).
 *
 * Reden van bestaan = SEO: op de hub is de landkeuze client-state, dus per land
 * is er niets indexeerbaars. Deze route geeft elk van de 249 landen een eigen
 * URL, title, description, H1 en Product-JSON-LD. De inhoud is dezelfde shop als
 * de hub, maar met dit land al voorgeselecteerd — het is een echte bestelbare
 * productvariant, geen dunne doorway-pagina met verzonnen vultekst.
 */

/** Pre-render alle 249 landslugs. */
export function generateStaticParams() {
  return alleLandenMetSlug().map((l) => ({ land: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ land: string }>;
}): Promise<Metadata> {
  const { land: slug } = await params;
  const land = vindLandOpSlug(slug);
  if (!land) return { title: "Land niet gevonden" };

  const canonical = `/landenvlaggen/${land.slug}`;
  // Kort genoeg voor de SERP (ook bij lange landnamen); de formatenreeks
  // maakte hem 200+ tekens en Google kapte hem af.
  const description = `Bestel de vlag van ${land.naam} als mastvlag van biologisch afbreekbaar doek, in vijf formaten. Wij maken het drukbestand. Binnen 5 werkdagen op je mast.`;

  return {
    // Vast patroon dat voor álle 249 landen klopt: geen bijvoeglijke vormen
    // ("Duitse vlag") die je niet betrouwbaar kunt genereren. Kaal gehouden,
    // want de landnaam varieert van "Chili" tot "Verenigde Arabische Emiraten"
    // — met een payoff erachter kapte Google de merknaam eraf.
    title: `Vlag van ${land.naam} kopen`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `Vlag van ${land.naam} · ${SITE_NAME}`,
      description,
      url: canonical,
    },
  };
}

export default async function LandvlagPage({
  params,
}: {
  params: Promise<{ land: string }>;
}) {
  const { land: slug } = await params;
  const land = vindLandOpSlug(slug);
  if (!land) notFound();

  // Dezelfde server-side landenlijst en slug-map als de hub, zodat de shop
  // exact dezelfde HTML rendert (geen eigen Intl-aanroep op de client).
  const landen = alleLanden();
  const slugs = slugsPerLandcode();
  const mastvlag = getProduct("mastvlag");

  // Product-structured data: de vlag van dít land als eigen aanbieding, met
  // hetzelfde prijs-patroon als de hub (AggregateOffer vanaf de kleinste maat).
  const productJsonLd = jsonLd({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Vlag van ${land.naam}`,
    description: `Officiële vlag van ${land.naam}, gedrukt op biologisch afbreekbaar mastvlag-doek. Vijf formaten, drukbestand inbegrepen.`,
    category: "Vlag",
    image: `${SITE_URL}/flags/4x3/${land.code}.svg`,
    brand: { "@type": "Brand", name: SITE_NAME },
    url: `${SITE_URL}/landenvlaggen/${land.slug}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: mastvlag?.priceFrom ?? 23,
      offerCount: mastvlag?.sizes.length ?? 5,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: BEDRIJF.handelsnaam },
    },
  });

  // BreadcrumbList: Landenvlaggen → {naam}, zodat de SERP het pad toont in
  // plaats van een kale URL.
  const breadcrumbJsonLd = jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Landenvlaggen",
        item: `${SITE_URL}/landenvlaggen`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: land.naam,
        item: `${SITE_URL}/landenvlaggen/${land.slug}`,
      },
    ],
  });

  return (
    <Container as="section" className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: productJsonLd }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />

      <header className={styles.kop}>
        <h1 className={styles.titel}>
          Vlag van <span className={styles.titelAccent}>{land.naam}</span>
        </h1>
        <p className={styles.intro}>
          De vlag van {land.naam} als mastvlag van biologisch afbreekbaar doek.
          Kies je formaat, wij maken automatisch het drukbestand van de officiële
          vlag. Niets aanleveren, geen microplastics.
        </p>
        <TrustStrip />
      </header>

      <LandenvlaggenShop
        landen={landen}
        slugs={slugs}
        initieleLandCode={land.code}
      />

      <Afwerking />
    </Container>
  );
}
