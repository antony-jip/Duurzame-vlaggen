import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import styles from "./collectie.module.css";
import {
  Badge,
  Container,
  ArrowRight,
  Leaf,
  Recycle,
  Truck,
  FlagBanier,
  FlagMast,
  FlagBeach,
  FlagGevel,
  FlagPole,
} from "@/components/ui";
import { getAllProducts } from "@/lib/catalog/products";
import { getMessages } from "@/lib/i18n";
import { formatCurrency } from "@/lib/i18n/formatting";

export const metadata: Metadata = {
  title: "Collectie",
  description:
    "Bekijk onze biologisch afbreekbare vlaggen: baniervlaggen, mastvlaggen, beachvlaggen, gevelvlaggen en aluminium vlaggenmasten.",
};

/* Vlagtype-pictogrammen — merkeigen producticonen, zoals op de homepage. */
const FLAG_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  baniervlag: FlagBanier,
  mastvlag: FlagMast,
  beachvlag: FlagBeach,
  gevelvlag: FlagGevel,
  vlaggenmast: FlagPole,
};

const TRUST = [
  {
    icon: <Leaf size={24} />,
    title: "100% biologisch afbreekbaar",
    body: "Geweven van composteerbare vezels — geen microplastics, geen restafval.",
  },
  {
    icon: <Recycle size={24} />,
    title: "Circulair geproduceerd in NL",
    body: "Waterloos bedrukt op groene stroom in ons eigen atelier.",
  },
  {
    icon: <Truck size={24} />,
    title: "Binnen 5 werkdagen geleverd",
    body: "Inclusief kosteloze digitale drukproef en CSRD-materiaalpaspoort.",
  },
];

export default async function CollectiePage() {
  const { catalog, dict } = await getMessages();
  const products = getAllProducts();

  return (
    <Container as="section" className={styles.page} aria-labelledby="collectie-title">
      <div className={styles.head}>
        <Badge variant="success">{dict.nav.collection}</Badge>
        <h1 id="collectie-title">Kies je vlag.</h1>
        <p className="lead">
          Elke vlag is geprint op biologisch afbreekbaar doek en op maat gemaakt.
          Kies je model, stel het samen en reken direct online af.
        </p>
      </div>

      <div className={styles.grid}>
        {products.map((product) => {
          const FlagIcon = FLAG_ICONS[product.slug] ?? FlagMast;
          return (
            <Link
              key={product.slug}
              href={`/collectie/${product.slug}`}
              className={styles.cardLink}
            >
              <div className={styles.card} data-accent={product.accent}>
                <div className={styles.iconWrap}>
                  <FlagIcon size={132} aria-hidden="true" />
                  {product.badge && (
                    <Badge variant="outline" className={styles.tag}>
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
              </div>
            </Link>
          );
        })}
      </div>

      <div className={styles.trust}>
        {TRUST.map((item) => (
          <div key={item.title} className={styles.trustItem}>
            <span className={styles.trustIcon} aria-hidden="true">
              {item.icon}
            </span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
