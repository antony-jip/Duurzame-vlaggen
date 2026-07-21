import type { Metadata } from "next";
import Link from "next/link";
import styles from "../../info.module.css";
import { faqJsonLd } from "@/lib/seo";
import {
  Badge,
  Button,
  Container,
  ArrowRight,
  Leaf,
  Recycle,
  ShieldCheck,
  Truck,
} from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/kennisbank/microplastics" },
  title: "Microplastics in vlaggen",
  description:
    "Wat zijn microplastics, waar komen ze vandaan en waarom zijn polyester vlaggen een bron? De feiten, de gezondheidsrisico's en wat jouw organisatie eraan kan doen.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// De grootste bronnen van microplastic-vervuiling.
const SOURCES = [
  {
    icon: <Leaf size={24} />,
    title: "Synthetische textielen",
    body: "Polyester kleding, vlaggen, banners en outdoortextiel geven vezels af bij slijtage en wassen. Een vlag hangt bovendien 24/7 in wind en weer.",
  },
  {
    icon: <Truck size={24} />,
    title: "Autobanden",
    body: "Bandenslijtage is een van de grootste bronnen van microplastics in stedelijke gebieden.",
  },
  {
    icon: <Recycle size={24} />,
    title: "Verpakkingsmateriaal",
    body: "Plastic verpakkingen breken in het milieu af in steeds kleinere deeltjes. Maar verdwijnen nooit echt.",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Industriële processen",
    body: "Bij productie en verwerking van plastic lekken microdeeltjes naar water en bodem.",
  },
];

// Waarom het een probleem is.
const IMPACT = [
  {
    icon: <Leaf size={24} />,
    title: "Milieuschade",
    body: "Microplastics hopen zich op in oceanen, bodems en zelfs de lucht. Organismen nemen ze op, waardoor ze in de voedselketen terechtkomen.",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Gezondheidsrisico's",
    body: "Microplastics zijn aangetroffen in menselijk bloed, longen en placenta's. Ze kunnen ontstekingen veroorzaken en schadelijke stoffen transporteren.",
  },
  {
    icon: <Recycle size={24} />,
    title: "Regelgeving komt eraan",
    body: "De EU neemt actie: grote bedrijven moeten hun microplastic-uitstoot rapporteren onder de CSRD. Voorbereiden is nu essentieel.",
  },
];

// Vier stappen naar een microplastic-vrije organisatie.
const STEPS = [
  {
    title: "Inventariseer je bronnen",
    body: "Breng in kaart welke materialen in je organisatie microplastics kunnen afgeven, van vlaggen tot werkkleding.",
  },
  {
    title: "Kies alternatieven",
    body: "Vervang polyester vlaggen door Flag-CiCLO®: 96% biologisch afbreekbaar, 0% microplastics.",
  },
  {
    title: "Meet je impact",
    body: "Kwantificeer je reductie met de meegeleverde productdata en testresultaten.",
  },
  {
    title: "Rapporteer resultaten",
    body: "Documenteer je vooruitgang voor de CSRD en communiceer het naar je stakeholders.",
  },
];

const FAQ = [
  {
    q: "Wat zijn microplastics precies?",
    a: "Plastic deeltjes kleiner dan 5 millimeter. Ze ontstaan door slijtage van synthetische materialen zoals polyester vlaggen, kleding en autobanden. Eenmaal in het milieu blijven ze honderden jaren bestaan en accumuleren ze in de voedselketen.",
  },
  {
    q: "Hoe komen microplastics uit vlaggen vrij?",
    a: "Polyester vlaggen slijten door wind, regen en UV-straling. Daarbij komen continu kleine vezels vrij die via lucht en water in het milieu terechtkomen. Dat proces gaat dag en nacht door, zolang de vlag hangt.",
  },
  {
    q: "Zijn microplastics schadelijk voor de gezondheid?",
    a: "Microplastics zijn aangetroffen in menselijk bloed, longen en placenta's. Ze kunnen ontstekingen veroorzaken en schadelijke stoffen transporteren. De WHO en de EU beschouwen ze als opkomende zorg voor de volksgezondheid.",
  },
  {
    q: "Wat is het verschil met Flag-CiCLO®-vlaggen?",
    a: "Flag-CiCLO®-vlaggen breken voor 96% biologisch af in 2 tot 3 jaar en laten geen microplastics achter. Gewone polyester vlaggen blijven honderden jaren in het milieu en geven continu vezels af.",
  },
  {
    q: "Moet ik microplastics rapporteren onder de CSRD?",
    a: "Ja. Grote bedrijven moeten onder ESRS E2-5 rapporteren over hun microplastic-uitstoot. Met Flag-CiCLO®-vlaggen voldoe je aan die eis met meetbare resultaten en certificaten voor je duurzaamheidsverslag.",
  },
];

/**
 * Het directe antwoord, bovenaan en in ongeveer honderd woorden.
 *
 * De H1 stelt een vraag en de hero-subtitel plaagt er omheen; wie het antwoord
 * wil moest scrollen. Dit blok geeft het meteen, zelfstandig leesbaar en zonder
 * verwijzingen naar "hierboven" of "hieronder", zodat een AI Overview of
 * featured snippet 'm los kan citeren.
 */
const KORT_ANTWOORD = [
  "Een polyester vlag is een doorlopende bron van microplastics: plastic deeltjes kleiner dan 5 millimeter. Wind, regen en UV-straling slijten het doek, waardoor er dag en nacht vezels vrijkomen zolang de vlag hangt.",
  "Die deeltjes verdwijnen niet meer. Ze zijn aangetroffen in menselijk bloed, longen en placenta's, en grote bedrijven moeten er sinds de CSRD over rapporteren onder ESRS E2-5. Een vlag van Flag-CiCLO® breekt in 2 tot 3 jaar voor 96% biologisch af en laat geen microplastics achter.",
];

const FAQ_JSON_LD = faqJsonLd(FAQ);

export default function MicroplasticsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: FAQ_JSON_LD }}
      />
      {/* HERO */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Link href="/kennisbank" className={styles.crumb}>
              Kennisbank · Impact
            </Link>
            <h1 id="hero-title" className={styles.heroTitle}>
              Microplastics. De{" "}
              <span className={styles.heroAccent}>stille vervuiler</span>.
            </h1>
            <p className={styles.heroSub}>
              Elke dag komen miljoenen onzichtbare plastic deeltjes vrij in ons
              milieu. Ook uit vlaggen. Wat zijn microplastics, waarom vormen
              ze een probleem en wat kun jij eraan doen?
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="/duurzaamheid"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Bekijk de oplossing
              </Button>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>&lt;5 mm</span>
              <span className={styles.heroStatLabel}>Deeltjesgrootte</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>500+</span>
              <span className={styles.heroStatLabel}>Jaar in het milieu</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>0%</span>
              <span className={styles.heroStatLabel}>Flag-CiCLO®-residu</span>
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

      {/* WAT ZIJN MICROPLASTICS */}
      <section className={styles.section} aria-labelledby="what-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Achtergrond</Badge>
            <h2 id="what-title">Onzichtbaar, maar overal aanwezig.</h2>
            <p className="lead">
              Microplastics zijn plastic deeltjes kleiner dan 5 millimeter. Ze
              ontstaan wanneer grotere plastic voorwerpen afbreken, of komen
              als vezels vrij bij slijtage van synthetisch materiaal zoals
              polyester.
            </p>
            <p className="lead">
              Het probleem: eenmaal in het milieu verdwijnen ze niet.
              Microplastics zijn inmiddels aangetroffen in oceanen, drinkwater,
              voedsel, lucht, en zelfs in menselijk bloed en placenta&apos;s. Ze
              stapelen zich op in de voedselketen en vormen een groeiend
              gezondheidsrisico.
            </p>
          </div>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Bronnen</Badge>
            <h2>Waar komen ze vandaan?</h2>
          </div>
          <div className={`${styles.chipGrid} ${styles.chipGrid4}`}>
            {SOURCES.map((item) => (
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

      {/* WAAROM EEN PROBLEEM */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="impact-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Impact</Badge>
            <h2 id="impact-title">Waarom dit een probleem is.</h2>
            <p className="lead">
              De gevolgen voor milieu, dieren en mensen worden steeds
              duidelijker. En de wetgever beweegt mee.
            </p>
          </div>
          <div className={styles.cardGrid}>
            {IMPACT.map((item) => (
              <div key={item.title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* WAT KUN JE DOEN — vier stappen. */}
      <section className={styles.section} aria-labelledby="steps-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Oplossing</Badge>
            <h2 id="steps-title">Wat kun jij doen?</h2>
            <p className="lead">
              Vier praktische stappen naar een microplastic-vrije organisatie.
            </p>
          </div>
          <div className={styles.steps}>
            {STEPS.map((step, i) => (
              <div key={step.title} className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="faq-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Veelgestelde vragen</Badge>
            <h2 id="faq-title">Vragen over microplastics.</h2>
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
        </Container>
      </section>

      {/* CTA */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Klaar om microplastics te stoppen?
              </h2>
              <p className={styles.ctaSub}>
                Flag-CiCLO®-vlaggen zijn 96% biologisch afbreekbaar en laten
                0% microplastics achter. Inclusief certificaten voor je
                CSRD-rapportage.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/collectie"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Bekijk de vlaggen
                </Button>
                <Link href="/contact" className={styles.ctaLink}>
                  Vraag offerte aan
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
