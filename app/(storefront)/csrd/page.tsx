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
  title: "CSRD en je vlaggen: geldt het voor jou?",
  description:
    "Sinds het Omnibus-pakket geldt de CSRD alleen boven 1.000 medewerkers én 450 miljoen euro omzet. Lees wanneer het voor jou geldt, en waarom grote opdrachtgevers toch naar je duurzame vlaggen vragen.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Wat er in het inkoopdossier zit dat bij elke bestelling meegaat.
const DOSSIER_POINTS = [
  {
    icon: <Leaf size={24} />,
    title: "Wat het doek is",
    body: "Samenstelling van het Flag-CiCLO®-doek, de weefselnaam en de artikelnummers van de weverij.",
  },
  {
    icon: <Check size={24} />,
    title: "Wie het maakt",
    body: "Georg+Otto Friedrich GmbH in Duitsland weeft het doek. Naam en herkomst staan erin, zodat je inkoper het kan natrekken.",
  },
  {
    icon: <Recycle size={24} />,
    title: "Wat er gemeten is",
    body: "Vier ASTM-testrapporten met per omgeving het percentage en de termijn, plus de referentiewaarde van onbehandeld polyester.",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Welke keuringen er zijn",
    body: "OEKO-TEX® ECO PASSPORT en EU REACH. Certificaatnummers waar ze bekend zijn, en anders eerlijk de melding dat ze zijn opgevraagd.",
  },
];

// Waar de drempels sinds het Omnibus-pakket liggen, en hoe de vraag alsnog bij
// kleinere bedrijven terechtkomt.
const DREMPELS = [
  {
    year: "1.000",
    title: "Medewerkers",
    body: "De rapportageplicht begint pas boven de duizend medewerkers.",
  },
  {
    year: "€450 mln",
    title: "Jaaromzet",
    body: "En pas boven een netto-omzet van 450 miljoen euro per jaar.",
  },
  {
    year: "Én",
    title: "Beide tegelijk",
    body: "Je moet aan allebei voldoen. Haal je één van de twee niet, dan geldt de CSRD niet voor jou.",
  },
  {
    year: "Keten",
    title: "Via je opdrachtgever",
    body: "Bedrijven die wél rapporteren brengen hun keten in beeld en leggen de vraag door aan hun leveranciers.",
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
              Wetgeving en inkoop
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              CSRD en je vlaggen:{" "}
              <span className={styles.heroAccent}>geldt het voor jou?</span>
            </h1>
            <p className={styles.heroSub}>
              Voor de meeste bedrijven niet. Sinds het Omnibus-pakket van
              december 2025 rapporteert alleen wie meer dan 1.000 medewerkers
              heeft én meer dan 450 miljoen euro omzet draait. De vraag komt wél
              binnen langs je grote opdrachtgevers, en dan is het inkoopdossier
              bij je duurzame vlaggen het antwoord.
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
              <span className={styles.heroStatValue}>1.000</span>
              <span className={styles.heroStatLabel}>
                Medewerkers, ondergrens
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>€450 mln</span>
              <span className={styles.heroStatLabel}>Omzet, ondergrens</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>Beide</span>
              <span className={styles.heroStatLabel}>
                Drempels gelden samen
              </span>
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
              Europese wet die grote bedrijven verplicht met controleerbare
              cijfers te rapporteren over hun milieu-impact. Zorgwekkende
              stoffen, waaronder microplastics, vallen onder hoofdstuk ESRS
              E2-5.
            </p>
            <p className="lead">
              Het Omnibus-pakket van december 2025 heeft de kring flink
              ingeperkt. Waar eerder bedrijven vanaf 250 medewerkers in beeld
              waren, geldt de plicht nu pas boven 1.000 medewerkers én 450
              miljoen euro omzet. Kom je daar niet aan, dan hoef je niets te
              rapporteren.
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
            <h2 id="when-title">Check of jouw bedrijf moet rapporteren.</h2>
            <p className="lead">
              Twee drempels, en ze gelden samen. Blijf je onder één van beide,
              dan heb je geen rapportageplicht. Lever je wel aan bedrijven die
              er wél boven zitten, dan bereikt de vraag je alsnog. Zij moeten
              hun keten in beeld brengen en vragen hun leveranciers om gegevens.
            </p>
          </div>
          <div className={styles.timeline}>
            {DREMPELS.map((item) => (
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
            <Badge variant="primary">Het inkoopdossier</Badge>
            <h2 id="report-title">Wat je van ons meekrijgt.</h2>
            <p className="lead">
              Bij elke bestelling zit een materiaalpaspoort. Geen keurmerk en
              geen verklaring van onszelf, maar de gegevens waar een inkoper om
              vraagt en die hij kan natrekken bij de bron.
            </p>
          </div>
          <div className={`${styles.chipGrid} ${styles.chipGrid4}`}>
            {DOSSIER_POINTS.map((point) => (
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
              <h3>Wij rapporteren niet voor je</h3>
              <p>
                Een materiaalpaspoort is geen CSRD-verklaring en wij zijn geen
                accountant. Wat je krijgt zijn de gegevens over het doek: wat
                het is, wie het weeft en wat er in het lab gemeten is. Wat je
                daarmee in je eigen verslag zet, blijft jouw verantwoording.
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
            <Badge variant="personal">Het verschil</Badge>
            <h2 id="compare-title">Gewone vlaggen vs. onze vlaggen.</h2>
            <p className="lead">
              Beide vlaggen laten vezels los tijdens gebruik. Het verschil zit
              in wat er met die vezels gebeurt, en in wat je erover kunt laten
              zien.
            </p>
          </div>
          <div className={styles.compare}>
            <div className={`${styles.compareCard} ${styles.compareBad}`}>
              <span className={styles.compareTag}>Gewone polyester vlag</span>
              <h3>Vezels die blijven liggen</h3>
              <ul className={styles.compareList}>
                <li>Gemaakt van plastic (polyester)</li>
                <li>3,8% afgebroken in de zeewatertest (ASTM D6691)</li>
                <li>Geen afbraak gemeten in bodem en rioolslib</li>
                <li>Geen testrapport of materiaalpaspoort</li>
                <li>Herkomst van het doek meestal onbekend</li>
              </ul>
            </div>
            <div className={`${styles.compareCard} ${styles.compareGood}`}>
              <span className={styles.compareTag}>
                Biologisch afbreekbare vlag
              </span>
              <h3>Vezels die afbreken</h3>
              <ul className={styles.compareList}>
                <li>94,2% afgebroken in dezelfde zeewatertest</li>
                <li>Testduur ruim drie en een half jaar (ASTM D6691)</li>
                <li>Ook getest in bodem, stortplaats en rioolslib</li>
                <li>Zelfde kwaliteit als traditioneel polyester</li>
                <li>Materiaalpaspoort bij elke bestelling</li>
              </ul>
            </div>
          </div>
          <div className={styles.sectionHead}>
            <Link href="/afbreekbaarheid" className={styles.arrowLink}>
              Zo is dat gemeten <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Krijg je de vraag? Dan heb je het antwoord al.
              </h2>
              <p className={styles.ctaSub}>
                Duurzame vlaggen met een inkoopdossier erbij: samenstelling,
                herkomst, testrapporten en certificaten. Bij elke bestelling,
                zonder dat je erom hoeft te vragen.
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
