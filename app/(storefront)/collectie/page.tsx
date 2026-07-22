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
import {
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";

/** Percentage in Nederlandse notatie (94.2 → "94,2"). */

export const metadata: Metadata = {
  alternates: { canonical: "/collectie" },
  // Zoekterm + belofte in de SERP: "Collectie" zegt Google en de zoeker niets.
  title: "Vlaggen bedrukken op afbreekbaar doek",
  description:
    "Duurzame vlaggen bedrukken op biologisch afbreekbaar doek: baniervlag, mastvlag, beachvlag, gevelvlag en aluminium vlaggenmast. Met materiaalpaspoort, geleverd in 5 werkdagen.",
};

const TRUST = [
  {
    icon: <Leaf size={24} />,
    title: "Biologisch afbreekbaar doek",
    body: `In zeewater brak ${pctNl(HOOFDTEST.afbraakPct)}% van het doek af in ${HOOFDTEST.duur} (${HOOFDTEST.norm}). Onbehandeld polyester kwam in dezelfde test op 3,8%.`,
  },
  {
    icon: <Recycle size={24} />,
    title: "Laat minder microplastic achter",
    body: "Vezels die tijdens gebruik loslaten breken af in plaats van te blijven liggen.",
  },
  {
    icon: <Truck size={24} />,
    title: "Binnen 5 werkdagen geleverd",
    body: "Inclusief kosteloze digitale drukproef en het materiaalpaspoort bij je bestelling.",
  },
];

export default async function CollectiePage() {
  const { dict } = await getMessages();
  const products = getAllProducts();

  return (
    <Container
      as="section"
      className={styles.page}
      aria-labelledby="collectie-title"
    >
      <div className={styles.head}>
        <Badge variant="success">{dict.nav.collection}</Badge>
        <h1 id="collectie-title">Kies je vlag.</h1>
        <p className="lead">
          Elke vlag laat vezels los in wind en regen. Bij ons breken die vezels
          af in plaats van te blijven liggen. Geprint op biologisch afbreekbaar
          doek, op maat gemaakt. Kies je model, stel het samen en reken direct
          online af.
        </p>
        <p className="lead">
          <Link href={ONDERBOUWING_PAD}>{ONDERBOUWING_LINK_TEKST}</Link>
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

      {/* Interne links met de doelgroeptermen als ankertekst. Deze pagina had
          geen enkele link naar de doelgroep- en materiaalpagina's; wie hier
          landt met een specifieke behoefte moet in één klik verder kunnen. */}
      <p className={`text-sm ${styles.doelgroepLinks}`}>
        Meer weten over ons{" "}
        <Link href="/materiaal">afbreekbaar polyester</Link>? Of vlaggen voor
        een specifieke doelgroep? Bekijk onze{" "}
        <Link href="/voor-bedrijven">bedrijfsvlaggen</Link>,{" "}
        <Link href="/voor-gemeenten">vlaggen voor gemeenten</Link> of{" "}
        <Link href="/voor-verenigingen">vlaggen voor je vereniging</Link>.
      </p>
    </Container>
  );
}
