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
} from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/certificeringen" },
  title: "Certificeringen. Onafhankelijk getest",
  description:
    "Geen marketingclaims maar labresultaten: 91% afbraak in grond en 94% in zeewater volgens ASTM, tegenover 0% en 5% voor gewoon polyester. Plus OEKO-TEX en EU REACH.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

/**
 * Afbraaktests, één op één uit de labrapporten.
 *
 * Bron: Georg+Otto Friedrich, "Going Green by Friedrich · Level 3 · CiCLO®",
 * EN 01/2025, met testdata van onafhankelijke laboratoria volgens ASTM-methodes.
 *
 * Hier stonden eerder vier omgevingen, waaronder ASTM D5511 (stortplaats, 91%)
 * en ASTM D5210 (rioolzuivering, 90%). Die twee staan niet in de documentatie
 * die wij van de leverancier hebben, dus kunnen we ze niet onderbouwen en horen
 * ze hier niet. Twee tests die je kunt laten zien zijn meer waard dan vier die
 * je moet uitleggen.
 *
 * De vergelijking met onbehandeld polyester staat er nu bij. Dat contrast (0%
 * en 5%) is het eigenlijke argument: het gaat er niet om dat ons doek afbreekt,
 * maar dat gewoon polyester dat niet doet.
 */
const TESTS = [
  {
    kicker: "ASTM D5988",
    title: "In de grond",
    body: "Begraven in vruchtbare aarde met actief bodemleven, gemengd met compost. Gemeten over 1.171 dagen.",
    value: "91% afgebroken",
    vergelijking: "Onbehandeld polyester: 0%",
  },
  {
    kicker: "ASTM D6691-17",
    title: "In zeewater",
    body: "Getest met de micro-organismen die van nature in zeewater voorkomen. Gemeten over 1.362 dagen.",
    value: "94% afgebroken",
    vergelijking: "Onbehandeld polyester: 5%",
  },
];

// Veiligheids- en milieucertificaten.
const CERTS = [
  // Twee OEKO-TEX-certificaten op twee niveaus, en die hebben we hier eerder
  // door elkaar gehaald: ECO PASSPORT geldt voor de CiCLO®-grondstof, het
  // geweven doek zelf draagt STANDARD 100. Ze allebei "ECO PASSPORT" noemen is
  // onnauwkeurig richting precies het publiek dat dit nakijkt.
  {
    icon: <ShieldCheck size={24} />,
    title: "OEKO-TEX® ECO PASSPORT",
    body: "Geldt voor de CiCLO®-grondstof in de vezel: onafhankelijk bewijs dat de gebruikte chemie veilig is voor mens en milieu.",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "STANDARD 100 by OEKO-TEX®",
    body: "Geldt voor het geweven vlaggendoek, in productklasse 2 (direct huidcontact). Getest op een lange lijst schadelijke stoffen.",
  },
  {
    icon: <Check size={24} />,
    title: "EU REACH",
    body: "Voldoet aan de Europese verordening voor veilig gebruik van chemische stoffen. Geen giftige bestanddelen.",
  },
  {
    icon: <Leaf size={24} />,
    title: "Veilig voor zeedieren",
    body: "Onafhankelijk getest op toxiciteit voor marien leven. De afbraakproducten zijn onschadelijk: CO₂, water en biomassa.",
  },
];

export default function CertificeringenPage() {
  return (
    <>
      {/* HERO — bewijs boven beloftes. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<ShieldCheck size={16} />}
              className={styles.heroEyebrow}
            >
              Onafhankelijk getest
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Vlaggen die <span className={styles.heroAccent}>écht</span>{" "}
              verdwijnen.
            </h1>
            <p className={styles.heroSub}>
              Gewone vlaggen zijn van plastic en laten bij slijtage duizenden
              deeltjes achter. Onze vlaggen breken af. Geen mooie
              marketingpraatjes: erkende laboratoria hebben het materiaal ruim
              drie jaar lang gemeten in grond en in zeewater, naast een monster
              gewoon polyester ter vergelijking.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="/contact"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Vraag documentatie aan
              </Button>
              <Link href="/materiaal" className={styles.heroLink}>
                Hoe werkt het materiaal?
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>91%</span>
              <span className={styles.heroStatLabel}>Afgebroken in grond</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>94%</span>
              <span className={styles.heroStatLabel}>
                Afgebroken in zeewater
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>3+ jaar</span>
              <span className={styles.heroStatLabel}>Onafgebroken gemeten</span>
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

      {/* AFBRAAKTESTS — de twee omgevingen waar we het rapport van hebben. */}
      <section className={styles.section} aria-labelledby="tests-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Afbraaktests</Badge>
            <h2 id="tests-title">Getest volgens internationale normen.</h2>
            <p className="lead">
              Onafhankelijke laboratoria testten het materiaal jarenlang
              volgens genormeerde ASTM-methodes, naast een monster gewoon
              polyester. Dat tweede cijfer is de kern: ons doek breekt af, het
              vergelijkingsmateriaal blijft vrijwel onaangetast liggen.
            </p>
          </div>
          <div className={styles.cardGrid}>
            {TESTS.map((test) => (
              <div key={test.title} className={styles.card}>
                <span className={styles.cardKicker}>{test.kicker}</span>
                <h3>{test.title}</h3>
                <p>{test.body}</p>
                <span className={styles.cardValue}>{test.value}</span>
                <span className={styles.cardVergelijking}>
                  {test.vergelijking}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <Recycle size={20} />
            </span>
            <div>
              <h3>Wat betekent 90%+ afbraak?</h3>
              <p>
                Het materiaal is letterlijk opgegeten door micro-organismen. In
                dit type test (respirometrie) geldt 90% of meer als volledige
                afbraak; de rest is omgezet in biomassa, oftewel nieuwe cellen.
                Aanvullende analyse bevestigt dat er geen microplastics
                achterblijven. Daarom noemen we de gemeten waarden en niet
                honderd procent. Wij beloven niets dat we niet kunnen bewijzen.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* VEILIGHEIDSCERTIFICATEN */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="certs-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Veiligheidscertificaten</Badge>
            <h2 id="certs-title">Onafhankelijk gekeurd en goedgekeurd.</h2>
            <p className="lead">
              Het materiaal is getest op schadelijke stoffen en voldoet aan de
              strengste internationale normen. Veilig voor mens, dier én
              natuur.
            </p>
          </div>
          <div className={styles.cardGrid}>
            {CERTS.map((cert) => (
              <div key={cert.title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {cert.icon}
                </span>
                <h3>{cert.title}</h3>
                <p>{cert.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* GEEN MICROPLASTICS — hoe dat werkt, kort. */}
      <section className={styles.section} aria-labelledby="how-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Geen microplastics</Badge>
            <h2 id="how-title">Hoe het werkt, in drie zinnen.</h2>
            <p className="lead">
              CiCLO® technologie zit verwerkt in de vezels zelf.
              Micro-organismen herkennen het materiaal daardoor als voedsel en
              eten de vezels op, net als natuurlijk materiaal. Wat overblijft:
              water, CO₂ en biomassa. Geen plastic.
            </p>
            <Link
              href="/kennisbank/flag-ciclo-technologie"
              className={styles.arrowLink}
            >
              Verdiep je in de technologie <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Duurzaam wapperen, zwart op wit.
              </h2>
              <p className={styles.ctaSub}>
                Vraag de certificaten en testrapporten op voor je
                duurzaamheidsverslag of aanbesteding. We sturen ze dezelfde
                werkdag nog toe.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/contact"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Vraag documentatie aan
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
