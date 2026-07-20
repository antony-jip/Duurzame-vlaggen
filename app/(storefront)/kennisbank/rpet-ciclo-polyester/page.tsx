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
  NoEntry,
  Recycle,
} from "@/components/ui";
import {
  CICLO_DISCLAIMER,
  DOEK,
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, jsonLd } from "@/lib/seo";

/**
 * De materiaalkeuze die inkopers wél stellen en die vrijwel geen leverancier
 * beantwoordt: rPET, Flag-CiCLO of gewoon polyester.
 *
 * Bewust ook eerlijk waar het ons niet uitkomt. rPET heeft een voordeel dat
 * CiCLO niet heeft (minder vraag naar nieuwe grondstof) en dat staat hier
 * gewoon. Wie beide voordelen in één doek wil, moet weten dat dat niet bestaat.
 *
 * Cijfers komen uit `lib/claims/afbreekbaarheid.ts` en staan nooit kaal: altijd
 * met norm, omgeving en termijn erbij (EU 2024/825).
 */

/** Nederlandse schrijfwijze van een percentage: 94.2 wordt 94,2. */

const HOOFD_PCT = pctNl(HOOFDTEST.afbraakPct);
const HOOFD_OMGEVING = HOOFDTEST.omgeving.toLowerCase();
const REFERENTIE_PCT =
  HOOFDTEST.referentiePct === null ? null : pctNl(HOOFDTEST.referentiePct);

const PAD = "/kennisbank/rpet-ciclo-polyester";
const TITEL = "rPET, Flag-CiCLO of gewoon polyester: welk vlaggendoek kies je?";
const OMSCHRIJVING =
  "Een eerlijke vergelijking van drie soorten vlaggendoek voor duurzame vlaggen: gerecycled polyester, biologisch afbreekbaar Flag-CiCLO en nieuw polyester. Per rij grondstof, vezelafgifte, einde levensduur, testrapport, aanbestedingen en prijs.";

export const metadata: Metadata = {
  alternates: { canonical: PAD },
  title: TITEL,
  description: OMSCHRIJVING,
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

/**
 * De vergelijkingstabel. Zes rijen, drie materialen, en per cel het eerlijke
 * antwoord in plaats van een vinkje.
 */
const VERGELIJKING: Array<{
  rij: string;
  rpet: string;
  ciclo: string;
  polyester: string;
}> = [
  {
    rij: "Grondstof",
    rpet: "Gerecycled polyester, meestal gemaakt uit ingezamelde PET-flessen. Geen nieuwe aardolie nodig voor de vezel zelf.",
    ciclo: `Nieuw polyester met het CiCLO®-additief in de vezel. Dit is geen recyclaat: de grondstof is nieuw. Ons doek is ${DOEK.weefselnaam} van ${DOEK.weverij}.`,
    polyester:
      "Nieuw polyester uit aardolie. De standaard in de vlaggenbranche en het uitgangspunt waar de twee andere opties zich tegen afzetten.",
  },
  {
    rij: "Afgifte van vezels tijdens gebruik",
    rpet: "Even hoog als bij nieuw polyester. Recycling verandert niets aan hoe het weefsel slijt in wind en UV.",
    ciclo:
      "Even hoog als bij nieuw polyester. Het additief grijpt pas aan nadat een vezel is losgelaten, niet op het loslaten zelf.",
    polyester:
      "Even hoog. Elke geweven vlag geeft vezels af zolang hij buiten hangt.",
  },
  {
    rij: "Wat er gebeurt na afdanking",
    rpet: "Het blijft polyester. Het verteert niet en fragmenteert over lange tijd tot kleinere deeltjes, net als nieuw polyester.",
    ciclo: `Micro-organismen herkennen de vezel als voedsel. In ${HOOFD_OMGEVING} brak ${HOOFD_PCT}% van het materiaal af in ${HOOFDTEST.duur}, gemeten volgens ${HOOFDTEST.norm}.`,
    polyester:
      "Verbranding, storten of zwerfafval. Verteert in geen van die drie situaties.",
  },
  {
    rij: "Aantoonbaar met een testrapport",
    rpet: "Ja, via een GRS- of RCS-certificaat op het aandeel recyclaat. Dat rapport zegt iets over de herkomst, niet over het einde van de levensduur.",
    ciclo: `Ja, via vier ASTM-testrapporten met per omgeving een percentage en een termijn, plus een controlemonster van onbehandeld polyester${REFERENTIE_PCT === null ? "" : ` dat in dezelfde test niet verder kwam dan ${REFERENTIE_PCT}%`}.`,
    polyester:
      "Niet van toepassing. Er valt geen milieuclaim te onderbouwen omdat er geen claim is.",
  },
  {
    rij: "Geschikt voor aanbestedingen",
    rpet: "Goed bruikbaar wanneer de uitvraag stuurt op circulariteit of op een aandeel gerecycled materiaal.",
    ciclo:
      "Goed bruikbaar wanneer de uitvraag stuurt op microplastics, op zwerfafval of op het einde van de levensduur.",
    polyester:
      "Zelden onderscheidend. Voldoet meestal alleen aan uitvragen waarin duurzaamheid geen gunningscriterium is.",
  },
  {
    rij: "Prijsniveau",
    rpet: "Iets boven nieuw polyester. Het verschil is beperkt en verschilt per leverancier en per oplage.",
    ciclo:
      "Hoger dan nieuw polyester, vergelijkbaar met of iets boven rPET. Je betaalt voor het additief en voor de onderbouwing.",
    polyester: "Het laagst. Dit is de referentieprijs in de markt.",
  },
];

/* Waar elk van de twee duurzamere opties werkelijk over gaat. */
const KEUZE = [
  {
    icon: <Recycle size={24} />,
    kop: "Gaat het je om minder nieuwe grondstof?",
    body: "Dan is rPET verdedigbaar. Gerecycled polyester hergebruikt plastic dat al bestaat en verlaagt de vraag naar nieuwe grondstof. Dat is een echt voordeel, en het is een voordeel dat Flag-CiCLO® niet heeft. Wie op circulariteit stuurt, kiest hier terecht voor.",
  },
  {
    icon: <Leaf size={24} />,
    kop: "Gaat het je om wat er achterblijft in de natuur?",
    body: "Dan is Flag-CiCLO® de betere keuze. rPET blijft na afdanking gewoon polyester en verdwijnt niet uit het milieu. Het verschil van Flag-CiCLO® zit precies daar: aan het einde van de levensduur, gemeten in vier omgevingen.",
  },
  {
    icon: <NoEntry size={24} />,
    kop: "Wil je allebei tegelijk?",
    body: "Dat bestaat op dit moment niet als vlaggendoek. Een doek is óf gemaakt van recyclaat, óf voorzien van een additief dat de biologische afbraak mogelijk maakt. Een leverancier die je beide eigenschappen in één weefsel belooft, moet daar een testrapport bij kunnen leggen. Vraag daarom.",
  },
];

const FAQ = [
  {
    q: "Is gerecycled polyester duurzamer dan Flag-CiCLO®?",
    a: "Dat hangt af van wat je meet. Op grondstofgebruik is rPET beter, want het gebruikt plastic dat al bestaat. Op wat er na afdanking achterblijft is Flag-CiCLO® beter, want rPET blijft polyester en verteert niet. Er is geen objectieve rangorde tussen die twee. Er is alleen de vraag welk probleem in jouw organisatie zwaarder weegt.",
  },
  {
    q: "Kan ik een vlag krijgen die gerecycled én biologisch afbreekbaar is?",
    a: "Niet als vlaggendoek in de courante breedtes. De twee eigenschappen komen uit verschillende productieroutes: recyclaat komt uit ingezamelde PET, het additief wordt tijdens het spinnen aan nieuw polyester toegevoegd. Wordt het je toch aangeboden, vraag dan om het certificaat voor het recyclaataandeel én om de afbraakrapporten. Zonder die twee documenten naast elkaar is het een claim en geen materiaal.",
  },
  {
    q: "Geeft een vlag van rPET minder vezels af dan een gewone vlag?",
    a: "Nee. Het weefsel slijt op dezelfde manier, want het is chemisch hetzelfde materiaal. Dat geldt trouwens net zo goed voor Flag-CiCLO®. Geen van de drie materialen in deze vergelijking geeft tijdens gebruik minder vezels af dan de andere.",
  },
  {
    q: "Wat vraagt een aanbesteding meestal uit?",
    a: "Dat verschilt per opdrachtgever. Uitvragen die sturen op circulariteit of op een minimumaandeel gerecycled materiaal passen bij rPET. Uitvragen die sturen op microplastics, zwerfafval of het einde van de levensduur passen bij Flag-CiCLO®. Lees het gunningscriterium dus voordat je het materiaal kiest, en niet andersom.",
  },
  {
    q: "Welk materiaal is het goedkoopst over de hele gebruiksduur?",
    a: "Dat bepaalt de levensduur, niet de grondstof. Een vlag die twee seizoenen langer meegaat, is per jaar goedkoper dan een goedkopere vlag die je eerder vervangt, en hij belast het milieu ook minder omdat er minder vaak geproduceerd en vervoerd hoeft te worden. Kijk daarom eerst naar het doekgewicht, de afwerking en de maatvoering, en pas daarna naar het materiaalverhaal.",
  },
];

// Gestructureerde data: artikel, kruimelpad en de FAQ. De vragen komen uit
// dezelfde `FAQ`-array als het zichtbare blok hieronder, zodat er nooit een
// antwoord in de structured data staat dat niet op de pagina staat. Bewust geen
// aggregateRating of review: die zijn er niet.
const ARTICLE_JSON_LD = jsonLd(
  articleJsonLd({ titel: TITEL, omschrijving: OMSCHRIJVING, pad: PAD }),
);

const BREADCRUMB_JSON_LD = jsonLd(
  breadcrumbJsonLd([
    { naam: "Home", pad: "/" },
    { naam: "Kennisbank", pad: "/kennisbank" },
    { naam: "rPET, Flag-CiCLO of gewoon polyester", pad: PAD },
  ]),
);

const FAQ_JSON_LD = jsonLd(faqJsonLd(FAQ));

export default function RpetCicloPolyesterPage() {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: FAQ_JSON_LD }}
      />
      {/* HERO */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Link href="/kennisbank" className={styles.crumb}>
              Kennisbank · Materiaalkeuze
            </Link>
            <h1 id="hero-title" className={styles.heroTitle}>
              rPET, Flag-CiCLO of gewoon polyester:{" "}
              <span className={styles.heroAccent}>wat kies je?</span>
            </h1>
            <p className={styles.heroSub}>
              Wie duurzame vlaggen inkoopt, komt drie soorten vlaggendoek tegen
              en krijgt zelden uitgelegd wat het verschil is. Leveranciers
              voeren de materialen naast elkaar zonder te zeggen welk probleem
              elk materiaal oplost. Deze pagina zet het op een rij, ook op de
              punten waarop ons eigen doek niet de beste papieren heeft.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href={ONDERBOUWING_PAD}
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                {ONDERBOUWING_LINK_TEKST}
              </Button>
              <Link href="/materiaaldossier" className={styles.heroLink}>
                Lees het materiaaldossier
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerngegevens">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>3</span>
              <span className={styles.heroStatLabel}>
                Materialen naast elkaar
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>Gelijk</span>
              <span className={styles.heroStatLabel}>
                Vezelafgifte tijdens gebruik
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{HOOFD_PCT}%</span>
              <span className={styles.heroStatLabel}>
                Flag-CiCLO® afgebroken in {HOOFD_OMGEVING} in {HOOFDTEST.duur}
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

      {/* DE VERGELIJKING */}
      <section className={styles.section} aria-labelledby="tabel-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">De vergelijking</Badge>
            <h2 id="tabel-title">
              Drie soorten vlaggendoek op zes punten vergeleken.
            </h2>
            <p className="lead">
              Elke rij is een vraag die in een inkoopgesprek voorbijkomt. De
              antwoorden staan er zoals ze zijn, dus ook waar gerecycled
              polyester het van ons doek wint.
            </p>
          </div>
          <div className={styles.proseTableWrap}>
            <table
              className={styles.proseTable}
              aria-label="Gerecycled polyester, Flag-CiCLO en nieuw polyester vergeleken op grondstof, vezelafgifte, einde levensduur, testrapport, aanbestedingen en prijs"
            >
              <thead>
                <tr>
                  <th scope="col">Punt</th>
                  <th scope="col">Gerecycled polyester (rPET)</th>
                  <th scope="col">Flag-CiCLO®</th>
                  <th scope="col">Nieuw polyester</th>
                </tr>
              </thead>
              <tbody>
                {VERGELIJKING.map((r) => (
                  <tr key={r.rij}>
                    <th scope="row">{r.rij}</th>
                    <td>{r.rpet}</td>
                    <td>{r.ciclo}</td>
                    <td>{r.polyester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <Check size={20} />
            </span>
            <div>
              <h3>Over de cijfers in deze tabel</h3>
              <p>
                {CICLO_DISCLAIMER} De volledige uitkomsten van de vier
                ASTM-tests, met per omgeving de norm, de termijn en het
                onbehandelde referentiemonster, staan op de claimpagina.
              </p>
              <p>
                <Link href={ONDERBOUWING_PAD} className={styles.arrowLink}>
                  {ONDERBOUWING_LINK_TEKST} <ArrowRight size={16} />
                </Link>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* WAT DE TABEL BETEKENT */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="keuze-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">De conclusie</Badge>
            <h2 id="keuze-title">
              De keuze hangt af van welk probleem je wilt oplossen.
            </h2>
            <p className="lead">
              Er is geen materiaal dat op alle zes de punten wint. Wie doet
              alsof van wel, heeft de vergelijking niet gemaakt.
            </p>
          </div>
          <div className={styles.cardGrid}>
            {KEUZE.map((item) => (
              <div key={item.kop} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <h3>{item.kop}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* WAT NIEMAND ERBIJ ZEGT */}
      <section className={styles.section} aria-labelledby="nuance-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">De nuance</Badge>
            <h2 id="nuance-title">
              Wat er over biologisch afbreekbaar vlaggendoek meestal niet bij
              wordt verteld.
            </h2>
          </div>
          <div className={styles.prose}>
            <h3>Het verschil zit aan het einde, niet aan het begin</h3>
            <p>
              Flag-CiCLO® is nieuw materiaal met een additief. De grondstof is
              dus niet duurzamer dan die van een gewone polyester vlag, en op
              dat punt doet rPET het beter. Het verschil zit in wat er gebeurt
              nadat de vlag is afgedankt of nadat een losgeraakte vezel in het
              milieu belandt. Dat is een reëel verschil, maar het is een ander
              verschil dan dat van gerecycled polyester.
            </p>
            <h3>Geen van de drie materialen slijt schoner</h3>
            <p>
              De rij over vezelafgifte staat er niet voor niets. Zolang een vlag
              buiten hangt, laat hij vezels los, en dat gaat bij alle drie de
              materialen even snel. Wat verschilt is de afloop van die vezels,
              niet het aantal.
            </p>
            <h3>Levensduur weegt zwaarder dan grondstof</h3>
            <p>
              Een vlag die langer meegaat, hoeft minder vaak vervangen te
              worden. Dat scheelt productie, transport en afval, en die winst is
              in de praktijk groter dan het verschil tussen de drie materialen
              in deze tabel. Kies daarom eerst het juiste doekgewicht en de
              juiste afwerking voor de plek waar de vlag komt te hangen, en maak
              pas daarna de materiaalkeuze.
            </p>
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
            <h2 id="faq-title">Vragen van inkopers over de materiaalkeuze.</h2>
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
                Twijfel je welk materiaal bij je uitvraag past?
              </h2>
              <p className={styles.ctaSub}>
                Stuur ons het gunningscriterium of de duurzaamheidsparagraaf uit
                je uitvraag. Dan zeggen we welk van de drie materialen erbij
                past, ook als dat er een is die wij niet leveren.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/contact"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Leg je uitvraag voor
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
