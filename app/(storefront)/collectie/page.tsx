import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./collectie.module.css";
import {
  Badge,
  Container,
  ArrowRight,
  Leaf,
  Recycle,
  Truck,
  Price,
} from "@/components/ui";
import { getAllProducts } from "@/lib/catalog/products";
import { getMessages } from "@/lib/i18n";

export const metadata: Metadata = {
  alternates: { canonical: "/collectie" },
  // Zoekterm + belofte in de SERP: "Collectie" zegt Google en de zoeker niets.
  title: "Vlaggen bedrukken. 0% microplastic.",
  description:
    "Bekijk onze biologisch afbreekbare vlaggen: baniervlag, mastvlag, beachvlag, gevelvlag en aluminium vlaggenmast. CSRD-proof, zonder microplastics, geleverd in 5 werkdagen.",
};

const TRUST = [
  {
    icon: <Leaf size={24} />,
    title: "100% biologisch afbreekbaar",
    body: "Geweven van biologisch afbreekbare vezels. Geen microplastics. Geen restafval.",
  },
  {
    icon: <Recycle size={24} />,
    title: "Circulair geproduceerd in NL",
    body: "Bedrukt met inkt op waterbasis, op groene stroom in ons eigen atelier.",
  },
  {
    icon: <Truck size={24} />,
    title: "Binnen 5 werkdagen geleverd",
    body: "Inclusief kosteloze digitale drukproef en CSRD-materiaalpaspoort.",
  },
];

export default async function CollectiePage() {
  const { dict } = await getMessages();
  const products = getAllProducts();

  return (
    <Container as="section" className={styles.page} aria-labelledby="collectie-title">
      <div className={styles.head}>
        <Badge variant="success">{dict.nav.collection}</Badge>
        <h1 id="collectie-title">Kies je vlag.</h1>
        <p className="lead">
          Elke gewone vlag wappert zichzelf kapot tot microplastic. De onze niet.
          Geprint op biologisch afbreekbaar doek, op maat gemaakt. Kies je model,
          stel het samen en reken direct online af.
        </p>
      </div>

      <div className={styles.grid}>
        {products.map((product) => {
          return (
            <Link
              key={product.slug}
              href={`/collectie/${product.slug}`}
              className={styles.cardLink}
            >
              <div className={styles.card} data-accent={product.accent}>
                <div className={styles.mediaWrap}>
                  <Image
                    src={product.heroImage.src}
                    alt={product.heroImage.alt}
                    fill
                    sizes="(max-width: 560px) 100vw, (max-width: 960px) 50vw, 33vw"
                    className={styles.media}
                  />
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
                    <Price
                      amount={product.priceFrom}
                      className={styles.price}
                      suffix
                      suffixClassName={styles.exVat}
                    />
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
