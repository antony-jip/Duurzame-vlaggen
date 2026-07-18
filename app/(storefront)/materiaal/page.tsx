import type { Metadata } from "next";
import Link from "next/link";
import styles from "../info.module.css";
import {
  Badge,
  Button,
  Container,
  ArrowRight,
  Leaf,
  ShieldCheck,
} from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/materiaal" },
  title: "Materiaal. Biologisch afbreekbaar vlaggendoek",
  description:
    "Flag-CiCLO® vlaggendoek lost volledig op in 2 tot 3 jaar: geen microplastics, alleen CO₂, water en biomassa. Dezelfde kwaliteit als traditioneel polyester, wel klaar voor de CSRD.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// De levenscyclus van het doek, van mast tot biomassa.
const PHASES = [
  {
    meta: "3 tot 4 maanden",
    title: "In gebruik",
    body: "Volledig functioneel, met dezelfde kwaliteit als traditioneel polyester en tot 2 jaar UV-bestendige kleuren.",
  },
  {
    meta: "Na afdanking",
    title: "Start afbraak",
    body: "In grond, compost, zee of op de stortplaats komen micro-organismen in contact met de vezels.",
  },
  {
    meta: "1 tot 2 jaar",
    title: "Actieve afbraak",
    body: "Micro-organismen breken de vezels af zoals natuurlijke materialen. Vergelijkbaar met wol.",
  },
  {
    meta: "2 tot 3 jaar totaal",
    title: "Verdwenen",
    body: "96% is opgelost. Alleen CO₂, water en biomassa blijven over. Geen microplastics.",
  },
];

export default function MateriaalPage() {
  return (
    <>
      {/* HERO — het materiaal als hoofdrolspeler. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<Leaf size={16} />}
              className={styles.heroEyebrow}
            >
              Flag-CiCLO® technologie
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Biologisch afbreekbaar{" "}
              <span className={styles.heroAccent}>vlaggendoek</span>.
            </h1>
            <p className={styles.heroSub}>
              Ons Flag-CiCLO® materiaal lost volledig op in 2 tot 3 jaar. Geen
              microplastics, geen schadelijke resten. Alleen CO₂, water en
              biomassa. Dezelfde kwaliteit als traditioneel polyester, maar dan
              klaar voor de CSRD.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="/collectie"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Ontwerp je vlag
              </Button>
              <Link href="/certificeringen" className={styles.heroLink}>
                Bekijk de certificaten
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>96%</span>
              <span className={styles.heroStatLabel}>Afbreekbaar</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>2 tot 3 jaar</span>
              <span className={styles.heroStatLabel}>Tot volledige afbraak</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>0%</span>
              <span className={styles.heroStatLabel}>Microplastics</span>
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

      {/* LEVENSCYCLUS — vier fasen in genummerde merkchips. */}
      <section className={styles.section} aria-labelledby="cycle-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Levenscyclus</Badge>
            <h2 id="cycle-title">Van wapperen tot volledig verdwijnen.</h2>
            <p className="lead">
              Flag-CiCLO® is polyester met een ingebouwde voedingsbron voor
              micro-organismen. Tijdens gebruik presteert het doek als een
              gewone vlag. Pas na afdanking start het afbraakproces.
            </p>
          </div>
          <div className={styles.steps}>
            {PHASES.map((phase, i) => (
              <div key={phase.title} className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">
                  {i + 1}
                </span>
                <span className={styles.stepMeta}>{phase.meta}</span>
                <h3>{phase.title}</h3>
                <p>{phase.body}</p>
              </div>
            ))}
          </div>
          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3>Goed om te weten</h3>
              <p>
                De vlag breekt niet af terwijl hij aan de mast hangt of in de
                kast ligt. Het proces start pas wanneer het doek in contact
                komt met micro-organismen in grond, compost, zeewater of
                rioolwaterzuivering. Tijdens normaal gebruik blijft de vlag
                volledig intact.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* VERGELIJKING — plastic vs duurzaam. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="compare-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Direct vergelijken</Badge>
            <h2 id="compare-title">Plastic vs. duurzaam.</h2>
            <p className="lead">
              Het verschil zit niet in de kwaliteit tijdens gebruik, maar in
              wat er overblijft als de vlag versleten is.
            </p>
          </div>
          <div className={styles.compare}>
            <div className={`${styles.compareCard} ${styles.compareBad}`}>
              <span className={styles.compareTag}>Traditioneel polyester</span>
              <h3>Blijft eeuwen bestaan</h3>
              <ul className={styles.compareList}>
                <li>Blijft 200+ jaar in de natuur als plastic afval</li>
                <li>Laat deeltjes microplastic achter bij slijtage</li>
                <li>Moet als bron van microplastics gerapporteerd worden (CSRD)</li>
                <li>Mogelijk toekomstige beperkingen vanuit de EU door wetgeving</li>
              </ul>
            </div>
            <div className={`${styles.compareCard} ${styles.compareGood}`}>
              <span className={styles.compareTag}>Flag-CiCLO®</span>
              <h3>Lost volledig op</h3>
              <ul className={styles.compareList}>
                <li>96% verdwenen in 2 tot 3 jaar na afdanking, zonder resten</li>
                <li>0% microplastics, beschermt bodem en water</li>
                <li>Rapporteerbaar voor CSRD: certificaten inbegrepen</li>
                <li>Zelfde kwaliteit, print en levensduur als polyester</li>
              </ul>
            </div>
          </div>
          {/* Verdieping op ons eigen kennisdomein: wie het naadje van de kous
              wil (testdata, rPET-vergelijking, werking) leest door op
              flag-ciclo.nl; die site linkt voor bestellen weer hierheen. */}
          <p className={styles.verdieping}>
            Het hele verhaal achter het doek, van de testdata tot de
            vergelijking met gerecycled rPET, lees je op{" "}
            <a href="https://flag-ciclo.nl">flag-ciclo.nl</a>, ons
            kennisdomein over Flag-CiCLO.
          </p>
        </Container>
      </section>

      {/* CTA */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Klaar voor vlaggen die verdwijnen?
              </h2>
              <p className={styles.ctaSub}>
                Dezelfde kwaliteit als traditioneel, maar volledig afbreekbaar.
                Vragen over het materiaal? We helpen je graag met advies.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/collectie"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Bekijk de collectie
                </Button>
                <Link href="/contact" className={styles.ctaLink}>
                  Stel je vraag
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
