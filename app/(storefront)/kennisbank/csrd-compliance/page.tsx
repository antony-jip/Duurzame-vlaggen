import type { Metadata } from "next";
import Link from "next/link";
import styles from "../../info.module.css";
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
import {
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, jsonLd } from "@/lib/seo";

/** Nederlandse schrijfwijze van een percentage: 94.2 wordt 94,2. */

const HOOFD_PCT = pctNl(HOOFDTEST.afbraakPct);
const HOOFD_OMGEVING = HOOFDTEST.omgeving.toLowerCase();

const PAD = "/kennisbank/csrd-compliance";
const TITEL = "CSRD: geldt het voor jouw bedrijf?";
const OMSCHRIJVING =
  "Sinds het Omnibus-pakket geldt de CSRD pas vanaf 1.000 medewerkers en 450 miljoen euro omzet. Lees of je eronder valt en wat opdrachtgevers alsnog vragen.";

export const metadata: Metadata = {
  alternates: { canonical: PAD },
  title: TITEL,
  description: OMSCHRIJVING,
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Voor wie geldt de rapportageplicht?
const WHO = [
  {
    icon: <ShieldCheck size={24} />,
    kicker: "Rapportageplicht",
    title: "Meer dan 1.000 medewerkers én 450 miljoen euro omzet",
    body: "Je valt onder de CSRD en rapporteert onder de ESRS, waaronder over vervuiling en microplastics in je keten.",
  },
  {
    icon: <Check size={24} />,
    kicker: "Geen plicht",
    title: "Zit je daaronder?",
    body: "Dan geldt er geen CSRD-rapportageplicht voor jou. Het Omnibus-pakket van december 2025 heeft het mkb en de meeste middelgrote bedrijven eruit gehaald.",
  },
  {
    icon: <Truck size={24} />,
    kicker: "Wel de vraag",
    title: "Leverancier van een groot bedrijf",
    body: "Je opdrachtgever rapporteert over zijn keten en heeft daarvoor gegevens van jou nodig. Die vraag komt bij inkoop terecht, niet bij de wetgever.",
  },
];

// Wat Flag-CiCLO® je in dat gesprek oplevert.
const SOLUTIONS = [
  {
    icon: <Recycle size={24} />,
    title: "Laat minder microplastic achter",
    body: `Vezels die tijdens gebruik loslaten breken af in plaats van te blijven liggen. In ${HOOFD_OMGEVING} brak ${HOOFD_PCT}% van het doek af in ${HOOFDTEST.duur} (${HOOFDTEST.code}).`,
  },
  {
    icon: <Check size={24} />,
    title: "Inkoopdossier inbegrepen",
    body: "Bij elke bestelling ontvang je de ASTM-testresultaten en de certificaten van het doek. Dat is wat een inkoper van je vraagt.",
  },
  {
    icon: <Truck size={24} />,
    title: "Snel geregeld",
    body: "Levering in circa 3 werkdagen. Zelfde kwaliteit als gewone vlaggen, met de onderbouwing er meteen bij.",
  },
];

// Van bestelling naar een dossier dat de vraag beantwoordt.
const STEPS = [
  {
    title: "Bestel je vlaggen",
    body: "Gewoon zoals je altijd deed, maar dan de Flag-CiCLO®-variant.",
  },
  {
    title: "Ontvang documentatie",
    body: "De certificaten en de ASTM-testresultaten worden automatisch meegestuurd.",
  },
  {
    title: "Onderbouw je cijfers",
    body: `Met de productdata laat je zien wat er is gemeten: ${HOOFD_PCT}% afgebroken in ${HOOFD_OMGEVING} in ${HOOFDTEST.duur}.`,
  },
  {
    title: "Leg het in je dossier",
    body: "Bewaar het bij je inkoopgegevens, zodat je het paraat hebt als een opdrachtgever of accountant ernaar vraagt.",
  },
];

const FAQ = [
  {
    q: "Ik heb maar 30 medewerkers. Geldt de CSRD voor mij?",
    a: "Nee. Sinds het Omnibus-pakket van december 2025 geldt de CSRD alleen voor bedrijven met meer dan 1.000 medewerkers én meer dan 450 miljoen euro omzet. Met 30 medewerkers val je daar niet onder en heb je geen rapportageplicht.",
  },
  {
    q: "Waarom hoor ik dan toch over de CSRD van mijn klanten?",
    a: "Omdat de bedrijven die er wel onder vallen over hun hele keten rapporteren. Voor hun cijfers hebben ze gegevens van hun leveranciers nodig. Die vraag komt via inkoop bij jou terecht, ook al geldt de wet niet voor jou. Een leverancier die de gegevens paraat heeft, is makkelijker zakendoen dan een die ze moet gaan uitzoeken.",
  },
  {
    q: "Wat zijn microplastics eigenlijk? En waarom vlaggen?",
    a: "Microplastics zijn piepkleine plastic deeltjes die je vaak niet ziet. Gewone polyester vlaggen zijn van plastic en laten bij wind, zon en regen constant deeltjes los. Die eindigen in de grond, het water en uiteindelijk in de voedselketen.",
  },
  {
    q: "Zijn jullie vlaggen net zo goed als gewone vlaggen?",
    a: `Ja. Zelfde kwaliteit, kleuren, levensduur (3 tot 4 maanden bij normaal gebruik) en UV-bestendigheid. Het verschil zit in wat er ná gebruik gebeurt: onze vlaggen zijn biologisch afbreekbaar. In ${HOOFD_OMGEVING} brak ${HOOFD_PCT}% van het doek af in ${HOOFDTEST.duur}, gemeten volgens ${HOOFDTEST.norm}.`,
  },
  {
    q: "Geven jullie vlaggen minder microplastics af dan gewone vlaggen?",
    a: "Nee, en dat willen we eerlijk zeggen. Het doek is polyester en slijt net zo hard. Het CiCLO®-additief verandert niets aan hoeveel vezels er tijdens gebruik loslaten. Wat het wel verandert: die losgeraakte vezels breken af in plaats van te blijven liggen.",
  },
  {
    q: "Wat krijg ik precies mee als onderbouwing?",
    a: "Bij elke bestelling: OEKO-TEX ECO PASSPORT-certificering, de ASTM-testresultaten voor bodem, zeewater, rioolslib en stortplaats, en een productspecificatie met alle relevante gegevens. Accountants en inkopers herkennen deze certificeringen.",
  },
  {
    q: "Zijn jullie vlaggen veel duurder?",
    a: "Slechts enkele euro's per stuk meer dan traditioneel polyester. Daar staat tegenover dat je de onderbouwing meteen op orde hebt, en dat je klanten houdt die om duurzame leveranciers vragen.",
  },
  {
    q: "Hoe snel kan ik mijn vlaggen krijgen?",
    a: "Standaard circa 3 werkdagen na goedkeuring van je ontwerp. Haast? Rush-orders zijn mogelijk, neem even contact op.",
  },
];

/** Het directe antwoord bovenaan; zie het gelijknamige blok in microplastics. */
const KORT_ANTWOORD = [
  "De CSRD verplicht grote bedrijven te rapporteren over hun milieu-impact, en onder ESRS E2-5 valt daar uitstoot van microplastics onder. Polyester vlaggen zijn daar een bron van, want ze laten door wind, zon en regen continu deeltjes los.",
  `Val je er zelf niet direct onder, dan raakt het je alsnog via je klanten: die moeten óók over hun leveranciers rapporteren en vragen die data bij jou op. Een vlag van Flag-CiCLO® brak in ${HOOFD_OMGEVING} voor ${HOOFD_PCT}% af in ${HOOFDTEST.duur} en komt met OEKO-TEX ECO PASSPORT-certificering en ASTM-testresultaten die je direct in je verslag kunt gebruiken.`,
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
    { naam: "CSRD", pad: PAD },
  ]),
);

const FAQ_JSON_LD = jsonLd(faqJsonLd(FAQ));

export default function CsrdCompliancePage() {
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
              Kennisbank · CSRD
            </Link>
            <h1 id="hero-title" className={styles.heroTitle}>
              Geldt de CSRD <span className={styles.heroAccent}>voor jou</span>?
            </h1>
            <p className={styles.heroSub}>
              Waarschijnlijk niet. Sinds het Omnibus-pakket van december 2025
              geldt de CSRD alleen boven 1.000 medewerkers en 450 miljoen euro
              omzet. Maar lever je aan een bedrijf dat er wel onder valt, dan
              krijg je de vraag over duurzame inkoop alsnog.
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
              <span className={styles.heroStatValue}>1.000+</span>
              <span className={styles.heroStatLabel}>
                Medewerkers voor de plicht
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>450 mln</span>
              <span className={styles.heroStatLabel}>Euro omzetgrens</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{HOOFD_PCT}%</span>
              <span className={styles.heroStatLabel}>
                Afgebroken in {HOOFD_OMGEVING}
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
              Zoek de groep waar je in valt. De rapportageplicht zelf raakt maar
              een klein aantal bedrijven. De vraag die eruit voortkomt, reist
              wel de hele keten door.
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
            <h2 id="consequences-title">Wat betekent dit in de praktijk?</h2>
            <p className="lead">
              Geen paniekverhaal over boetes die niet voor jou gelden. Wel het
              verschil tussen een leverancier die de vraag kan beantwoorden en
              een die dat niet kan.
            </p>
          </div>
          <div className={styles.compare}>
            <div className={`${styles.compareCard} ${styles.compareBad}`}>
              <span className={styles.compareTag}>Zonder dossier</span>
              <h3>Je moet het gaan uitzoeken</h3>
              <ul className={styles.compareList}>
                <li>Je weet niet wat er in je vlaggen zit</li>
                <li>De vraag van je opdrachtgever blijft liggen</li>
                <li>Je mist aanbestedingen die om onderbouwing vragen</li>
                <li>Je claims op je eigen site zijn niet te staven</li>
              </ul>
            </div>
            <div className={`${styles.compareCard} ${styles.compareGood}`}>
              <span className={styles.compareTag}>Met dossier</span>
              <h3>Je hebt gewoon een antwoord</h3>
              <ul className={styles.compareList}>
                <li>Testresultaten en certificaten liggen klaar</li>
                <li>Je houdt klanten die om gegevens vragen</li>
                <li>Je kunt meedoen aan duurzame aanbestedingen</li>
                <li>Wat je zegt over je vlaggen is nagerekend</li>
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
              Drie redenen waarom ondernemers voor onze duurzame vlaggen kiezen.
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
          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3>Over dat percentage</h3>
              <p>
                Het doek is getest in vier omgevingen, volgens internationale
                ASTM-normen. In {HOOFD_OMGEVING} brak {HOOFD_PCT}% van het doek
                af in {HOOFDTEST.duur} ({HOOFDTEST.norm}). Onbehandeld polyester
                kwam in dezelfde test niet verder dan{" "}
                {pctNl(HOOFDTEST.referentiePct ?? 0)}%.
              </p>
              <Link href={ONDERBOUWING_PAD} className={styles.arrowLink}>
                {ONDERBOUWING_LINK_TEKST} <ArrowRight size={16} />
              </Link>
            </div>
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
              Van bestelling naar een compleet dossier in vier stappen.
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
                Flag-CiCLO®-vlaggen en je ontvangt de certificaten en
                testresultaten erbij. Dan heb je een antwoord klaarliggen als
                een opdrachtgever ernaar vraagt.
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
