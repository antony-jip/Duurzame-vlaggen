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
    "Geen marketingclaims maar labresultaten: ASTM afbraaktests in grond, water en op stortplaatsen, plus OEKO-TEX ECO PASSPORT en EU REACH. Bekijk alle certificeringen.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Afbraaktests per omgeving, volgens internationale ASTM-normen.
const TESTS = [
  {
    kicker: "ASTM D5988",
    title: "In de grond",
    body: "Begraven in vruchtbare aarde, onder gecontroleerde labcondities.",
    value: "91% afbraak",
  },
  {
    kicker: "ASTM D5511",
    title: "Op stortplaatsen",
    body: "Zonder zuurstof, zoals echt afval op een stortlocatie.",
    value: "91% afbraak",
  },
  {
    kicker: "ASTM D5210",
    title: "In rioolwaterzuivering",
    body: "De omgeving waar waswater uiteindelijk terechtkomt.",
    value: "90% afbraak",
  },
  {
    kicker: "ASTM D6691",
    title: "In zeewater",
    body: "Getest met echte mariene micro-organismen.",
    value: "Versnelde afbraak",
  },
];

// Veiligheids- en milieucertificaten.
const CERTS = [
  {
    icon: <ShieldCheck size={24} />,
    title: "OEKO-TEX® ECO PASSPORT",
    body: "Onafhankelijk bewijs dat elke grondstof en elk chemisch bestanddeel veilig is voor mens en milieu. Getest op ruim 100 schadelijke stoffen.",
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
              deeltjes achter. Onze vlaggen breken volledig af. Net als een
              blad op de bosbodem. Geen mooie marketingpraatjes: erkende
              laboratoria hebben het materiaal meer dan drie jaar getest in
              grond, water en compost.
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
              <span className={styles.heroStatValue}>96%</span>
              <span className={styles.heroStatLabel}>Volledig afgebroken</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>3+ jaar</span>
              <span className={styles.heroStatLabel}>Getest</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>4</span>
              <span className={styles.heroStatLabel}>Testomgevingen</span>
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

      {/* AFBRAAKTESTS — vier omgevingen met labresultaat. */}
      <section className={styles.section} aria-labelledby="tests-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Afbraaktests</Badge>
            <h2 id="tests-title">Getest volgens internationale normen.</h2>
            <p className="lead">
              Onafhankelijke laboratoria testten het materiaal in vier
              omgevingen, volgens genormeerde ASTM methodes. Overal dezelfde
              conclusie: het breekt echt af.
            </p>
          </div>
          <div className={`${styles.cardGrid} ${styles.cardGrid4}`}>
            {TESTS.map((test) => (
              <div key={test.title} className={styles.card}>
                <span className={styles.cardKicker}>{test.kicker}</span>
                <h3>{test.title}</h3>
                <p>{test.body}</p>
                <span className={styles.cardValue}>{test.value}</span>
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
                Het materiaal is letterlijk opgegeten door micro-organismen. De
                resterende paar procent is omgezet in biomassa (nieuwe cellen).
                Er blijft geen plastic over. Daarom claimen we 96%, en geen
                100%. Wij beloven niets dat we niet kunnen bewijzen.
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
