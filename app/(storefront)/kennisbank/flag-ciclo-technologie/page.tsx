import type { Metadata } from "next";
import Link from "next/link";
import styles from "../../info.module.css";
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
  alternates: { canonical: "/kennisbank/flag-ciclo-technologie" },
  title: "Flag-CiCLO®: hoe een vlag verdwijnt",
  description:
    "Geen magie, wel wetenschap: zo zorgt CiCLO®-technologie dat onze vlaggen volledig oplossen zonder sporen achter te laten. De levenscyclus stap voor stap uitgelegd.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

const PHASES = [
  {
    meta: "3 tot 4 maanden",
    title: "In gebruik",
    body: "Volledig functioneel, met dezelfde kwaliteit als traditioneel polyester en 2 jaar UV-bestendige kleuren.",
  },
  {
    meta: "Na afdanking",
    title: "Start afbraak",
    body: "In grond, compost, zee of op de stortplaats komen micro-organismen in contact met de vezels.",
  },
  {
    meta: "1 tot 2 jaar",
    title: "Afbraak",
    body: "Micro-organismen breken de vezels af zoals natuurlijke materialen. Vergelijkbaar met wol.",
  },
  {
    meta: "2 tot 3 jaar totaal",
    title: "Verdwenen",
    body: "96% opgelost. Alleen CO₂, water en biomassa blijven over. Geen microplastics.",
  },
];

// Hoe de technologie in drie stappen werkt.
const HOW = [
  {
    icon: <Recycle size={24} />,
    title: "Slimme technologie",
    body: "CiCLO® wordt tijdens het spinproces in de polyestervezel zelf verwerkt. Als biologisch afbreekbare 'spots' die dienen als voedingsbron.",
  },
  {
    icon: <Leaf size={24} />,
    title: "Micro-organismen doen het werk",
    body: "Bacteriën en schimmels herkennen het materiaal daardoor als voedsel en eten de vezels op, net als bij wol of katoen.",
  },
  {
    icon: <Check size={24} />,
    title: "Wat blijft er over?",
    body: "Alleen water, CO₂ en biomassa. Geen plastic, geen microplastics, geen giftige resten.",
  },
];

/**
 * Het directe antwoord bovenaan; zie het gelijknamige blok in microplastics.
 * Deze pagina heeft geen vraag-antwoordblok, dus ook geen FAQPage-schema:
 * markup zetten die niet met zichtbare inhoud overeenkomt levert niets op.
 */
const KORT_ANTWOORD = [
  "Een gewone polyester vlag verdwijnt nooit. Polyester is plastic en blijft honderden jaren in het milieu, terwijl het ondertussen microplastics afgeeft.",
  "CiCLO®-technologie voegt tijdens het spinnen van de vezel biologisch afbreekbare plekken toe aan het polyester. Micro-organismen in grond, water en rioolzuivering kunnen daar houvast op krijgen, waardoor de vezel wordt afgebroken zoals wol dat doet. Het resultaat: 96% biologische afbraak in 2 tot 3 jaar, zonder microplastics als restant. Zolang de vlag hangt merk je er niets van, want kwaliteit, kleur en UV-bestendigheid blijven gelijk.",
];

export default function FlagCicloTechnologiePage() {
  return (
    <>
      {/* HERO — artikel-insteek met kruimelpad. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Link href="/kennisbank" className={styles.crumb}>
              Kennisbank · Technologie
            </Link>
            <h1 id="hero-title" className={styles.heroTitle}>
              Hoe kan een vlag gewoon...{" "}
              <span className={styles.heroAccent}>verdwijnen</span>?
            </h1>
            <p className={styles.heroSub}>
              Geen magie, wel wetenschap. Ontdek hoe CiCLO®-technologie ervoor
              zorgt dat onze vlaggen volledig oplossen. Zonder sporen achter
              te laten.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="/collectie"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Bekijk onze vlaggen
              </Button>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>96%</span>
              <span className={styles.heroStatLabel}>Lost volledig op</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>2 tot 3 jaar</span>
              <span className={styles.heroStatLabel}>Afbraaktijd</span>
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

      {/* HOE HET WERKT — drie chips. */}
      <section className={styles.section} aria-labelledby="how-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">De wetenschap</Badge>
            <h2 id="how-title">Zo werkt het, zonder jargon.</h2>
            <p className="lead">
              Gewone polyester vlaggen slijten en laten kleine plastic deeltjes
              achter die honderden jaren in de natuur blijven. Onze vlaggen
              zijn anders. Door één ingrediënt in de vezel.
            </p>
          </div>
          <div className={styles.chipGrid}>
            {HOW.map((item) => (
              <div key={item.title} className={styles.chipItem}>
                <span className={styles.chipIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
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
                De vlag breekt niet af terwijl je hem gebruikt. Pas als het
                doek na afdanking in contact komt met micro-organismen, in
                grond, compost of water, start het proces. Aan de mast blijft
                je vlag gewoon intact.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* LEVENSCYCLUS — vier fasen. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="cycle-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Levenscyclus</Badge>
            <h2 id="cycle-title">Van wapperen tot volledig verdwijnen.</h2>
            <p className="lead">
              Dezelfde kwaliteit en levensduur als traditionele polyester
              vlaggen. Maar na afdanking lost 96% volledig op in 2 tot 3 jaar.
              Zonder enige microplastics.
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
        </Container>
      </section>

      {/* BEWIJS — link naar certificeringen. */}
      <section className={styles.section} aria-labelledby="proof-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Onafhankelijk getest</Badge>
            <h2 id="proof-title">Niet ons woord, maar labresultaten.</h2>
            <p className="lead">
              De CiCLO®-technologie is meer dan drie jaar getest door erkende
              laboratoria, in grond, zeewater, rioolwaterzuivering en op
              stortplaatsen. Volgens internationale ASTM-normen. Daarnaast is
              het materiaal OEKO-TEX® ECO PASSPORT-gecertificeerd en voldoet
              het aan REACH.
            </p>
            <Link href="/certificeringen" className={styles.arrowLink}>
              Bekijk alle certificeringen en testresultaten{" "}
              <ArrowRight size={16} />
            </Link>
            <p className={styles.verdieping}>
              Nog dieper de stof in? Op{" "}
              <a href="https://flag-ciclo.nl">flag-ciclo.nl</a>, ons
              kennisdomein over het doek, vind je de werking in animatie en de
              vergelijking met gerecycled rPET.
            </p>
          </div>
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
                Dezelfde kwaliteit als traditioneel, maar CSRD-rapporteerbaar
                en volledig afbreekbaar.
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
                <Link href="/kennisbank" className={styles.ctaLink}>
                  Meer ontdekken in de kennisbank
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
