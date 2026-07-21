import type { Metadata } from "next";
import Link from "next/link";
import styles from "../../info.module.css";
import { faqJsonLd } from "@/lib/seo";
import {
  Badge,
  Button,
  Container,
  ArrowRight,
  Check,
  Recycle,
  ShieldCheck,
  Truck,
} from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/kennisbank/csrd-compliance" },
  title: "CSRD: geldt dit voor jouw bedrijf?",
  description:
    "Nieuwe EU-regels verplichten rapportage over microplastics, ook uit vlaggen. Check of de CSRD voor jouw bedrijf geldt en regel je compliance in vier simpele stappen.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Voor wie geldt de rapportageplicht?
const WHO = [
  {
    icon: <ShieldCheck size={24} />,
    kicker: "Verplicht",
    title: "Groot bedrijf (250+ medewerkers)",
    body: "Je valt direct onder de CSRD en moet rapporteren over microplastics onder ESRS E2-5.",
  },
  {
    icon: <Check size={24} />,
    kicker: "Mogelijk later",
    title: "MKB (50 tot 250 medewerkers)",
    body: "Beursgenoteerd? Dan volg je later. Niet beursgenoteerd? Je kunt alsnog geraakt worden via je klanten.",
  },
  {
    icon: <Truck size={24} />,
    kicker: "Indirect geraakt",
    title: "Leverancier van grote bedrijven",
    body: "Je grote klanten moeten over hun keten rapporteren. Ze gaan jou dus vragen stellen. Of een alternatief zoeken.",
  },
];

// Zo maakt Flag-CiCLO® het makkelijk.
const SOLUTIONS = [
  {
    icon: <Recycle size={24} />,
    title: "Niets te rapporteren",
    body: "Flag-CiCLO®-vlaggen laten na afbraak 0% microplastics achter. Probleem opgelost voordat het begint.",
  },
  {
    icon: <Check size={24} />,
    title: "Certificaten erbij",
    body: "Bij elke bestelling ontvang je documentatie met exacte cijfers. Klaar om in je rapport op te nemen.",
  },
  {
    icon: <Truck size={24} />,
    title: "Snel geregeld",
    body: "Levering in circa 3 werkdagen. Zelfde kwaliteit als gewone vlaggen, zonder het compliance-gedoe later.",
  },
];

// Van bestelling naar compliance.
const STEPS = [
  {
    title: "Bestel je vlaggen",
    body: "Gewoon zoals je altijd deed, maar dan de Flag-CiCLO®-variant.",
  },
  {
    title: "Ontvang documentatie",
    body: "Certificaten en meetgegevens worden automatisch meegestuurd.",
  },
  {
    title: "Onderbouw je cijfers",
    body: "Met de productdata toon je aan: 0% microplastics uit je vlaggen.",
  },
  {
    title: "Klaar voor je rapport",
    body: "Neem de cijfers op in je CSRD-rapportage onder ESRS E2-5. Klaar.",
  },
];

const FAQ = [
  {
    q: "Ik heb maar 30 medewerkers. Waarom zou ik me hier druk om maken?",
    a: "Direct onder de CSRD val je waarschijnlijk niet. Maar heb je grote bedrijven als klant? Die moeten wél rapporteren. Ook over hun leveranciers. Straks vragen ze jou om data, of ze kiezen een concurrent die wél voorbereid is.",
  },
  {
    q: "Wat zijn microplastics eigenlijk? En waarom vlaggen?",
    a: "Microplastics zijn piepkleine plastic deeltjes die je vaak niet ziet. Gewone polyester vlaggen zijn van plastic en laten bij wind, zon en regen constant deeltjes los. Die eindigen in de grond, het water en uiteindelijk in de voedselketen.",
  },
  {
    q: "Zijn jullie vlaggen net zo goed als gewone vlaggen?",
    a: "Ja. Zelfde kwaliteit, kleuren, levensduur (3 tot 4 maanden bij normaal gebruik) en UV-bestendigheid. Het enige verschil zit in wat er ná gebruik gebeurt: onze vlaggen breken biologisch af zonder microplastics.",
  },
  {
    q: "Wat krijg ik precies als bewijs voor mijn rapportage?",
    a: "Bij elke bestelling: OEKO-TEX ECO PASSPORT-certificering, ASTM-testresultaten (afbraak in grond, water en rioolzuivering) en een productspecificatie met alle relevante data. Direct bruikbaar onder ESRS E2-5. Accountants en auditors herkennen deze certificeringen.",
  },
  {
    q: "Zijn jullie vlaggen veel duurder?",
    a: "Slechts enkele euro's per stuk meer dan traditioneel polyester. Daar staat tegenover: geen compliance-zorgen later, geen risico op boetes, en je houdt klanten die om duurzame leveranciers vragen.",
  },
  {
    q: "Hoe snel kan ik mijn vlaggen krijgen?",
    a: "Standaard circa 3 werkdagen na goedkeuring van je ontwerp. Haast? Rush-orders zijn mogelijk, neem even contact op.",
  },
];

/** Het directe antwoord bovenaan; zie het gelijknamige blok in microplastics. */
const KORT_ANTWOORD = [
  "De CSRD verplicht grote bedrijven te rapporteren over hun milieu-impact, en onder ESRS E2-5 valt daar uitstoot van microplastics onder. Polyester vlaggen zijn daar een bron van, want ze laten door wind, zon en regen continu deeltjes los.",
  "Val je er zelf niet direct onder, dan raakt het je alsnog via je klanten: die moeten óók over hun leveranciers rapporteren en vragen die data bij jou op. Een vlag van Flag-CiCLO® breekt in 2 tot 3 jaar voor 96% biologisch af en komt met OEKO-TEX ECO PASSPORT-certificering en ASTM-testresultaten die je direct in je verslag kunt gebruiken.",
];

const FAQ_JSON_LD = faqJsonLd(FAQ);

export default function CsrdCompliancePage() {
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
              Kennisbank · CSRD
            </Link>
            <h1 id="hero-title" className={styles.heroTitle}>
              Heb jij je vlaggen al{" "}
              <span className={styles.heroAccent}>gecheckt</span>?
            </h1>
            <p className={styles.heroSub}>
              Klinkt gek, maar het is waar: nieuwe EU-regels verplichten
              bedrijven te rapporteren over microplastics. Ook die van je
              vlaggen. We leggen uit wat dit voor jou betekent. Spoiler: het is
              makkelijker op te lossen dan je denkt.
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
              <Link href="/csrd" className={styles.heroLink}>
                Wat is CSRD precies?
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
              <span className={styles.heroStatValue}>✓</span>
              <span className={styles.heroStatLabel}>Al opgelost</span>
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

      {/* GELDT DIT VOOR MIJ */}
      <section className={styles.section} aria-labelledby="who-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">De belangrijkste vraag</Badge>
            <h2 id="who-title">Geldt dit ook voor mijn bedrijf?</h2>
            <p className="lead">
              Check welke groep bij jou past. Let op: ook als je niet direct
              verplicht bent, kun je indirect geraakt worden. Beter nu
              voorbereid dan straks verrast.
            </p>
          </div>
          <div className={styles.cardGrid}>
            {WHO.map((item) => (
              <div key={item.title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <span className={styles.cardKicker}>{item.kicker}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* GEVOLGEN — eerlijk verhaal, twee kolommen. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="consequences-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Eerlijk verhaal</Badge>
            <h2 id="consequences-title">Wat zijn de gevolgen?</h2>
            <p className="lead">
              Zowel als je niets doet, als wanneer je wél actie onderneemt. We
              houden het eerlijk. Zonder paniekzaaierij.
            </p>
          </div>
          <div className={styles.compare}>
            <div className={`${styles.compareCard} ${styles.compareBad}`}>
              <span className={styles.compareTag}>Als je niets doet</span>
              <h3>Risico stapelt op</h3>
              <ul className={styles.compareList}>
                <li>Boetes bij overtreding</li>
                <li>Grote klanten kiezen voor voorbereide concurrenten</li>
                <li>Je mist aanbestedingen die compliance eisen</li>
                <li>Reputatieschade bij steeds bewustere klanten</li>
                <li>Later omschakelen kost meer tijd en geld</li>
              </ul>
            </div>
            <div className={`${styles.compareCard} ${styles.compareGood}`}>
              <span className={styles.compareTag}>Als je nu handelt</span>
              <h3>Rust in je hoofd</h3>
              <ul className={styles.compareList}>
                <li>Compliant vóór de deadline</li>
                <li>Je houdt klanten die straks om data vragen</li>
                <li>Je kunt meedoen aan duurzame aanbestedingen</li>
                <li>Je onderscheidt je van concurrenten die wachten</li>
                <li>Eén keer goed regelen, jaren geen omkijken</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* DE OPLOSSING */}
      <section className={styles.section} aria-labelledby="solution-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">De oplossing</Badge>
            <h2 id="solution-title">Zo maakt Flag-CiCLO® het makkelijk.</h2>
            <p className="lead">
              Drie redenen waarom ondernemers voor onze vlaggen kiezen.
            </p>
          </div>
          <div className={styles.chipGrid}>
            {SOLUTIONS.map((item) => (
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

      {/* VIER STAPPEN */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="steps-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Zo werkt het</Badge>
            <h2 id="steps-title">
              Van bestelling naar compliance in vier stappen.
            </h2>
            <p className="lead">
              Makkelijker dan je denkt. Je hoeft zelf niets uit te zoeken.
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
      <section className={styles.section} aria-labelledby="faq-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Goede vragen</Badge>
            <h2 id="faq-title">Dit vragen anderen zich ook af.</h2>
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
                Klaar om het gewoon te regelen?
              </h2>
              <p className={styles.ctaSub}>
                Geen gedoe, geen ingewikkelde procedures. Bestel
                Flag-CiCLO®-vlaggen, ontvang je certificaten, en je bent klaar
                voor de CSRD. Zo simpel is het.
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
