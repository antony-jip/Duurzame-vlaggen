import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./collectie.module.css";
import { Badge, Card, Container, ArrowRight } from "@/components/ui";
import { getAllProducts, type CatalogProduct } from "@/lib/catalog/products";
import { getMessages } from "@/lib/i18n";
import { formatCurrency } from "@/lib/i18n/formatting";

export const metadata: Metadata = {
  title: "Collectie",
  description:
    "Bekijk onze biologisch afbreekbare vlaggen: baniervlaggen, mastvlaggen, beachvlaggen, gevelvlaggen en aluminium vlaggenmasten.",
};

/** Map a catalogue accent onto its gradient class. */
const accentClass: Record<CatalogProduct["accent"], string> = {
  forest: styles.accentForest,
  terracotta: styles.accentTerracotta,
  "sage-blue": styles.accentSageBlue,
  "sage-purple": styles.accentSagePurple,
  "copper-rust": styles.accentCopperRust,
};

export default async function CollectiePage() {
  const { catalog, dict } = await getMessages();
  const products = getAllProducts();

  return (
    <Container as="section" className={styles.page} aria-labelledby="collectie-title">
      <div className={styles.head}>
        <Badge variant="success">{dict.nav.collection}</Badge>
        <h1 id="collectie-title">Onze duurzame vlaggen</h1>
        <p className="lead">
          Elke vlag is geprint op biologisch afbreekbaar doek en op maat gemaakt.
          Kies je model, stel het samen en vraag direct een offerte aan.
        </p>
      </div>

      <div className={styles.grid}>
        {products.map((product) => (
          <Link
            key={product.slug}
            href={`/collectie/${product.slug}`}
            className={styles.cardLink}
          >
            <Card hover elevation="raised" className={styles.card}>
              <div className={`${styles.visual} ${accentClass[product.accent]}`}>
                <Image
                  src={product.heroImage.src}
                  alt={product.heroImage.alt}
                  fill
                  sizes="(max-width: 560px) 100vw, (max-width: 960px) 50vw, 33vw"
                  className={styles.photo}
                />
                {product.badge && (
                  <Badge variant="primary" className={styles.visualBadge}>
                    {product.badge}
                  </Badge>
                )}
              </div>
              <div className={styles.body}>
                <h2>{product.name}</h2>
                <p className={styles.tagline}>{product.tagline}</p>
                <div className={styles.priceRow}>
                  <span className={styles.priceFrom}>
                    {dict.product.priceFrom}
                  </span>
                  <span className={styles.price}>
                    {formatCurrency(product.priceFrom, catalog)}
                  </span>
                  <span className={styles.exVat}>{dict.product.exclVat}</span>
                </div>
                <span className={styles.cardCta}>
                  {dict.common.cta.configure}
                  <ArrowRight size={16} />
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
