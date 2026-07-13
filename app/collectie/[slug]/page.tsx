import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./product.module.css";
import { Badge, Container } from "@/components/ui";
import {
  getAllProducts,
  getProduct,
  isOrderable,
  type CatalogProduct,
} from "@/lib/catalog/products";
import { getMessages } from "@/lib/i18n";
import { formatCurrency } from "@/lib/i18n/formatting";
import { ProductConfigurator } from "./ProductConfigurator";

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
          <div
            className={`${styles.visual} ${accentClass[product.accent]}`}
            aria-hidden="true"
          />
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
              <dd>2–4 weken</dd>
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
              priceNote: "indicatie — definitieve prijs in de offerte",
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
