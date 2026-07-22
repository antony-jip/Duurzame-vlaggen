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
  FlagPole,
} from "@/components/ui";
import {
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
} from "@/lib/claims/afbreekbaarheid";

export const metadata: Metadata = {
  alternates: { canonical: "/garantie" },
  title: "Garantie. Kwaliteit zwart op wit",
  description:
    "Transparante garantie op duurzame vlaggen, vlaggenmasten en accessoires. Tot 15 jaar breukgarantie op masten, productiefouten altijd vergoed en reactie binnen 24 uur.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Waar de kwaliteit op rust.
const QUALITY = [
  {
    icon: <ShieldCheck size={24} />,
    title: "Stevigheid",
    body: "Identieke materiaalsterkte als traditioneel polyester. Bestand tegen wind en weer gedurende de volledige gebruiksduur.",
  },
  {
    icon: <Leaf size={24} />,
    title: "Kleurvastheid",
    body: "Tot 2 jaar UV-bestendig bij buitengebruik. Je kleuren blijven helder en professioneel, ook na maanden zon.",
  },
  {
    icon: <Recycle size={24} />,
    title: "Printkwaliteit",
    body: "Sublimatiedruk in volle kleur met scherpe details. Logo's en teksten komen er exact zo uit als je verwacht.",
  },
];

// De garantievoorwaarden per productgroep.
const TERMS = [
  {
    icon: <Leaf size={24} />,
    kicker: "Productgarantie",
    title: "Vlaggen",
    items: [
      "Levensduur 3 tot 4 maanden bij intensief buitengebruik",
      "Kleurvastheid tot 2 jaar UV-bestendig",
      "Productiefouten worden altijd vergoed",
    ],
  },
  {
    icon: <FlagPole size={24} />,
    kicker: "5 tot 15 jaar breukgarantie",
    title: "Vlaggenmasten",
    items: [
      "15 jaar breukgarantie op polyester masten",
      "10 jaar op aluminium conische masten",
      "5 jaar op aluminium cilindrische masten",
    ],
  },
  {
    icon: <Check size={24} />,
    kicker: "3 maanden garantie",
    title: "Accessoires",
    items: [
      "Mastknoppen en bevestigingsmaterialen",
      "Vlaggenkoord en liersystemen",
      "Overige losse onderdelen",
    ],
  },
  {
    icon: <ShieldCheck size={24} />,
    kicker: "Let op",
    title: "Uitzonderingen",
    items: [
      "Vlag niet binnengehaald bij windkracht 7+ (cilindrische masten: 6+)",
      "Mast niet platgelegd bij windkracht 9+",
      "Schade door natuurrampen of onjuist gebruik",
    ],
  },
];

// Klacht melden in drie stappen.
const COMPLAINT_STEPS = [
  {
    title: "Neem contact op",
    body: "Via het contactformulier of per e-mail, met je ordernummer erbij.",
  },
  {
    title: "Beschrijf het probleem",
    body: "Vertel wat er mis is en voeg waar mogelijk foto's toe.",
  },
  {
    title: "Wij lossen het op",
    body: "We onderzoeken je klacht en komen binnen 24 uur met een oplossing: vervanging of (deel)restitutie.",
  },
];

const FAQ = [
  {
    q: "Waarom gaat mijn vlag maar 3 tot 4 maanden mee?",
    a: "Dat is de standaard levensduur van alle buitenvlaggen, ook traditionele polyester. Wind, regen en UV-straling slijten het doek. Het verschil zit na afdanking: in zeewater brak 94,2% van ons doek af in ruim drie en een half jaar (ASTM D6691), tegen 3,8% voor onbehandeld polyester.",
  },
  {
    q: "Breekt de vlag af terwijl deze aan de mast hangt?",
    a: "Nee. Het afbraakproces start alleen wanneer de vlag in contact komt met micro-organismen in bodem, zeewater, rioolslib of een stortplaats. Aan de mast blijft je vlag volledig intact en functioneel.",
  },
  {
    q: "Wat als mijn vlag sneller slijt dan verwacht?",
    a: "Neem contact op met foto's en je ordernummer. We onderzoeken elk geval individueel en komen met een passende oplossing: vervanging of (deel)restitutie. Productiefouten vergoeden we altijd.",
  },
  {
    q: "Waarom vervalt de mastgarantie bij harde wind?",
    a: "Vlaggenmasten zijn ontworpen voor normaal gebruik. Bij windkracht 7 of hoger (6+ voor cilindrische masten) ontstaan krachten waar de mast niet op berekend is. Haal je vlag binnen bij storm en leg de mast plat bij windkracht 9+.",
  },
];

export default function GarantiePage() {
  return (
    <>
      {/* HERO — kwaliteit als belofte. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<ShieldCheck size={16} />}
              className={styles.heroEyebrow}
            >
              Flag-CiCLO® kwaliteit
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Garantie op <span className={styles.heroAccent}>kwaliteit</span>.
            </h1>
            <p className={styles.heroSub}>
              Onze biologisch afbreekbare vlaggen bieden dezelfde kwaliteit als
              traditioneel polyester. Geen compromissen op stevigheid,
              kleurvastheid of levensduur. En transparante garantie op alles wat
              we leveren.
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
                Vraag of klacht? Neem contact op
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>3 tot 4 mnd</span>
              <span className={styles.heroStatLabel}>Levensduur vlag</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>2 jaar</span>
              <span className={styles.heroStatLabel}>UV-bestendig</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>15 jaar</span>
              <span className={styles.heroStatLabel}>Breukgarantie mast</span>
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

      {/* KWALITEIT — drie pijlers. */}
      <section className={styles.section} aria-labelledby="quality-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">De basis</Badge>
            <h2 id="quality-title">Geen compromissen, geen concessies.</h2>
            <p className="lead">
              Flag-CiCLO® combineert duurzaamheid met professionele kwaliteit.
              Het enige verschil met traditioneel polyester? Wat er ná afdanking
              gebeurt.
            </p>
          </div>
          <div className={styles.chipGrid}>
            {QUALITY.map((item) => (
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

      {/* VOORWAARDEN — vier kaarten per productgroep. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="terms-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Garantievoorwaarden</Badge>
            <h2 id="terms-title">Precies weten waar je aan toe bent.</h2>
            <p className="lead">
              Transparante garantie op al onze producten. Inclusief de situaties
              waarin de garantie vervalt.
            </p>
          </div>
          <div className={`${styles.cardGrid} ${styles.cardGrid4}`}>
            {TERMS.map((term) => (
              <div key={term.title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {term.icon}
                </span>
                <span className={styles.cardKicker}>{term.kicker}</span>
                <h3>{term.title}</h3>
                <ul className={styles.cardList}>
                  {term.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* KLACHT MELDEN — drie stappen. */}
      <section className={styles.section} aria-labelledby="complaint-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Niet tevreden?</Badge>
            <h2 id="complaint-title">Zo meld je een klacht.</h2>
            <p className="lead">
              Dat horen we graag, zodat we het kunnen oplossen. We reageren
              binnen 24 uur op werkdagen.
            </p>
          </div>
          <div className={`${styles.steps} ${styles.steps3}`}>
            {COMPLAINT_STEPS.map((step, i) => (
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

      {/* FAQ — garantievragen. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="faq-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Veelgestelde vragen</Badge>
            <h2 id="faq-title">Vragen over garantie.</h2>
            <Link href={ONDERBOUWING_PAD} className={styles.arrowLink}>
              {ONDERBOUWING_LINK_TEKST} <ArrowRight size={16} />
            </Link>
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
                Iets niet in orde? We lossen het op.
              </h2>
              <p className={styles.ctaSub}>
                Stuur ons je ordernummer en een korte beschrijving. Binnen 24
                uur hoor je van ons. Van een mens, niet van een chatbot.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/contact"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Neem contact op
                </Button>
                <Link href="/veelgestelde-vragen" className={styles.ctaLink}>
                  Bekijk alle veelgestelde vragen
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
