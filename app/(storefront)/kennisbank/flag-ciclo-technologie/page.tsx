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
import {
  CICLO_DISCLAIMER,
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";
import { articleJsonLd, breadcrumbJsonLd, jsonLd } from "@/lib/seo";

/** Nederlandse schrijfwijze van een percentage: 94.2 wordt 94,2. */

const HOOFD_PCT = pctNl(HOOFDTEST.afbraakPct);
const HOOFD_OMGEVING = HOOFDTEST.omgeving.toLowerCase();
const REFERENTIE_PCT =
  HOOFDTEST.referentiePct === null ? null : pctNl(HOOFDTEST.referentiePct);

const PAD = "/kennisbank/flag-ciclo-technologie";
const TITEL = "Flag-CiCLO®: biologisch afbreekbaar doek";
const OMSCHRIJVING =
  "Geen magie, wel wetenschap: CiCLO® maakt polyester biologisch afbreekbaar. In zeewater brak 94,2% af in ruim drie en een half jaar (ASTM D6691).";

export const metadata: Metadata = {
  alternates: { canonical: PAD },
  title: TITEL,
  description: OMSCHRIJVING,
};

// Gestructureerde data: het artikel zelf plus het kruimelpad. Titel en
// omschrijving komen uit dezelfde constanten als de metadata, zodat er maar
// één waarheid is. Bewust geen aggregateRating of review: die zijn er niet.
const ARTICLE_JSON_LD = jsonLd(
  articleJsonLd({ titel: TITEL, omschrijving: OMSCHRIJVING, pad: PAD }),
);

const BREADCRUMB_JSON_LD = jsonLd(
  breadcrumbJsonLd([
    { naam: "Home", pad: "/" },
    { naam: "Kennisbank", pad: "/kennisbank" },
    { naam: "Flag-CiCLO® technologie", pad: PAD },
  ]),
);

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
    body: "In bodem, zeewater, rioolslib of op de stortplaats komen micro-organismen in contact met de vezels.",
  },
  {
    meta: "Tijdens de test",
    title: "Afbraak",
    body: "Micro-organismen breken de vezels af zoals ze dat bij natuurlijke materialen doen. Vergelijkbaar met wol.",
  },
  {
    meta: HOOFDTEST.duur,
    title: "Afgebroken",
    body: `In ${HOOFD_OMGEVING} brak ${HOOFD_PCT}% van het doek af in ${HOOFDTEST.duur} (${HOOFDTEST.norm}). Wat overblijft is CO₂, water en biomassa.`,
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
    title: "Laat minder microplastic achter",
    body: `Vezels die tijdens gebruik loslaten breken af in plaats van te blijven liggen. In ${HOOFD_OMGEVING} brak ${HOOFD_PCT}% van het doek af in ${HOOFDTEST.duur} (${HOOFDTEST.code}). Onbehandeld polyester kwam in dezelfde test niet verder dan ${REFERENTIE_PCT}%.`,
  },
];

/**
 * Het directe antwoord bovenaan; zie het gelijknamige blok in microplastics.
 * Deze pagina heeft geen vraag-antwoordblok, dus ook geen FAQPage-schema:
 * markup zetten die niet met zichtbare inhoud overeenkomt levert niets op.
 */
const KORT_ANTWOORD = [
  "Een gewone polyester vlag verdwijnt nooit. Polyester is plastic en blijft honderden jaren in het milieu, terwijl het ondertussen microplastics afgeeft.",
  `CiCLO®-technologie voegt tijdens het spinnen van de vezel biologisch afbreekbare plekken toe aan het polyester. Micro-organismen in grond, water en rioolzuivering kunnen daar houvast op krijgen, waardoor de vezel wordt afgebroken zoals wol dat doet. In ${HOOFD_OMGEVING} brak ${HOOFD_PCT}% van het doek af in ${HOOFDTEST.duur} (${HOOFDTEST.norm}). Zolang de vlag hangt merk je er niets van, want kwaliteit, kleur en UV-bestendigheid blijven gelijk.`,
];

export default function FlagCicloTechnologiePage() {
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
      {/* HERO — artikel-insteek met kruimelpad. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Link href="/kennisbank" className={styles.crumb}>
              Kennisbank · Technologie
            </Link>
            <h1 id="hero-title" className={styles.heroTitle}>
              Hoe wordt een vlag{" "}
              <span className={styles.heroAccent}>biologisch afbreekbaar</span>?
            </h1>
            <p className={styles.heroSub}>
              Geen magie, wel wetenschap. CiCLO® maakt de polyestervezel
              herkenbaar als voedsel voor micro-organismen. In {HOOFD_OMGEVING}{" "}
              brak {HOOFD_PCT}% van het doek af in {HOOFDTEST.duur} (
              {HOOFDTEST.norm}).
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
              <span className={styles.heroStatValue}>{HOOFD_PCT}%</span>
              <span className={styles.heroStatLabel}>
                Afgebroken in {HOOFD_OMGEVING}
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{HOOFDTEST.duur}</span>
              <span className={styles.heroStatLabel}>Testduur</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{HOOFDTEST.code}</span>
              <span className={styles.heroStatLabel}>ASTM-testnorm</span>
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
              achter die heel lang in de natuur blijven liggen. Ook ons doek
              geeft vezels af, want CiCLO® verandert niets aan die afgifte. Het
              verandert wel wat er daarna met die vezels gebeurt.
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
                De vlag breekt niet af terwijl je hem gebruikt. Pas als het doek
                na afdanking in contact komt met micro-organismen, in bodem,
                zeewater of rioolslib, start het proces. Aan de mast blijft je
                vlag gewoon intact.
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
            <h2 id="cycle-title">Van wapperen tot afgebroken.</h2>
            <p className="lead">
              Dezelfde kwaliteit en levensduur als traditionele polyester
              vlaggen. Het verschil zit in wat er na afdanking gebeurt: in{" "}
              {HOOFD_OMGEVING} brak {HOOFD_PCT}% van het doek af in{" "}
              {HOOFDTEST.duur} ({HOOFDTEST.norm}), tegenover {REFERENTIE_PCT}%
              voor onbehandeld polyester.
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
              het materiaal OEKO-TEX® ECO PASSPORT-gecertificeerd en voldoet het
              aan REACH.
            </p>
            <p className="lead">{CICLO_DISCLAIMER}</p>
            <Link href={ONDERBOUWING_PAD} className={styles.arrowLink}>
              {ONDERBOUWING_LINK_TEKST} <ArrowRight size={16} />
            </Link>
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
                Klaar voor een duurzame vlag?
              </h2>
              <p className={styles.ctaSub}>
                Dezelfde kwaliteit als traditioneel polyester, op biologisch
                afbreekbaar doek met de testresultaten erbij.
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
