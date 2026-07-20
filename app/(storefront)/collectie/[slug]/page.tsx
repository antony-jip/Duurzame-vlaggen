import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./product.module.css";
import {
  Badge,
  Container,
  Leaf,
  Recycle,
  ShieldCheck,
  Truck,
  Price,
} from "@/components/ui";
import {
  getAllProducts,
  getProduct,
  isOrderable,
  type CatalogProduct,
} from "@/lib/catalog/products";
import { getMessages } from "@/lib/i18n";
import { SHIPPING_FLAT } from "@/lib/pricing/local-catalog";
import { SITE_URL, SITE_NAME, jsonLd } from "@/lib/seo";
import {
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";
import { BEDRIJF } from "@/lib/bedrijf";
import { ProcesStappen } from "@/components/ui";
import { ProductConfigurator } from "./ProductConfigurator";
import { ProductGallery } from "./ProductGallery";
import { VlaggenmastConfigurator } from "./VlaggenmastConfigurator";

/** Pre-render every known product slug. */
export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

const accentClass: Record<CatalogProduct["accent"], string> = {
  forest: styles.accentForest,
  terracotta: styles.accentTerracotta,
  "sage-blue": styles.accentSageBlue,
  "sage-purple": styles.accentSagePurple,
  "copper-rust": styles.accentCopperRust,
};

/**
 * SERP-titles in de merkstem: zoekterm + belofte, in plaats van een kale
 * productnaam die identiek is aan elke concurrent. De template van de root-
 * layout hangt er " | Duurzame Vlaggen" achter.
 */
const SEO_TITLES: Record<string, string> = {
  baniervlag: "Baniervlag bedrukken op afbreekbaar doek",
  mastvlag: "Mastvlag bedrukken. Breekt af, valt op.",
  beachvlag: "Beachvlag met je logo, afbreekbaar doek",
  gevelvlag: "Gevelvlag bedrukken. Aan de straat.",
  vlaggenmast: "Vlaggenmast kopen. Aluminium Easylift.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product niet gevonden" };
  const canonical = `/collectie/${product.slug}`;
  // Beschrijving = productintro (150-160 tekens rijk aan kernwoorden) i.p.v. de
  // korte tagline, zodat de snippet de vlag echt verkoopt.
  const description = product.description.slice(0, 158);
  return {
    title: SEO_TITLES[product.slug] ?? product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${product.name} · ${SITE_NAME}`,
      description,
      url: canonical,
      images: [
        {
          url: product.heroImage.src,
          alt: product.heroImage.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} · ${SITE_NAME}`,
      description,
      images: [product.heroImage.src],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const { catalog, dict } = await getMessages();
  const orderable = isOrderable(product);

  // Product-structured data: naam, beschrijving, beeld, merk en een
  // AggregateOffer met de vanaf-prijs (ex btw) in EUR. Bestelbare vlaggen zijn
  // InStock; offerte-only producten staan als PreOrder gemarkeerd.
  const productJsonLd = jsonLd({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [product.heroImage.src, ...product.gallery.map((g) => g.src)],
    category: product.category === "hardware" ? "Vlaggenmast" : "Vlag",
    brand: { "@type": "Brand", name: SITE_NAME },
    manufacturer: { "@type": "Organization", name: BEDRIJF.handelsnaam },
    url: `${SITE_URL}/collectie/${product.slug}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: product.priceFrom,
      offerCount: product.sizes.length,
      availability: orderable
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
      seller: { "@type": "Organization", name: BEDRIJF.handelsnaam },
    },
  });

  // BreadcrumbList naast de zichtbare kruimel: zoekmachines tonen dan het pad
  // (Collectie › Product) in plaats van een kale URL in de snippet.
  const breadcrumbJsonLd = jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: dict.nav.collection,
        item: `${SITE_URL}/collectie`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.name,
        item: `${SITE_URL}/collectie/${product.slug}`,
      },
    ],
  });

  // Galerij = de eigen productbeelden. (Het generieke band-en-ringen-detail is
  // eruit: dat stond op elke vlagpagina en voegde niets toe.)
  const gallery = product.gallery;

  return (
    <>
    <Container as="section" className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: productJsonLd }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />
      <nav className={styles.breadcrumb} aria-label="Kruimelpad">
        <Link href="/collectie">{dict.nav.collection}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className={styles.layout}>
        {/* Media — hero + thumbnails met lightbox */}
        <div className={styles.media}>
          <ProductGallery
            heroImage={product.heroImage}
            thumbs={gallery}
            slug={product.slug}
            accent={product.accent}
            accentClass={accentClass[product.accent]}
          />
          {product.category === "hardware" ? (
            <ul className={styles.trustRow}>
              <li>
                <ShieldCheck size={16} aria-hidden="true" />
                10+ jaar garantie
              </li>
              <li>
                <Recycle size={16} aria-hidden="true" />
                Inclusief montagebeugels
              </li>
              <li>
                <Truck size={16} aria-hidden="true" />
                Geleverd door heel Nederland
              </li>
            </ul>
          ) : (
            <ul className={styles.trustRow}>
              <li>
                <Leaf size={16} aria-hidden="true" />
                Breekt volledig af
              </li>
              <li>
                <Recycle size={16} aria-hidden="true" />
                Gedrukt in Nederland
              </li>
              <li>
                <Truck size={16} aria-hidden="true" />
                Binnen 5 werkdagen op je mast
              </li>
            </ul>
          )}
        </div>

        {/* Info + configurator */}
        <div className={styles.info}>
          <div className={styles.eyebrowRow}>
            {product.badge && <Badge variant="primary">{product.badge}</Badge>}
            {product.badge !==
              (product.category === "hardware" ? "Hardware" : "Vlag") && (
              <Badge variant="outline">
                {product.category === "hardware" ? "Hardware" : "Vlag"}
              </Badge>
            )}
          </div>

          <h1 className={styles.title}>{product.name}</h1>
          <p className={`lead ${styles.description}`}>{product.description}</p>

          <dl className={styles.specs}>
            <div className={styles.specRow}>
              <dt>{dict.product.priceFrom}</dt>
              <dd>
                <Price amount={product.priceFrom} suffix />
              </dd>
            </div>
            <div className={styles.specRow}>
              <dt>{dict.product.deliveryTime}</dt>
              <dd>5 werkdagen (buitenland: 1,5 week)</dd>
            </div>
            <div className={styles.specRow}>
              <dt>{dict.product.material}</dt>
              <dd>
                {product.category === "hardware" ? (
                  "Hoogwaardig aluminium (Easylift)"
                ) : (
                  <>
                    Biologisch afbreekbaar doek. In{" "}
                    {HOOFDTEST.omgeving.toLowerCase()} brak{" "}
                    {pctNl(HOOFDTEST.afbraakPct)}% af in {HOOFDTEST.duur} (
                    {HOOFDTEST.norm}).{" "}
                    <Link href={ONDERBOUWING_PAD}>
                      {ONDERBOUWING_LINK_TEKST}
                    </Link>
                  </>
                )}
              </dd>
            </div>
            {/* Verzendkosten hoorden pas in de winkelmand op te duiken; de
                drempel is een verkoopargument, dus hij staat bij de prijs.
                Hardware heeft eigen levering (in de mast-configurator). */}
            {product.category !== "hardware" && (
              <div className={styles.specRow}>
                <dt>Verzending</dt>
                <dd>
                  <Price amount={SHIPPING_FLAT} suffix />
                  {" · gratis vanaf "}
                  &euro;&nbsp;100 incl. btw
                </dd>
              </div>
            )}
          </dl>

          {/* Landvlaggen hebben een eigen bestelpagina met kant-en-klaar
              drukbestand — wie hier landt voor de vlag van een land hoeft de
              configurator niet in. */}
          {product.slug === "mastvlag" && (
            <p className={styles.landenTip}>
              <strong>Landvlag nodig?</strong> Bekijk onze{" "}
              <Link href="/landenvlaggen">landenvlaggen</Link>: kies je land, wij
              maken het drukbestand. Je hoeft niets aan te leveren.
            </p>
          )}

          {product.category === "hardware" ? (
            <VlaggenmastConfigurator product={product} catalog={catalog} />
          ) : (
          <ProductConfigurator
            product={product}
            orderable={orderable}
            catalog={catalog}
            labels={{
              size: dict.product.dimensions,
              quantity: dict.product.quantity,
              priceLabel: dict.product.price,
              priceNote: orderable
                ? "indicatie"
                : "indicatie — definitieve prijs in de offerte",
              priceLoading: "Prijs berekenen…",
              exclVat: dict.product.exclVat,
              addToCart: dict.common.cta.addToCart,
              requestQuote: dict.common.cta.requestQuote,
              added: "Toegevoegd aan winkelmand",
              viewCart: dict.nav.cart,
              noticeQuoteOnly:
                "Online bestellen kan binnenkort. Voeg toe aan je winkelmand en vraag nu vrijblijvend een offerte aan.",
            }}
          />
          )}
        </div>
      </div>
      {/* Verdieping (werking, materiaal, garantie) — alleen voor producten met
          details in de catalogus, zoals de Easylift-vlaggenmast. */}
      {product.details && product.details.length > 0 && (
        <section className={styles.details} aria-labelledby="details-title">
          <h2 id="details-title" className={styles.detailsTitle}>
            Goed om te weten
          </h2>
          <dl className={styles.detailsGrid}>
            {product.details.map((d) => (
              <div key={d.title} className={styles.detailsItem}>
                <dt>{d.title}</dt>
                <dd>{d.body}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </Container>

    {/* Vertrouwensblok — zelfde flow op elke productpagina, volle breedte.
        Producten met een maten-overzicht tonen dat als fotoband boven de
        footer; de rest houdt de waterstrook. */}
    <ProcesStappen bandImage={product.sizesImage} />
    </>
  );
}
