import type { Metadata } from "next";
import { isValidElement, type ReactNode } from "react";
import Link from "next/link";
import styles from "../info.module.css";
import { jsonLd } from "@/lib/seo";
import {
  Badge,
  Button,
  Container,
  ArrowRight,
  Check,
  Leaf,
  Recycle,
  ShieldCheck,
  Truck,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Veelgestelde vragen",
  description:
    "Eerlijke antwoorden over Flag-CiCLO®-technologie, CSRD-rapportage, bestellen, levertijden, formaten en duurzaamheid. Vraag niet beantwoord? We reageren binnen 24 uur.",
  alternates: { canonical: "/veelgestelde-vragen" },
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

interface FaqItem {
  q: string;
  a: ReactNode;
}

interface FaqGroup {
  icon: ReactNode;
  title: string;
  items: FaqItem[];
}

const GROUPS: FaqGroup[] = [
  {
    icon: <Recycle size={20} />,
    title: "Flag-CiCLO® technologie",
    items: [
      {
        q: "Wat is Flag-CiCLO® precies?",
        a: (
          <>
            <p>
              Flag-CiCLO® is onze naam voor vlaggen gemaakt met
              CiCLO®-technologie: tijdens het spinnen van de polyestervezel
              worden biologisch afbreekbare &ldquo;spots&rdquo; toegevoegd. Die
              werken als voedingsbron voor micro-organismen.
            </p>
            <p>
              Zodra de vlag na afdanking in contact komt met grond, compost,
              zeewater of een stortplaats, breken die organismen de vezels af.
              Het resultaat: 96% afbraak in 2 tot 3 jaar, zonder microplastics.
              Je vlag gedraagt zich dus normaal, maar lost op als je hem
              weggooit.
            </p>
            <Link href="/kennisbank/flag-ciclo-technologie">
              Lees meer over de technologie
            </Link>
          </>
        ),
      },
      {
        q: "Hoe lang gaat zo'n vlag mee?",
        a: (
          <p>
            In normaal gebruik 3 tot 4 maanden. Precies even lang als
            traditionele polyester vlaggen. De kleuren zijn tot 2 jaar
            UV-bestendig. En nee: je vlag breekt niet af terwijl hij aan de mast
            hangt. Dat proces start pas na afdanking, in contact met
            micro-organismen.
          </p>
        ),
      },
      {
        q: "Is de printkwaliteit net zo goed?",
        a: (
          <p>
            Ja, identiek. Flag-CiCLO®-doek gedraagt zich precies als standaard
            polyester: dezelfde printkwaliteit, kleuren en stevigheid. Het
            enige verschil is wat er na afdanking gebeurt. En dat ziet niemand
            behalve je duurzaamheidsverslag.
          </p>
        ),
      },
      {
        q: "Welke certificeringen heeft Flag-CiCLO®?",
        a: (
          <>
            <p>
              De technologie is onafhankelijk getest en gecertificeerd:
              OEKO-TEX® ECO PASSPORT (ecologisch verantwoord), EU REACH
              (chemicaliënverordening) en ASTM D5988, D5511, D5210 en D6691
              (geteste afbraak in grond, stortplaats, rioolwater en zee).
              Onafhankelijke labs hebben dit bevestigd. Niet wij zelf.
            </p>
            <Link href="/certificeringen">Bekijk alle certificaten</Link>
          </>
        ),
      },
      {
        q: "Kan ik Flag-CiCLO®-vlaggen ook recyclen?",
        a: (
          <p>
            Ja. Het doek is volledig compatibel met bestaande
            polyester-textielrecycling. Je hebt dus twee verantwoorde opties:
            recyclen, of laten afbreken in de natuur.
          </p>
        ),
      },
    ],
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "CSRD en rapportage",
    items: [
      {
        q: "CSRD? Wat heeft dat met mijn vlaggen te maken?",
        a: (
          <>
            <p>
              De Corporate Sustainability Reporting Directive is EU-wetgeving
              die grote bedrijven verplicht te rapporteren over hun
              milieu-impact. Onder ESRS E2-5 ook over microplastics. Standaard
              polyester vlaggen laten microplastics achter, en dat moet je dus
              verantwoorden. Met Flag-CiCLO® is er simpelweg niets te
              rapporteren: 0% microplastic-residu.
            </p>
            <Link href="/csrd">Meer over CSRD</Link>
          </>
        ),
      },
      {
        q: "Krijg ik CSRD-certificaten van jullie?",
        a: (
          <p>
            Even eerlijk: CSRD is een rapportageplicht, geen certificering.
            &ldquo;CSRD-certificaten&rdquo; bestaan niet. Wat je van ons wél
            krijgt: productspecificaties van het Flag-CiCLO®-materiaal,
            informatie over de CiCLO®-technologie en certificeringen zoals
            OEKO-TEX® ECO PASSPORT. Precies de onderbouwing die je voor je
            rapportage nodig hebt.
          </p>
        ),
      },
      {
        q: "Wanneer moet ik hier iets mee? Is dit urgent?",
        a: (
          <p>
            Vanaf 2025 is CSRD verplicht voor grote bedrijven (250+
            werknemers); in de jaren daarna volgen steeds kleinere bedrijven.
            Slim om nu al over te stappen. Niet omdat het moet, maar omdat je
            dan geen haast hebt. En haast maakt duur.
          </p>
        ),
      },
      {
        q: "Wat is ESRS E2-5?",
        a: (
          <p>
            ESRS E2-5 is de European Sustainability Reporting Standard voor
            &ldquo;substances of concern&rdquo;: zorgwekkende stoffen,
            waaronder microplastics. Flag-CiCLO®-vlaggen helpen je onder deze
            standaard te rapporteren dat je textiel geen microplastics
            achterlaat na afdanking.
          </p>
        ),
      },
    ],
  },
  {
    icon: <Truck size={20} />,
    title: "Bestellen en levering",
    items: [
      {
        q: "Hoe snel heb ik mijn vlaggen?",
        a: (
          <p>
            Standaard leveren we circa 3 werkdagen na goedkeuring van je
            ontwerp. Bij complexe custom designs kan het iets langer duren.
            Haast? Rush-orders zijn mogelijk. Neem even contact op.
          </p>
        ),
      },
      {
        q: "Wat kost het?",
        a: (
          <p>
            Flag-CiCLO®-vlaggen zijn slechts enkele euro's duurder per stuk
            dan traditionele polyester vlaggen. Bij zakelijke volumes is het
            prijsverschil verwaarloosbaar. En je krijgt er CSRD-proof
            documentatie bij.
          </p>
        ),
      },
      {
        q: "Kan ik mijn eigen ontwerp uploaden?",
        a: (
          <p>
            Absoluut. Upload je logo of ontwerp tijdens het bestellen; wij
            maken een visueel voorstel ter goedkeuring voordat de productie
            start. Geen ontwerp? Wij kunnen ook voor je ontwerpen.
          </p>
        ),
      },
      {
        q: "Is er een minimum bestelhoeveelheid?",
        a: (
          <p>
            Nee, je bestelt al vanaf 1 stuk. Wel geldt: hoe meer je bestelt,
            hoe gunstiger de stuksprijs. Begin gerust klein en schaal op als je
            tevreden bent.
          </p>
        ),
      },
    ],
  },
  {
    icon: <Check size={20} />,
    title: "Producten en formaten",
    items: [
      {
        q: "Welke soorten vlaggen leveren jullie?",
        a: (
          <>
            <p>
              Alle gangbare types in Flag-CiCLO®-materiaal: mastvlaggen,
              gevelvlaggen, baniervlaggen en beachvlaggen. Speciale formaten
              kunnen op aanvraag.
            </p>
            <Link href="/collectie">Bekijk de collectie</Link>
          </>
        ),
      },
      {
        q: "Welke formaten mastvlaggen zijn er?",
        a: (
          <p>
            Standaardformaten zijn onder andere 100×150 cm, 150×225 cm en
            200×300 cm; afwijkende maten zijn mogelijk. Weet je niet welk
            formaat je nodig hebt? Meet je mast en wij adviseren gratis.
          </p>
        ),
      },
      {
        q: "Leveren jullie ook masten en accessoires?",
        a: (
          <>
            <p>
              Ja, naast vlaggen leveren we ook vlaggenmasten, met 5 tot 15 jaar
              breukgarantie afhankelijk van het type. Voor advies over de
              juiste combinatie van mast en vlag denken we graag mee.
            </p>
            <Link href="/collectie/vlaggenmast">Bekijk vlaggenmasten</Link>
          </>
        ),
      },
    ],
  },
  {
    icon: <Leaf size={20} />,
    title: "Duurzaamheid en milieu",
    items: [
      {
        q: "96%? Waarom niet 100%?",
        a: (
          <p>
            96% van het textiel lost volledig op in 2 tot 3 jaar; de overige 4%
            wordt omgezet in onschadelijke biomassa. Er blijven geen
            microplastics achter. We claimen geen 100%, omdat dat niet klopt. Wij
            beloven niets dat we niet kunnen bewijzen.
          </p>
        ),
      },
      {
        q: "Wat is er mis met gewone polyester vlaggen?",
        a: (
          <>
            <p>
              Traditionele polyester vlaggen zijn van plastic. Bij slijtage
              door wind, regen en zon komen continu microplastic-vezels vrij
              die in grondwater, oceanen en ecosystemen terechtkomen. En daar
              honderden jaren blijven.
            </p>
            <Link href="/kennisbank/microplastics">
              Lees meer over microplastics
            </Link>
          </>
        ),
      },
      {
        q: "Waar breekt de vlag precies af?",
        a: (
          <p>
            Het afbraakproces start bij contact met micro-organismen: in grond
            of aarde, compost, zeewater, rioolwaterzuivering en op
            stortplaatsen. Aan de mast of in de kast gebeurt er niets.
          </p>
        ),
      },
      {
        q: "Is dit niet gewoon greenwashing?",
        a: (
          <>
            <p>
              Goede vraag, fijn dat je kritisch bent. Nee: de
              CiCLO®-technologie is onafhankelijk getest door ASTM-labs, niet
              door ons. Het materiaal is niet-toxisch voor marien leven en de
              afbraakproducten zijn onschadelijk: CO₂, water en biomassa. De
              OEKO-TEX® ECO PASSPORT-certificering bevestigt dit.
            </p>
            <Link href="/certificeringen">Bekijk de bewijzen</Link>
          </>
        ),
      },
    ],
  },
];

/** Zet een JSX-antwoord om naar platte tekst voor de FAQPage-structured data. */
function answerToText(node: ReactNode): string {
  const collect = (n: ReactNode): string => {
    if (n === null || n === undefined || typeof n === "boolean") return "";
    if (typeof n === "string" || typeof n === "number") return String(n);
    if (Array.isArray(n)) return n.map(collect).join(" ");
    if (isValidElement(n)) {
      return collect((n.props as { children?: ReactNode }).children);
    }
    return "";
  };
  return collect(node).replace(/\s+/g, " ").trim();
}

// FAQPage-structured data uit dezelfde bron als de zichtbare vragen — één
// waarheid, geen duplicaat-content die uit de pas kan lopen.
const FAQ_JSON_LD = jsonLd({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: answerToText(item.a),
      },
    })),
  ),
});

export default function VeelgesteldeVragenPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: FAQ_JSON_LD }}
      />
      {/* HERO — compact, alleen copy. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={`${styles.heroInner} ${styles.heroSingle}`}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<Check size={16} />}
              className={styles.heroEyebrow}
            >
              Veelgestelde vragen
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Alles wat je wilt <span className={styles.heroAccent}>weten</span>
              .
            </h1>
            <p className={styles.heroSub}>
              Geen juridische muurtjes, geen omwegen. Gewoon eerlijke antwoorden
              op de vragen die je hebt. En op de vragen die je misschien nog niet
              wist te stellen.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="/contact"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Liever persoonlijk? Neem contact op
              </Button>
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

      {/* FAQ-GROEPEN — accordions per thema. */}
      <section className={styles.section} aria-label="Vragen per onderwerp">
        <Container>
          {GROUPS.map((group) => (
            <div key={group.title} className={styles.faqGroup}>
              <h2 className={styles.faqGroupTitle}>
                <span className={styles.noteIcon} aria-hidden="true">
                  {group.icon}
                </span>
                {group.title}
              </h2>
              {group.items.map((item) => (
                <details key={item.q} className={styles.faq}>
                  <summary>{item.q}</summary>
                  <div className={styles.faqBody}>{item.a}</div>
                </details>
              ))}
            </div>
          ))}
        </Container>
      </section>

      {/* CTA — mensen, geen chatbots. */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Vraag niet beantwoord?
              </h2>
              <p className={styles.ctaSub}>
                Neem direct contact op. We reageren binnen 24 uur. Door een mens
                die je vraag leest en serieus neemt.
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
                <Link href="/kennisbank" className={styles.ctaLink}>
                  Verdiep je in de kennisbank
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
