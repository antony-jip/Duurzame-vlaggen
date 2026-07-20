import type { Metadata } from "next";
import Link from "next/link";
import styles from "../info.module.css";
import {
  Badge,
  Button,
  Container,
  ArrowRight,
  Check,
  Leaf,
  Recycle,
  ShieldCheck,
  FlagMast,
} from "@/components/ui";
import {
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";

/** Nederlandse schrijfwijze van een percentage: 94.2 wordt 94,2. */

const HOOFD_PCT = pctNl(HOOFDTEST.afbraakPct);
const HOOFD_OMGEVING = HOOFDTEST.omgeving.toLowerCase();

export const metadata: Metadata = {
  alternates: { canonical: "/kennisbank" },
  title: "Kennisbank over duurzame vlaggen",
  description:
    "Van Flag-CiCLO®-technologie en de CSRD tot microplastics en de juiste vlag kiezen: verdiep je in duurzame, biologisch afbreekbare vlaggen met onze kennisbankartikelen.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// De kennisbank-artikelen.
const ARTICLES = [
  {
    icon: <Recycle size={24} />,
    kicker: "Technologie",
    title: "Flag-CiCLO® technologie",
    body: "Hoe kan een vlag gewoon... verdwijnen? Geen magie, wel wetenschap: zo maakt CiCLO® polyester biologisch afbreekbaar.",
    href: "/kennisbank/flag-ciclo-technologie",
  },
  {
    icon: <ShieldCheck size={24} />,
    kicker: "CSRD",
    title: "CSRD-compliance",
    body: "Sinds het Omnibus-pakket geldt de CSRD alleen voor de grootste bedrijven. Lees of je eronder valt en wat grote opdrachtgevers alsnog van je vragen.",
    href: "/kennisbank/csrd-compliance",
  },
  {
    icon: <Leaf size={24} />,
    kicker: "Impact",
    title: "Het microplastics-probleem",
    body: "Wat zijn microplastics, waar komen ze vandaan en wat doet CiCLO® er wel en niet aan? De feiten op een rij.",
    href: "/kennisbank/microplastics",
  },
  {
    icon: <FlagMast size={24} />,
    kicker: "Keuzegids",
    title: "De juiste vlag kiezen",
    body: "Welk formaat past bij welke masthoogte? Een praktische gids voor mastvlaggen en baniervlaggen, met alle standaardmaten.",
    href: "/kennisbank/vlaggen-kiezen",
  },
];

// Verdieping elders op de site.
const MORE = [
  {
    icon: <Leaf size={24} />,
    kicker: "Materiaal",
    title: "Biologisch afbreekbaar doek",
    body: "De levenscyclus van Flag-CiCLO®-doek, van wapperen tot afgebroken, met de gemeten uitkomsten erbij.",
    href: "/materiaal",
  },
  {
    icon: <ShieldCheck size={24} />,
    kicker: "Bewijs",
    title: "Certificeringen uitgelegd",
    body: "OEKO-TEX, REACH en ASTM-tests: wat betekenen ze precies en wat bewijzen ze?",
    href: "/certificeringen",
  },
  {
    icon: <Check size={24} />,
    kicker: "Vragen",
    title: "Veelgestelde vragen",
    body: "Eerlijke antwoorden over technologie, CSRD, bestellen en duurzaamheid.",
    href: "/veelgestelde-vragen",
  },
];

export default function KennisbankPage() {
  return (
    <>
      {/* HERO */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<Leaf size={16} />}
              className={styles.heroEyebrow}
            >
              Kennisbank
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Alles over vlaggen die{" "}
              <span className={styles.heroAccent}>verdwijnen</span>.
            </h1>
            <p className={styles.heroSub}>
              Van de CSRD tot microplastics. Wat Flag-CiCLO®-doek doet, wat het
              niet doet, en wat er precies is gemeten. Eerlijke uitleg, zonder
              jargon.
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
                Liever bellen? Wij nemen de tijd
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{HOOFD_PCT}%</span>
              <span className={styles.heroStatLabel}>
                Afgebroken in {HOOFD_OMGEVING}
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{HOOFDTEST.code}</span>
              <span className={styles.heroStatLabel}>ASTM-testnorm</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>~3</span>
              <span className={styles.heroStatLabel}>Dagen levering</span>
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

      {/* ARTIKELEN */}
      <section className={styles.section} aria-labelledby="articles-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Artikelen</Badge>
            <h2 id="articles-title">Verdiep je in duurzame vlaggen.</h2>
            <p className="lead">
              Kies een onderwerp en lees wat je moet weten over biologisch
              afbreekbare vlaggen. In {HOOFD_OMGEVING} brak {HOOFD_PCT}% van ons
              doek af in {HOOFDTEST.duur} ({HOOFDTEST.norm}). Onbehandeld
              polyester kwam in dezelfde test niet verder dan{" "}
              {pctNl(HOOFDTEST.referentiePct ?? 0)}%.
            </p>
            <Link href={ONDERBOUWING_PAD} className={styles.arrowLink}>
              {ONDERBOUWING_LINK_TEKST} <ArrowRight size={16} />
            </Link>
          </div>
          <div className={`${styles.cardGrid} ${styles.cardGrid4}`}>
            {ARTICLES.map((article) => (
              <div key={article.title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {article.icon}
                </span>
                <span className={styles.cardKicker}>{article.kicker}</span>
                <h3>{article.title}</h3>
                <p>{article.body}</p>
                <Link href={article.href} className={styles.cardLink}>
                  Lees het artikel <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* MEER VERDIEPING */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="more-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Meer verdieping</Badge>
            <h2 id="more-title">Ook goed om te lezen.</h2>
          </div>
          <div className={styles.cardGrid}>
            {MORE.map((item) => (
              <div key={item.title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <span className={styles.cardKicker}>{item.kicker}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <Link href={item.href} className={styles.cardLink}>
                  Lees meer <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Klaar om te verduurzamen?
              </h2>
              <p className={styles.ctaSub}>
                Bekijk het assortiment biologisch afbreekbare vlaggen. Of stel
                je vraag. We denken graag met je mee.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/collectie"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Bekijk alle vlaggen
                </Button>
                <Link href="/contact" className={styles.ctaLink}>
                  Neem contact op
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
