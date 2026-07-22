import type { Metadata } from "next";
import Link from "next/link";
import styles from "../../info.module.css";
import { getProduct } from "@/lib/catalog/products";
import {
  Badge,
  Button,
  Container,
  ArrowRight,
  ShieldCheck,
  FlagBanier,
  FlagBeach,
  FlagGevel,
  FlagMast,
} from "@/components/ui";
import {
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, jsonLd } from "@/lib/seo";

/** Nederlandse schrijfwijze van een percentage: 94.2 wordt 94,2. */

const HOOFD_PCT = pctNl(HOOFDTEST.afbraakPct);
const HOOFD_OMGEVING = HOOFDTEST.omgeving.toLowerCase();

const PAD = "/kennisbank/vlaggen-kiezen";
const TITEL = "Duurzame vlag kiezen: maten en masthoogtes";
const OMSCHRIJVING =
  "Welk vlagtype en formaat past bij jouw situatie? Keuzegids met standaardmaten voor mast- en baniervlaggen per masthoogte, op biologisch afbreekbaar doek.";

export const metadata: Metadata = {
  alternates: { canonical: PAD },
  title: TITEL,
  description: OMSCHRIJVING,
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Vlagtypes met hun ideale toepassing.
const TYPES = [
  {
    icon: <FlagMast size={24} />,
    kicker: "2 tot 10 m masten",
    title: "Mastvlag",
    body: "De klassieke keuze voor vlaggenmasten bij je pand of entree. Vijf standaardmaten, van 150 × 100 cm bij een mast van 2 tot 3 meter tot 350 × 225 cm bij 10 meter.",
    href: "/collectie/mastvlag",
  },
  {
    icon: <FlagBanier size={24} />,
    kicker: "5 tot 11 m baniermasten",
    title: "Baniervlag",
    body: "Verticaal en representatief, ideaal bij entrees. Elf standaardmaten, van 100 × 250 cm bij een mast van 5 meter tot 150 × 600 cm bij 11 meter.",
    href: "/collectie/baniervlag",
  },
  {
    icon: <FlagGevel size={24} />,
    kicker: "Aan het pand",
    title: "Gevelvlag",
    body: "Voor aan de gevel van je gebouw, aan een schuine uithouder. Opvallend op straatniveau.",
    href: "/collectie/gevelvlag",
  },
  {
    icon: <FlagBeach size={24} />,
    kicker: "Events & acties",
    title: "Beachvlag",
    body: "Flexibel en snel te plaatsen bij evenementen, beurzen en tijdelijke acties. Geen mast nodig.",
    href: "/collectie/beachvlag",
  },
];

/**
 * Maten uit de catalogus, niet overgetikt.
 *
 * Deze twee lijsten stonden hier hardcoded en waren uit de pas gaan lopen: er
 * stonden baniermaten (80×300, 120×500) die niet te bestellen zijn, en de
 * mastvlagmaten stonden in de oude hoogte × breedte-volgorde. Een keuzegids die
 * maten noemt die de configurator niet kent, levert een verkeerde bestelling op.
 * Daarom nu afgeleid van `lib/catalog/products.ts`, de bron die ook de
 * configurator vult.
 */
function matenVan(slug: string): Array<{ size: string; mast: string }> {
  const product = getProduct(slug);
  if (!product) return [];
  return product.sizes
    .filter((maat) => maat.mastAdvies)
    .map((maat) => ({ size: maat.label, mast: maat.mastAdvies as string }));
}

const BANIER_SIZES = matenVan("baniervlag");
const MAST_SIZES = matenVan("mastvlag");

const FAQ = [
  {
    q: "Welke baniervlag-formaten zijn er?",
    a: "Er zijn elf standaardformaten, altijd breedte × hoogte. Ze lopen van 100 × 250 cm bij een mast van 5 meter tot 150 × 600 cm bij 11 meter. Het meest gekozen is 100 × 300 cm, passend bij een mast van 6 meter.",
  },
  {
    q: "Welke maat past bij een 6 meter baniermast?",
    a: "Bij een 6 meter baniermast past een baniervlag van 100 × 300 cm het beste; dat is ook onze meest gekozen maat. Wil je 'm wat breder, dan is 120 × 300 cm bij dezelfde masthoogte een optie.",
  },
  {
    q: "Hoelang gaat zo'n vlag mee?",
    a: `Bij normaal buitengebruik zo'n 3 tot 4 maanden; de kleuren blijven tot 2 jaar UV-bestendig. Daarna telt wat er met het doek gebeurt: onze vlaggen zijn biologisch afbreekbaar. In ${HOOFD_OMGEVING} brak ${HOOFD_PCT}% van het doek af in ${HOOFDTEST.duur}, gemeten volgens ${HOOFDTEST.norm}.`,
  },
  {
    q: "Kan ik ook een afwijkend formaat bestellen?",
    a: "Zeker. Heb je een custom maat nodig? Neem contact op met je specifieke afmetingen en we maken graag een offerte op maat.",
  },
  {
    q: "Ik twijfel nog over het formaat...",
    a: "Geen probleem. Stuur ons een foto van je mast (liefst met iets voor de schaal erbij) en we geven je vrijblijvend advies over het juiste formaat.",
  },
];

/** Het directe antwoord bovenaan; zie het gelijknamige blok in microplastics. */
const KORT_ANTWOORD = [
  "Kies eerst het vlagtype op basis van waar de vlag komt: een mastvlag voor een staande mast, een baniervlag voor een baniermast, een gevelvlag aan een uithouder tegen de muur en een beachvlag voor evenementen.",
  "Het formaat volgt uit de masthoogte, en maten staan altijd als breedte × hoogte. Een baniervlag loopt van 100 × 250 cm bij een mast van 5 meter tot 150 × 600 cm bij 11 meter; een mastvlag van 150 × 100 cm bij 2 tot 3 meter tot 350 × 225 cm bij 10 meter. Een vlag gaat bij normaal buitengebruik 3 tot 4 maanden mee en de kleuren blijven tot 2 jaar UV-bestendig.",
];

// Gestructureerde data: artikel, kruimelpad en de FAQ. De vragen komen uit
// dezelfde `FAQ`-array als het zichtbare blok hieronder, zodat er nooit een
// antwoord in de structured data staat dat niet op de pagina staat. Bewust geen
// aggregateRating of review: die zijn er niet.
const ARTICLE_JSON_LD = jsonLd(
  articleJsonLd({ titel: TITEL, omschrijving: OMSCHRIJVING, pad: PAD }),
);

const BREADCRUMB_JSON_LD = jsonLd(
  breadcrumbJsonLd([
    { naam: "Home", pad: "/" },
    { naam: "Kennisbank", pad: "/kennisbank" },
    { naam: "De juiste vlag kiezen", pad: PAD },
  ]),
);

const FAQ_JSON_LD = jsonLd(faqJsonLd(FAQ));

export default function VlaggenKiezenPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ARTICLE_JSON_LD }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: BREADCRUMB_JSON_LD }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: FAQ_JSON_LD }}
      />
      {/* HERO */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Link href="/kennisbank" className={styles.crumb}>
              Kennisbank · Keuzegids
            </Link>
            <h1 id="hero-title" className={styles.heroTitle}>
              Welke vlag past <span className={styles.heroAccent}>bij jou</span>
              ?
            </h1>
            <p className={styles.heroSub}>
              Van vlagtype tot formaat: met deze gids kies je in een paar
              minuten de juiste vlag voor jouw mast, gevel of evenement. Kom je
              er niet uit? We adviseren gratis.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="/collectie"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Bekijk de collectie
              </Button>
              <Link href="/contact" className={styles.heroLink}>
                Advies nodig? Vraag het ons
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>4</span>
              <span className={styles.heroStatLabel}>Vlagtypes</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>3 tot 12 m</span>
              <span className={styles.heroStatLabel}>Masthoogtes</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>~3 dagen</span>
              <span className={styles.heroStatLabel}>Levertijd</span>
            </div>
          </div>
        </Container>
        <svg
          className={styles.heroWave}
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={WAVE_PATH} fill="currentColor" />
        </svg>
      </section>

      {/* KORT ANTWOORD — direct onder de hero, vóór de verdieping. */}
      <section className={styles.sectionTight} aria-labelledby="kort-antwoord">
        <Container>
          <div className={styles.kortAntwoord}>
            <span id="kort-antwoord" className={styles.kortAntwoordLabel}>
              Kort antwoord
            </span>
            {KORT_ANTWOORD.map((alinea) => (
              <p key={alinea.slice(0, 40)}>{alinea}</p>
            ))}
          </div>
        </Container>
      </section>

      {/* VLAGTYPES */}
      <section className={styles.section} aria-labelledby="types-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Stap 1</Badge>
            <h2 id="types-title">Kies je vlagtype.</h2>
            <p className="lead">
              Elk type heeft zijn eigen kracht. Waar komt jouw vlag te hangen?
            </p>
          </div>
          <div className={`${styles.cardGrid} ${styles.cardGrid4}`}>
            {TYPES.map((type) => (
              <div key={type.title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {type.icon}
                </span>
                <span className={styles.cardKicker}>{type.kicker}</span>
                <h3>{type.title}</h3>
                <p>{type.body}</p>
                <Link href={type.href} className={styles.cardLink}>
                  Bekijk en stel samen <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FORMATEN PER MASTHOOGTE */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="sizes-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Stap 2</Badge>
            <h2 id="sizes-title">Welk formaat bij welke mast?</h2>
            <p className="lead">
              In één oogopslag zie je welke vlagformaten passen bij de gangbare
              masthoogtes. Vuistregel: hoe hoger de mast, hoe groter de vlag.
            </p>
          </div>
          <div className={styles.cardGrid2}>
            <div className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                <FlagMast size={24} />
              </span>
              <span className={styles.cardKicker}>6 tot 12 m masten</span>
              <h3>Mastvlag-formaten</h3>
              <ul className={styles.cardList}>
                {MAST_SIZES.map((row) => (
                  <li key={row.size}>
                    <strong>{row.size}</strong> · {row.mast}
                  </li>
                ))}
              </ul>
              <Link href="/collectie/mastvlag" className={styles.cardLink}>
                Mastvlag samenstellen <ArrowRight size={16} />
              </Link>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                <FlagBanier size={24} />
              </span>
              <span className={styles.cardKicker}>3 tot 8 m masten</span>
              <h3>Baniervlag-formaten</h3>
              <ul className={styles.cardList}>
                {BANIER_SIZES.map((row) => (
                  <li key={row.size}>
                    <strong>{row.size}</strong> · {row.mast}
                  </li>
                ))}
              </ul>
              <Link href="/collectie/baniervlag" className={styles.cardLink}>
                Baniervlag samenstellen <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3>Ook een mast nodig?</h3>
              <p>
                We leveren ook vlaggenmasten, met 5 tot 15 jaar breukgarantie
                afhankelijk van het type.{" "}
                <Link href="/collectie/vlaggenmast">Bekijk vlaggenmasten</Link>{" "}
                of vraag advies over de juiste combinatie.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className={styles.section} aria-labelledby="faq-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Veelgestelde vragen</Badge>
            <h2 id="faq-title">Nog vragen? We helpen je graag.</h2>
          </div>
          <div className={styles.faqGroup}>
            {FAQ.map((item) => (
              <details key={item.q} className={styles.faq}>
                <summary>{item.q}</summary>
                <div className={styles.faqBody}>
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3>Waar het doek van gemaakt is</h3>
              <p>
                Elk formaat drukken we op Flag-CiCLO®-doek. In {HOOFD_OMGEVING}{" "}
                brak {HOOFD_PCT}% van dat doek af in {HOOFDTEST.duur} (
                {HOOFDTEST.norm}). Onbehandeld polyester kwam in dezelfde test
                niet verder dan {pctNl(HOOFDTEST.referentiePct ?? 0)}%.
              </p>
              <Link href={ONDERBOUWING_PAD} className={styles.arrowLink}>
                {ONDERBOUWING_LINK_TEKST} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Je weet nu welk formaat bij je past.
              </h2>
              <p className={styles.ctaSub}>
                Gevonden wat je zocht? We leveren binnen circa 3 dagen. Twijfel
                je nog? Neem gerust contact op. We denken graag met je mee.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/collectie"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Stel je vlag samen
                </Button>
                <Link href="/contact" className={styles.ctaLink}>
                  Vraag gratis advies
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
