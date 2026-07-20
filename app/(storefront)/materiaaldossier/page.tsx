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
  NoEntry,
  Recycle,
  ShieldCheck,
  Truck,
} from "@/components/ui";
import {
  AFBRAAK_TESTS,
  CICLO_DISCLAIMER,
  DOEK,
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";
import { articleJsonLd, breadcrumbJsonLd, jsonLd } from "@/lib/seo";

/**
 * Het materiaaldossier: de achtergrondpagina waar anderen naar kunnen linken.
 *
 * Bewust feitelijk en zonder verkooppraat. Hij legt uit wat polyester in het
 * milieu doet, wat een vlag daaraan bijdraagt en waar de technologie in ons doek
 * wel en niet iets aan verandert.
 *
 * Deze pagina dupliceert de claimpagina niet. De volledige testtabel staat op
 * `/afbreekbaarheid`; hier staat alleen een samenvatting met een verwijzing.
 * Alle cijfers komen uit `lib/claims/afbreekbaarheid.ts`, nooit hardgecodeerd,
 * en nooit zonder de norm, de omgeving en de termijn erbij (EU 2024/825).
 */

/** Nederlandse schrijfwijze van een percentage: 94.2 wordt 94,2. */

const HOOFD_PCT = pctNl(HOOFDTEST.afbraakPct);
const HOOFD_OMGEVING = HOOFDTEST.omgeving.toLowerCase();
const REFERENTIE_PCT =
  HOOFDTEST.referentiePct === null ? null : pctNl(HOOFDTEST.referentiePct);

const PAD = "/materiaaldossier";
const TITEL = "Materiaaldossier vlaggendoek. Wat polyester doet in het milieu";
const OMSCHRIJVING =
  "Feitelijk dossier over vlaggendoek van polyester: wat er na weggooien werkelijk gebeurt, waarom elke geweven vlag vezels afgeeft, en wat biologisch afbreekbaar polyester daar wel en niet aan verandert. Met de grenzen van het onderzoek erbij.";

export const metadata: Metadata = {
  alternates: { canonical: PAD },
  title: TITEL,
  description: OMSCHRIJVING,
};

// Gestructureerde data: het dossier als artikel plus het kruimelpad. Titel en
// omschrijving komen uit dezelfde constanten als de metadata. Geen FAQPage: op
// deze pagina staat geen vraag-en-antwoordblok. Bewust ook geen aggregateRating
// of review, hier niet en nergens.
const ARTICLE_JSON_LD = jsonLd(
  articleJsonLd({ titel: TITEL, omschrijving: OMSCHRIJVING, pad: PAD }),
);

const BREADCRUMB_JSON_LD = jsonLd(
  breadcrumbJsonLd([
    { naam: "Home", pad: "/" },
    { naam: "Materiaaldossier vlaggendoek", pad: PAD },
  ]),
);

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

/* De drie realistische eindbestemmingen van een afgedankte polyester vlag. */
const EINDBESTEMMINGEN = [
  {
    icon: <Truck size={24} />,
    kop: "Verbranding",
    body: "In Nederland gaat het meeste restafval de verbrandingsoven in. Het doek verdwijnt daarmee als materiaal, maar de koolstof die in de vezel zat komt vrij als CO₂. Er blijft niets van de vlag over dat opnieuw bruikbaar is. Van de drie eindbestemmingen is dit de best beheerste, en tegelijk de meest definitieve.",
  },
  {
    icon: <Recycle size={24} />,
    kop: "Storten",
    body: "Wordt een vlag gestort of afgedekt met ander afval, dan ligt hij in een omgeving zonder zuurstof en met weinig licht. Gewoon polyester verteert daar niet. Het doek blijft als samenhangend materiaal aanwezig, en valt over lange tijd uiteen in steeds kleinere stukjes zonder ooit door micro-organismen te worden opgeruimd.",
  },
  {
    icon: <Leaf size={24} />,
    kop: "Zwerfafval",
    body: "Een vlag die van de mast waait, in een sloot belandt of langs de weg blijft liggen, komt nooit in een afvalstroom terecht. Daar doet zon, vorst en beweging het werk: het doek scheurt, rafelt en fragmenteert. Elk stukje dat losraakt is nog steeds polyester, alleen kleiner en moeilijker terug te vinden.",
  },
];

/* Wat CiCLO wel en niet doet. Dit onderscheid is de kern van de pagina. */
const WEL_NIET = [
  {
    icon: <Check size={24} />,
    kop: "Wat het wel doet",
    body: "CiCLO® brengt biologisch afbreekbare domeinen aan in de polyestervezel zelf. Micro-organismen herkennen die plekken als voedsel en krijgen daarmee een aangrijpingspunt op een materiaal dat ze normaal laten liggen. Vanaf dat punt eten ze zich verder door de vezel heen. Dat is wat de vier ASTM-tests hieronder meten.",
  },
  {
    icon: <NoEntry size={24} />,
    kop: "Wat het niet doet",
    body: "De technologie verandert niets aan de hoeveelheid vezels die een vlag tijdens gebruik loslaat. Het doek is en blijft polyester, het slijt even hard en het rafelt even snel. Wie een vlag van dit doek ophangt, hangt geen vlag op die minder vezels afgeeft. Hij hangt een vlag op waarvan de afgegeven vezels een andere afloop hebben.",
  },
];

export default function MateriaaldossierPage() {
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
      {/* HERO — dossier, geen aanbod. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<ShieldCheck size={16} />}
              className={styles.heroEyebrow}
            >
              Achtergronddossier
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Materiaaldossier vlaggendoek.{" "}
              <span className={styles.heroAccent}>
                Wat polyester werkelijk doet.
              </span>
            </h1>
            <p className={styles.heroSub}>
              Dit is geen aanbod maar een dossier. Het beschrijft wat er met een
              polyester vlag gebeurt nadat je hem weggooit, waarom elke geweven
              vlag vezels afgeeft zolang hij hangt, en wat biologisch
              afbreekbaar vlaggendoek daar wel en niet aan verandert. Ook de
              punten waarop het onderzoek geen antwoord geeft staan erin.
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
              <Link href="/materiaal" className={styles.heroLink}>
                Over het doek zelf
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerngegevens">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{DOEK.merk}</span>
              <span className={styles.heroStatLabel}>
                Het doek in dit dossier
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>
                {AFBRAAK_TESTS.length}
              </span>
              <span className={styles.heroStatLabel}>
                Geteste omgevingen volgens ASTM
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{HOOFD_PCT}%</span>
              <span className={styles.heroStatLabel}>
                Afgebroken in {HOOFD_OMGEVING} in {HOOFDTEST.duur}
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

      {/* 1. WAT ER MET POLYESTER GEBEURT NA WEGGOOIEN */}
      <section className={styles.section} aria-labelledby="einde-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Na het weggooien</Badge>
            <h2 id="einde-title">
              Polyester verteert niet. Het wordt alleen kleiner.
            </h2>
            <p className="lead">
              Polyester is een kunststof. In de natuur bestaan nauwelijks
              organismen die de moleculaire ketens ervan als voedsel herkennen,
              en daarom verteert het materiaal niet zoals katoen of wol dat
              doen. Wat er wel gebeurt is fragmentatie: door zonlicht, warmte,
              vocht en mechanische beweging valt het doek uiteen in steeds
              kleinere deeltjes. Die deeltjes zijn chemisch nog altijd
              polyester. Ze zijn alleen te klein geworden om nog op te ruimen.
            </p>
            <p className="lead">
              Voor een afgedankte vlag zijn er in de praktijk drie
              eindbestemmingen. Welke het wordt, hangt af van hoe de vlag zijn
              laatste dag doorbrengt.
            </p>
          </div>
          <div className={styles.cardGrid}>
            {EINDBESTEMMINGEN.map((item) => (
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

      {/* 2. WAT VLAGGEN SPECIFIEK DOEN */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="slijtage-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Tijdens het hangen</Badge>
            <h2 id="slijtage-title">
              Een vlag slijt in de buitenlucht, en geeft daarbij vezels af.
            </h2>
            <p className="lead">
              Een vlag verkeert in een uitzonderlijke situatie voor textiel. Hij
              hangt dag en nacht buiten, hij wordt niet beschut en hij beweegt
              vrijwel onophoudelijk. Twee krachten grijpen daarop aan.
            </p>
          </div>
          <div className={styles.prose}>
            <h3>UV-straling maakt de vezel bros</h3>
            <p>
              Ultraviolet licht breekt de moleculaire ketens in polyester
              langzaam af. Het doek verliest daardoor sterkte en elasticiteit,
              de kleur verschiet en het materiaal wordt brosser. Een brosse
              vezel breekt eerder dan een soepele.
            </p>
            <h3>Wind zorgt voor de mechanische belasting</h3>
            <p>
              Wapperen betekent dat het weefsel voortdurend buigt, klappert en
              langs zichzelf schuurt. Aan de vliegende zijde is die belasting
              het hoogst, wat je terugziet in het rafelen dat daar begint. Elke
              keer dat een verzwakte vezel breekt, komt een stukje textielvezel
              los.
            </p>
            <p>
              Dat is geen eigenschap van een bepaald merk of een bepaalde
              kwaliteit. Dit geldt voor élke geweven vlag, van welk materiaal en
              van welke leverancier ook. Een vlag die hangt, slijt. Een vlag die
              slijt, geeft vezels af. De enige variabelen zijn hoe snel dat gaat
              en wat er daarna met die vezels gebeurt.
            </p>
          </div>
        </Container>
      </section>

      {/* 3. WAT CiCLO WEL EN NIET DOET — de kern. */}
      <section className={styles.section} aria-labelledby="welniet-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">De kern van dit dossier</Badge>
            <h2 id="welniet-title">
              Afbraak versnellen is iets anders dan afgifte voorkomen.
            </h2>
            <p className="lead">
              Hier gaat het in deze markt het vaakst mis, en wij hebben die fout
              zelf ook gemaakt. Wie het onderscheid tussen deze twee dingen
              loslaat, komt vanzelf uit bij claims die de tests niet dragen.
            </p>
          </div>
          <div className={`${styles.cardGrid} ${styles.cardGrid2}`}>
            {WEL_NIET.map((item) => (
              <div key={item.kop} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <h3>{item.kop}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <NoEntry size={20} />
            </span>
            <div>
              <h3>Waarom dit onderscheid ertoe doet</h3>
              <p>
                Een leverancier die belooft dat zijn duurzame vlaggen niets
                achterlaten in de natuur, belooft iets wat geen enkel weefsel
                waar kan maken. Wat wél waar te maken is, is dat de vezels die
                loslaten door micro-organismen worden opgeruimd in plaats van
                onbeperkt te blijven liggen. Dat is een kleinere belofte, maar
                het is er wel een die met testrapporten te onderbouwen is.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. DE VIER TESTS — samenvatting, niet de volledige tabel. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="tests-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Het onderzoek</Badge>
            <h2 id="tests-title">
              Vier ASTM-tests op biologisch afbreekbaar vlaggendoek.
            </h2>
            <p className="lead">
              Onafhankelijke laboratoria hebben het doek in vier omgevingen
              getest, telkens naast een controlemonster van onbehandeld
              polyester. In {HOOFD_OMGEVING} brak {HOOFD_PCT}% van het materiaal
              af in {HOOFDTEST.duur}, gemeten volgens {HOOFDTEST.norm}
              {REFERENTIE_PCT === null
                ? "."
                : `; het onbehandelde referentiemonster kwam in diezelfde test en dezelfde termijn niet verder dan ${REFERENTIE_PCT}%.`}{" "}
              De andere drie omgevingen staan hieronder samengevat.
            </p>
          </div>
          <div className={styles.prose}>
            <ul>
              {AFBRAAK_TESTS.map((test) => (
                <li key={test.norm}>
                  <strong>{test.omgeving}</strong> ({test.norm}):{" "}
                  {pctNl(test.afbraakPct)}% afgebroken in {test.duur}.{" "}
                  {test.toelichting}
                </li>
              ))}
            </ul>
            <p>
              De volledige tabel, met de testduur in dagen en de uitkomst van
              het onbehandelde referentiemonster per omgeving, staat op de
              claimpagina. Die tabel herhalen we hier bewust niet, zodat er maar
              één plek is waar de cijfers vandaan komen.
            </p>
            <p>
              <Link href={ONDERBOUWING_PAD} className={styles.arrowLink}>
                {ONDERBOUWING_LINK_TEKST} <ArrowRight size={16} />
              </Link>
            </p>
          </div>
        </Container>
      </section>

      {/* 5. DE GRENZEN */}
      <section className={styles.section} aria-labelledby="grenzen-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Grenzen van het onderzoek</Badge>
            <h2 id="grenzen-title">Waar deze cijfers ophouden.</h2>
            <p className="lead">
              Een dossier dat alleen de gunstige kant beschrijft is geen
              dossier. Vier dingen horen erbij.
            </p>
          </div>
          <div className={styles.prose}>
            <h3>Een testvat is geen berm</h3>
            <p>
              {CICLO_DISCLAIMER} In het laboratorium zijn temperatuur,
              vochtigheid en de aanwezige micro-organismen constant gehouden.
              Een vlag die langs een weg belandt ligt in de vrieskou, dan weer
              in de zon, soms droog en soms nat, en op de ene plek zit een heel
              andere microbiologie dan op de andere. Lees de gemeten termijnen
              dus als wat er onder gunstige omstandigheden mogelijk is, niet als
              een voorspelling voor een specifieke plek.
            </p>
            <h3>Dit is geen compostering</h3>
            <p>
              De tests hierboven meten biologische afbraak over jaren, in
              zeewater, bodem, stortplaats en rioolslib. Compostering is iets
              anders: andere normen, hogere temperaturen en termijnen van weken
              tot maanden. Het doek voldoet daar niet aan, de licentiegever van
              de technologie verbiedt die claim uitdrukkelijk, en een afgedankte
              vlag hoort dus niet op de composthoop of in de gft-bak.
            </p>
            <h3>De resterende paar procent</h3>
            <p>
              Geen van de vier tests komt op honderd procent uit. In{" "}
              {HOOFD_OMGEVING} bleef na {HOOFDTEST.duur} een kleine rest over,
              en in de andere omgevingen ligt die rest iets hoger. Wat er
              precies van die rest overblijft en hoe lang die er nog over doet,
              is met deze testopzet niet vastgesteld. Wij rapporteren daarom de
              gemeten uitkomst en niet een afronding naar boven.
            </p>
            <h3>Wat geen enkele afbraaktest meet</h3>
            <p>
              De belangrijkste milieuwinst bij vlaggen zit waarschijnlijk niet
              in de afbraak maar in de levensduur. Een vlag die twee seizoenen
              langer heel blijft, hoeft in die periode niet te worden vervangen,
              en dat scheelt een volledige productie en een transport. Dat is
              winst die in geen enkele ASTM-test terugkomt, omdat die tests
              alleen kijken naar wat er met het materiaal gebeurt nadat het is
              afgedankt. Wie een duurzame vlag zoekt, doet er daarom goed aan
              eerst naar afwerking, maatvoering en onderhoud te kijken, en pas
              daarna naar de afbraakcijfers.
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
                De onderliggende rapporten inzien?
              </h2>
              <p className={styles.ctaSub}>
                De testrapporten, de herkomst van het doek en de certificaten
                zijn opvraagbaar, ook als je nog niets bestelt. Gebruik ze
                gerust om onze cijfers naast die van een andere leverancier te
                leggen.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/contact"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Vraag de rapporten op
                </Button>
                <Link href="/kennisbank" className={styles.ctaLink}>
                  Naar de kennisbank
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
