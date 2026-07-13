import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import styles from "./product.module.css";
import {
  Badge,
  Container,
  Leaf,
  Recycle,
  Truck,
  FlagBanier,
  FlagMast,
  FlagBeach,
  FlagGevel,
  FlagPole,
} from "@/components/ui";
import {
  BRAND_IMAGES,
  getAllProducts,
  getProduct,
  isOrderable,
  type CatalogProduct,
} from "@/lib/catalog/products";
import { getMessages } from "@/lib/i18n";
import { formatCurrency } from "@/lib/i18n/formatting";
import { ProductConfigurator } from "./ProductConfigurator";

/* Vlagtype-pictogrammen — merkeigen producticonen, zoals op de homepage. */
const FLAG_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  baniervlag: FlagBanier,
  mastvlag: FlagMast,
  beachvlag: FlagBeach,
  gevelvlag: FlagGevel,
  vlaggenmast: FlagPole,
};

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product niet gevonden" };
  return {
    title: product.name,
    description: product.tagline,
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
  const FlagIcon = FLAG_ICONS[product.slug] ?? FlagMast;

  // Vlaggen krijgen het afwerkingsdetail (band + kunststof ringen) als extra
  // galleriebeeld — een scherpe, tastbare craft-shot i.p.v. het wazige
  // weefsel-beeld. Hardware toont alleen zijn eigen beelden.
  const gallery =
    product.category === "vlag"
      ? [...product.gallery, BRAND_IMAGES.finishing].slice(0, 3)
      : product.gallery;

  return (
    <Container as="section" className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Kruimelpad">
        <Link href="/collectie">{dict.nav.collection}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className={styles.layout}>
        {/* Media */}
        <div className={styles.media}>
          <div className={`${styles.visual} ${accentClass[product.accent]}`}>
            <span
              className={styles.accentChip}
              data-accent={product.accent}
              aria-hidden="true"
            >
              <FlagIcon size={30} />
            </span>
            <Image
              src={product.heroImage.src}
              alt={product.heroImage.alt}
              fill
              priority
              sizes="(max-width: 860px) 100vw, 50vw"
              className={styles.photo}
            />
          </div>
          {gallery.length > 0 && (
            <div className={styles.thumbs}>
              {gallery.map((image) => (
                <div key={image.src} className={styles.thumb}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 860px) 33vw, 16vw"
                    className={styles.photo}
                  />
                </div>
              ))}
            </div>
          )}
          <ul className={styles.trustRow}>
            <li>
              <Leaf size={16} aria-hidden="true" />
              Biologisch afbreekbaar
            </li>
            <li>
              <Recycle size={16} aria-hidden="true" />
              Geproduceerd in NL
            </li>
            <li>
              <Truck size={16} aria-hidden="true" />
              Binnen 5 werkdagen geleverd
            </li>
          </ul>
        </div>

        {/* Info + configurator */}
        <div className={styles.info}>
          <div className={styles.eyebrowRow}>
            {product.badge && <Badge variant="primary">{product.badge}</Badge>}
            <Badge variant="outline">
              {product.category === "hardware" ? "Hardware" : "Vlag"}
            </Badge>
          </div>

          <h1 className={styles.title}>{product.name}</h1>
          <p className={`lead ${styles.description}`}>{product.description}</p>

          <dl className={styles.specs}>
            <div className={styles.specRow}>
              <dt>{dict.product.priceFrom}</dt>
              <dd>
                {formatCurrency(product.priceFrom, catalog)} {dict.product.exclVat}
              </dd>
            </div>
            <div className={styles.specRow}>
              <dt>{dict.product.deliveryTime}</dt>
              <dd>5 werkdagen (buitenland: 1,5 week)</dd>
            </div>
            <div className={styles.specRow}>
              <dt>{dict.product.material}</dt>
              <dd>Biologisch afbreekbaar doek</dd>
            </div>
          </dl>

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
        </div>
      </div>
    </Container>
  );
}
