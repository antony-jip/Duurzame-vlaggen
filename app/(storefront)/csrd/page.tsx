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
} from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/csrd" },
  title: "CSRD. Microplastics rapporteren",
  description:
    "De CSRD verplicht bedrijven te rapporteren over microplastics onder ESRS E2-5. Ook die uit vlaggen. Lees wanneer het voor jou geldt en hoe je het simpel oplost.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Wat je onder ESRS E2-5 concreet moet kunnen beantwoorden.
const REPORT_POINTS = [
  {
    icon: <Leaf size={24} />,
    title: "Waar komen ze vandaan?",
    body: "Breng in kaart welke materialen in je organisatie microplastics afgeven. Vlaggen en banners tellen mee, net als bedrijfskleding.",
  },
  {
    icon: <Check size={24} />,
    title: "Hoeveel precies?",
    body: "Geen 'ongeveer veel'. Je moet het kunnen meten of berekenen. Flag-CiCLO® vlaggen scoren hier simpelweg 0%.",
  },
  {
    icon: <Recycle size={24} />,
    title: "Wat doe je eraan?",
    body: "Laat zien dat je werkt aan vermindering. Overstappen op biologisch afbreekbare vlaggen is zo'n concrete maatregel.",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Kun je het bewijzen?",
    body: "Je hebt certificaten en testresultaten nodig. Die leveren wij bij elke bestelling mee, klaar voor je verslag.",
  },
];

// De gefaseerde invoering van de rapportageplicht.
const TIMELINE = [
  {
    year: "2025",
    title: "Grote beursgenoteerde bedrijven",
    body: "Meer dan 500 werknemers: banken, verzekeraars, grote multinationals.",
  },
  {
    year: "2026",
    title: "Alle grote bedrijven",
    body: "Meer dan 250 werknemers óf meer dan €50 miljoen jaaromzet.",
  },
  {
    year: "2027",
    title: "Beursgenoteerd MKB",
    body: "Kleinere bedrijven met beursnotering volgen daarna.",
  },
  {
    year: "2029",
    title: "Buitenlandse bedrijven",
    body: "Bedrijven van buiten de EU met meer dan €150 miljoen omzet in Europa.",
  },
];

export default function CsrdPage() {
  return (
    <>
      {/* HERO — de nieuwe wetgeving, zonder paniekzaaierij. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<ShieldCheck size={16} />}
              className={styles.heroEyebrow}
            >
              Nieuwe wetgeving
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Straks rapporteer je het plastic{" "}
              <span className={styles.heroAccent}>in je vlaggen</span>.
            </h1>
            <p className={styles.heroSub}>
              De Europese CSRD verplicht bedrijven te melden hoeveel
              microplastics ze uitstoten. Inclusief de vezels die uit polyester
              vlaggen slijten. Onze vlaggen lossen op en laten géén
              microplastics achter. Probleem opgelost voordat het begint.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="/contact"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Vraag offerte aan
              </Button>
              <Link href="/duurzaamheid" className={styles.heroLink}>
                Bekijk de technologie
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>2025</span>
              <span className={styles.heroStatLabel}>Start rapportage</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>€10M</span>
              <span className={styles.heroStatLabel}>Maximale boete</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>0%</span>
              <span className={styles.heroStatLabel}>Met onze vlaggen</span>
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

      {/* WAT IS CSRD — in gewoon Nederlands. */}
      <section className={styles.section} aria-labelledby="what-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">In gewoon Nederlands</Badge>
            <h2 id="what-title">Wat is CSRD eigenlijk?</h2>
            <p className="lead">
              CSRD staat voor Corporate Sustainability Reporting Directive: een
              Europese wet die bedrijven verplicht eerlijk te vertellen hoe
              duurzaam ze écht zijn. Niet vaag, maar met harde, controleerbare
              cijfers. Hoeveel CO₂? Hoeveel afval? En ja, ook hoeveel
              microplastics.
            </p>
            <p className="lead">
              Microplastics vallen onder hoofdstuk ESRS E2-5 ("zorgwekkende
              stoffen"). Gebruikt je bedrijf polyester vlaggen, dan draag je
              bij aan de uitstoot van microplastics. En dat staat straks in je
              jaarverslag.
            </p>
            <Link href="/kennisbank/microplastics" className={styles.arrowLink}>
              Waarom zijn vlaggen een bron van microplastics?{" "}
              <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </section>

      {/* TIJDLIJN — wanneer geldt dit voor wie. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="when-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Wanneer geldt dit?</Badge>
            <h2 id="when-title">Check wanneer jouw bedrijf moet rapporteren.</h2>
            <p className="lead">
              De wet wordt stapsgewijs ingevoerd: grote bedrijven eerst,
              daarna steeds kleinere. Lever je aan grote bedrijven? Dan word
              je indirect geraakt. Je klanten gaan om data vragen.
            </p>
          </div>
          <div className={styles.timeline}>
            {TIMELINE.map((item) => (
              <div key={item.year} className={styles.timelineItem}>
                <span className={styles.timelineYear}>{item.year}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* WAT RAPPORTEREN — vier vragen. */}
      <section className={styles.section} aria-labelledby="report-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">ESRS E2-5</Badge>
            <h2 id="report-title">Wat moet je precies rapporteren?</h2>
            <p className="lead">
              Het klinkt ingewikkeld, maar het komt neer op vier vragen die je
              moet kunnen beantwoorden. Met de juiste vlaggen zijn ze zo
              beantwoord.
            </p>
          </div>
          <div className={`${styles.chipGrid} ${styles.chipGrid4}`}>
            {REPORT_POINTS.map((point) => (
              <div key={point.title} className={styles.chipItem}>
                <span className={styles.chipIcon} aria-hidden="true">
                  {point.icon}
                </span>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </div>
            ))}
          </div>
          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3>Geen vrijblijvende suggestie</h3>
              <p>
                De AFM houdt toezicht op de CSRD. Niet rapporteren of bewust
                onjuiste informatie geven kan leiden tot boetes tot €10
                miljoen, persoonlijke verantwoordelijkheid van bestuurders en
                uitsluiting van overheidsaanbestedingen. Met de juiste keuzes
                hoef je je hier geen zorgen over te maken.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* VERGELIJKING — gewone vs onze vlaggen. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="compare-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">De oplossing</Badge>
            <h2 id="compare-title">Gewone vlaggen vs. onze vlaggen.</h2>
            <p className="lead">
              Het verschil zit in wat er overblijft als de vlag versleten is.
              En dus in wat er in je rapport komt te staan.
            </p>
          </div>
          <div className={styles.compare}>
            <div className={`${styles.compareCard} ${styles.compareBad}`}>
              <span className={styles.compareTag}>Gewone polyester vlag</span>
              <h3>Een regel in je rapport</h3>
              <ul className={styles.compareList}>
                <li>Gemaakt van plastic (polyester)</li>
                <li>Microplastics komen vrij bij slijtage</li>
                <li>Blijft honderden jaren in het milieu</li>
                <li>Moet gerapporteerd worden onder CSRD</li>
                <li>Compliance-risico neemt elk jaar toe</li>
              </ul>
            </div>
            <div className={`${styles.compareCard} ${styles.compareGood}`}>
              <span className={styles.compareTag}>
                Biologisch afbreekbare vlag
              </span>
              <h3>Niets te verantwoorden</h3>
              <ul className={styles.compareList}>
                <li>96% lost volledig op in 2 tot 3 jaar</li>
                <li>Géén microplastics na afbraak</li>
                <li>Zelfde kwaliteit als traditioneel</li>
                <li>Documentatie voor ESRS E2-5 inbegrepen</li>
                <li>Compliant vanaf dag één</li>
              </ul>
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
                De regels zijn helder. De oplossing ook.
              </h2>
              <p className={styles.ctaSub}>
                Vlaggen zonder microplastics, met alle documentatie voor je
                duurzaamheidsverslag erbij. Geen gedoe, geen grijze gebieden.
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
                <Link
                  href="/kennisbank/csrd-compliance"
                  className={styles.ctaLink}
                >
                  Lees de complete gids over CSRD
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
