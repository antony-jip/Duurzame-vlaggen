import type { Metadata } from "next";
import Link from "next/link";
import styles from "../../info.module.css";
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
import {
  AFBRAAK_TESTS,
  CICLO_DISCLAIMER,
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, jsonLd } from "@/lib/seo";

/** Nederlandse schrijfwijze van een percentage: 94.2 wordt 94,2. */

const HOOFD_PCT = pctNl(HOOFDTEST.afbraakPct);
const HOOFD_OMGEVING = HOOFDTEST.omgeving.toLowerCase();
const REFERENTIE_PCT =
  HOOFDTEST.referentiePct === null ? null : pctNl(HOOFDTEST.referentiePct);

const PAD = "/kennisbank/microplastics";
const TITEL = "Microplastics uit vlaggen: wat helpt echt?";
const OMSCHRIJVING =
  "Waarom polyester vlaggen een bron van microplastics zijn. En eerlijk: ook een biologisch afbreekbare vlag geeft vezels af, maar die vezels breken wel af.";

export const metadata: Metadata = {
  alternates: { canonical: PAD },
  title: TITEL,
  description: OMSCHRIJVING,
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
    title: "De vraag komt uit je keten",
    body: "De grootste bedrijven rapporteren onder de CSRD over microplastics in hun keten. Ben je hun leverancier, dan komt die vraag bij jou terecht.",
  },
];

// Vier stappen om grip te krijgen op de microplastics uit je eigen materialen.
const STEPS = [
  {
    title: "Inventariseer je bronnen",
    body: "Breng in kaart welke materialen in je organisatie vezels kunnen afgeven, van vlaggen tot werkkleding.",
  },
  {
    title: "Verleng de levensduur",
    body: "Een vlag die langer heel blijft, slijt minder en geeft dus minder vezels af. Kies de juiste maat en haal hem binnen bij storm.",
  },
  {
    title: "Kies doek dat afbreekt",
    body: `Vezels die tijdens gebruik loslaten breken af in plaats van te blijven liggen. In ${HOOFD_OMGEVING} brak ${HOOFD_PCT}% van het Flag-CiCLO®-doek af in ${HOOFDTEST.duur} (${HOOFDTEST.code}).`,
  },
  {
    title: "Leg het vast",
    body: "Bewaar de testresultaten en certificaten in je inkoopdossier, zodat je ze paraat hebt als een opdrachtgever ernaar vraagt.",
  },
];

// De vier ASTM-uitkomsten, in de omgevingen waar afgegeven vezels terechtkomen.
const TESTS = AFBRAAK_TESTS;

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
    q: "Geeft een Flag-CiCLO®-vlag minder vezels af dan een gewone vlag?",
    a: "Nee. Het doek is polyester en slijt net zo hard als ander polyester. CiCLO® verandert niets aan hoeveel vezels er tijdens gebruik loslaten. Het verandert wat er daarna met die vezels gebeurt.",
  },
  {
    q: "Wat is het verschil met Flag-CiCLO®-vlaggen dan wel?",
    a: `Vezels die loslaten breken af in plaats van te blijven liggen. In ${HOOFD_OMGEVING} brak ${HOOFD_PCT}% van het doek af in ${HOOFDTEST.duur}, gemeten volgens ${HOOFDTEST.norm}. Onbehandeld polyester kwam in diezelfde test niet verder dan ${REFERENTIE_PCT}%.`,
  },
  {
    q: "Waarom claimen jullie geen nul microplastics?",
    a: "Omdat dat niet klopt. Een vlag van biologisch afbreekbaar polyester laat nog steeds vezels los in wind en regen. Wie iets anders beweert, verkoopt je een verhaal dat de test niet ondersteunt. Wij houden het bij wat er is gemeten.",
  },
  {
    q: "Moet ik microplastics rapporteren onder de CSRD?",
    a: "Alleen als je onder de CSRD valt, en sinds het Omnibus-pakket van december 2025 is dat pas vanaf 1.000 medewerkers én meer dan 450 miljoen euro omzet. Val je daar niet onder, dan geldt er geen rapportageplicht voor jou. Lever je aan een bedrijf dat er wel onder valt, dan krijg je de vraag alsnog. Met de testresultaten en certificaten heb je dan een antwoord.",
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
  `Die deeltjes verdwijnen niet meer. Ze zijn aangetroffen in menselijk bloed, longen en placenta's, en grote bedrijven moeten er sinds de CSRD over rapporteren onder ESRS E2-5. Een vlag van Flag-CiCLO® geeft evenveel vezels af als een gewone vlag, maar die vezels breken zelf wel af: in ${HOOFD_OMGEVING} ${HOOFD_PCT}% in ${HOOFDTEST.duur} (${HOOFDTEST.norm}).`,
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
    { naam: "Het microplastics-probleem", pad: PAD },
  ]),
);

const FAQ_JSON_LD = jsonLd(faqJsonLd(FAQ));

export default function MicroplasticsPage() {
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
              Kennisbank · Impact
            </Link>
            <h1 id="hero-title" className={styles.heroTitle}>
              Microplastics. De{" "}
              <span className={styles.heroAccent}>stille vervuiler</span>.
            </h1>
            <p className={styles.heroSub}>
              Elke dag komen miljoenen onzichtbare plastic deeltjes vrij in ons
              milieu. Ook uit vlaggen, ook uit de onze. Wat zijn microplastics,
              waarom vormen ze een probleem en wat lost een biologisch
              afbreekbare vlag nu echt op?
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

      {/* WAT ZIJN MICROPLASTICS */}
      <section className={styles.section} aria-labelledby="what-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Achtergrond</Badge>
            <h2 id="what-title">Onzichtbaar, maar overal aanwezig.</h2>
            <p className="lead">
              Microplastics zijn plastic deeltjes kleiner dan 5 millimeter. Ze
              ontstaan wanneer grotere plastic voorwerpen afbreken, of komen als
              vezels vrij bij slijtage van synthetisch materiaal zoals
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

      {/* WAT CiCLO WEL EN NIET DOET — het eerlijke onderscheid. */}
      <section className={styles.section} aria-labelledby="honest-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Eerlijk verhaal</Badge>
            <h2 id="honest-title">Wat een duurzame vlag wel en niet oplost.</h2>
            <p className="lead">
              Hier gaat het in de vlaggenbranche vaak mis. Een vlag van
              biologisch afbreekbaar polyester geeft nog steeds vezels af. Wind,
              zon en regen slijten het doek, en dat gaat door zolang de vlag
              hangt. CiCLO® verandert daar niets aan.
            </p>
            <p className="lead">
              Wat CiCLO® wel doet, zit in de vezel zelf. Het additief maakt de
              polyestervezel herkenbaar als voedsel voor bacteriën en schimmels.
              Vezels die tijdens gebruik loslaten breken daardoor af in plaats
              van te blijven liggen. Het verschil zit dus niet in de afgifte,
              maar in wat er daarna gebeurt.
            </p>
          </div>
          <div className={styles.compare}>
            <div className={`${styles.compareCard} ${styles.compareBad}`}>
              <span className={styles.compareTag}>Wat niet verandert</span>
              <h3>De afgifte tijdens gebruik</h3>
              <ul className={styles.compareList}>
                <li>Het doek is en blijft polyester</li>
                <li>Het slijt net zo hard als ander polyester</li>
                <li>Er laten vezels los in wind en regen</li>
                <li>Wij claimen daarom geen nul microplastics</li>
              </ul>
            </div>
            <div className={`${styles.compareCard} ${styles.compareGood}`}>
              <span className={styles.compareTag}>Wat wel verandert</span>
              <h3>De afbraak van die vezels</h3>
              <ul className={styles.compareList}>
                <li>Micro-organismen herkennen de vezel als voedsel</li>
                <li>
                  In {HOOFD_OMGEVING} brak {HOOFD_PCT}% van het doek af in{" "}
                  {HOOFDTEST.duur} ({HOOFDTEST.norm})
                </li>
                <li>
                  Onbehandeld polyester bleef in dezelfde test op{" "}
                  {REFERENTIE_PCT}% steken
                </li>
                <li>Wat overblijft is CO₂, water en biomassa</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* DE METINGEN — vier omgevingen waar afgegeven vezels terechtkomen. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="tests-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">De metingen</Badge>
            <h2 id="tests-title">Vier omgevingen, vier uitkomsten.</h2>
            <p className="lead">
              Afgegeven vezels komen in de bodem, in het water of op de
              stortplaats terecht. Het doek is in al die omgevingen getest
              volgens internationale ASTM-normen.
            </p>
          </div>
          <div className={`${styles.cardGrid} ${styles.cardGrid4}`}>
            {TESTS.map((test) => (
              <div key={test.norm} className={styles.card}>
                <span className={styles.cardKicker}>{test.norm}</span>
                <span className={styles.cardValue}>
                  {pctNl(test.afbraakPct)}%
                </span>
                <h3>{test.omgeving}</h3>
                <p>
                  {test.toelichting} Afgebroken in {test.duur}.{" "}
                  {test.referentiePct === null
                    ? "Onbehandeld polyester brak in deze test niet af."
                    : `Onbehandeld polyester kwam niet verder dan ${pctNl(test.referentiePct)}%.`}
                </p>
              </div>
            ))}
          </div>
          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3>Over deze cijfers</h3>
              <p>{CICLO_DISCLAIMER}</p>
              <Link href={ONDERBOUWING_PAD} className={styles.arrowLink}>
                {ONDERBOUWING_LINK_TEKST} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* WAT KUN JE DOEN — vier stappen. */}
      <section className={styles.section} aria-labelledby="steps-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Wat je kunt doen</Badge>
            <h2 id="steps-title">Wat kun jij doen?</h2>
            <p className="lead">
              Vier praktische stappen om de microplastics uit je eigen
              materialen terug te dringen.
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
          {/* Interne links met de producttermen als ankertekst. Wie hier landt
              op een microplastics-vraag wil bij stap 2 ("kies alternatieven")
              direct naar het juiste vlagtype kunnen. */}
          <p className={styles.verdieping}>
            Stap 2 begint bij het vlagtype dat je nu gebruikt: de{" "}
            <Link href="/collectie/baniervlag">baniervlag</Link> aan een
            baniermast, de <Link href="/collectie/mastvlag">mastvlag</Link> aan
            een staande mast, de{" "}
            <Link href="/collectie/gevelvlag">gevelvlag</Link> aan de muur of de{" "}
            <Link href="/collectie/beachvlag">beachvlag</Link> voor evenementen.
            Welk formaat je nodig hebt, staat in de{" "}
            <Link href="/kennisbank/vlaggen-kiezen">keuzegids</Link>.
          </p>
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
                Kies een vlag die minder microplastic achterlaat.
              </h2>
              <p className={styles.ctaSub}>
                Vezels die tijdens gebruik loslaten breken af in plaats van te
                blijven liggen. In {HOOFD_OMGEVING} brak {HOOFD_PCT}% van het
                doek af in {HOOFDTEST.duur} ({HOOFDTEST.norm}). De
                testresultaten en certificaten krijg je bij je bestelling.
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
