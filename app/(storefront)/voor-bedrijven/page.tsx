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
  FlagGevel,
  FlagMast,
  FlagBanier,
  VergelijkVlaggen,
} from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/voor-bedrijven" },
  title: "Voor bedrijven. CSRD-proof bedrijfsvlaggen",
  description:
    "Biologisch afbreekbare bedrijfsvlaggen met dezelfde kwaliteit als polyester. 0% microplastics, CSRD/ESRS E2-5-documentatie inbegrepen en levering in circa 3 werkdagen.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Waarom bedrijven overstappen — de vier zakelijke argumenten.
const REASONS = [
  {
    icon: <ShieldCheck size={24} />,
    title: "CSRD-compliant",
    body: "Voldoet aan de ESRS E2-5-rapportage-eisen voor microplastics. Geen uitstoot, dus niets te verantwoorden.",
  },
  {
    icon: <Check size={24} />,
    title: "Certificaten inbegrepen",
    body: "Bij elke bestelling ontvang je de documentatie voor je duurzaamheidsverslag. Direct bruikbaar voor je accountant.",
  },
  {
    icon: <Recycle size={24} />,
    title: "Zelfde kwaliteit",
    body: "Identieke levensduur, kleurvastheid en printkwaliteit als traditioneel polyester. Niemand ziet het verschil.",
  },
  {
    icon: <Leaf size={24} />,
    title: "Vergelijkbare prijs",
    body: "Slechts enkele euro's meer per vlag. Bij zakelijke volumes is het prijsverschil verwaarloosbaar.",
  },
];

// Producttips per toepassing, gekoppeld aan de echte collectie-pagina's.
const PRODUCTS = [
  {
    icon: <FlagGevel size={24} />,
    kicker: "Aan je pand",
    title: "Gevelvlag",
    body: "Je logo in full-color aan de gevel. Op doek dat na gebruik volledig afbreekt. Geen plastic dat je pand overleeft.",
    href: "/collectie/gevelvlag",
    label: "Bekijk gevelvlaggen",
  },
  {
    icon: <FlagMast size={24} />,
    kicker: "Klassiek display",
    title: "Mastvlag",
    body: "De vertrouwde mastvlag. Nul microplastics. Zelfde levensduur en kwaliteit, na afdanking opgelost in 2 tot 3 jaar.",
    href: "/collectie/mastvlag",
    label: "Bekijk mastvlaggen",
  },
  {
    icon: <FlagBanier size={24} />,
    kicker: "Representatief",
    title: "Baniervlag",
    body: "Strak en representatief bij entrees en beurzen. Campagne voorbij? Geen plastic dat achterblijft in de natuur.",
    href: "/collectie/baniervlag",
    label: "Bekijk baniervlaggen",
  },
];

export default function VoorBedrijvenPage() {
  return (
    <>
      {/* HERO — forest vlak met glass-stats, zakelijke insteek. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<Leaf size={16} />}
              className={styles.heroEyebrow}
            >
              Voor bedrijven
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Bedrijfsvlaggen die{" "}
              <span className={styles.heroAccent}>verdwijnen</span>.
            </h1>
            <p className={styles.heroSub}>
              Elke gewone vlag wappert zichzelf kapot tot microplastic. De onze
              niet. Zelfde kwaliteit en kleurvastheid als je huidige polyester,
              maar 96% lost volledig op in 2 tot 3 jaar na afdanking. Geen
              microplastics. Geen CSRD-hoofdpijn.
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
                Vraag offerte aan
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>0%</span>
              <span className={styles.heroStatLabel}>Microplastics</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>96%</span>
              <span className={styles.heroStatLabel}>Afbreekbaar</span>
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

      {/* WAAROM — vier zakelijke argumenten in chip-taal. */}
      <section className={styles.section} aria-labelledby="why-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Waarom overstappen</Badge>
            <h2 id="why-title">Duurzaam zonder concessies.</h2>
            <p className="lead">
              Bedrijven kiezen voor Flag-CiCLO® omdat het niets kost aan
              kwaliteit en veel oplevert aan rapportagegemak.
            </p>
          </div>
          <div className={`${styles.chipGrid} ${styles.chipGrid4}`}>
            {REASONS.map((item) => (
              <div key={item.title} className={styles.chipItem}>
                <span className={styles.chipIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* PRODUCTEN — merk-kaarten naar de collectie. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="products-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Toepassingen</Badge>
            <h2 id="products-title">Welke vlag past bij je pand?</h2>
            <p className="lead">
              Van gevel tot entree: elke vlag drukken we in full-color op
              Flag-CiCLO®-doek. Speciale wensen of grotere aantallen? Wij
              denken graag mee.
            </p>
          </div>
          <div className={styles.cardGrid}>
            {PRODUCTS.map((product) => (
              <div key={product.title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {product.icon}
                </span>
                <span className={styles.cardKicker}>{product.kicker}</span>
                <h3>{product.title}</h3>
                <p>{product.body}</p>
                <Link href={product.href} className={styles.cardLink}>
                  {product.label} <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CSRD-VERHAAL — de urgentie, met doorverwijzing naar /csrd. */}
      <section className={styles.section} aria-labelledby="csrd-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">CSRD 2025</Badge>
            <h2 id="csrd-title">
              Die vlaggen aan je gevel? Die staan straks in je rapport.
            </h2>
            <p className="lead">
              Grote bedrijven moeten onder de CSRD rapporteren over
              microplastics. En textiel telt mee. Elke polyester vlag die slijt,
              laat duizenden plastic vezels achter in bodem en water. Geen detail
              meer. Een regel in je verslag.
            </p>
            <p className="lead">
              Onze vlaggen lossen op. Geen microplastics om te verantwoorden,
              geen lastige vragen van accountants of stakeholders. Je kunt
              wachten tot iemand ernaar vraagt. Of je regelt het nu.
            </p>
            <Link href="/csrd" className={styles.arrowLink}>
              Alles over CSRD en je vlaggen <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </section>

      <VergelijkVlaggen />

      {/* CTA — terracotta afsluiter naar persoonlijk contact. */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Maatwerk voor jouw bedrijf?
              </h2>
              <p className={styles.ctaSub}>
                Speciale wensen, grotere aantallen of CSRD-documentatie nodig?
                Vertel ons je situatie en we maken een voorstel op maat.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/contact"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Vraag offerte aan
                </Button>
                <Link href="/collectie" className={styles.ctaLink}>
                  Bekijk de collectie
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
