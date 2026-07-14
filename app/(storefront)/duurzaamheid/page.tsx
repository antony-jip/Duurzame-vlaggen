import type { Metadata } from "next";
import Image from "next/image";
import styles from "./page.module.css";
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
import { BRAND_IMAGES } from "@/lib/catalog/products";

export const metadata: Metadata = {
  alternates: { canonical: "/duurzaamheid" },
  title: "Duurzaamheid. Flag-CiCLO® technologie",
  description:
    "Vlaggen die verdwijnen. Zero plastic. Onze Flag-CiCLO® vlaggen zijn 96% biologisch afbreekbaar in 2 tot 3 jaar, bevatten 0% microplastics en voldoen aan CSRD en ESRS E2-5.",
};

// The four-phase breakdown of how a Flag-CiCLO® flag returns to nature.
const PHASES = [
  {
    title: "In gebruik",
    body: "Wappert als elke topvlag. Kleurvast, weerbestendig, tot 2 jaar UV-stabiel. Functionele levensduur 3 tot 4 maanden intensief buiten.",
  },
  {
    title: "Start van de afbraak",
    body: "Vlag afgedankt? Nu hechten micro-organismen zich aan de vezels. De CiCLO® technologie opent de kunststofstructuur, zodat de natuur het materiaal herkent als voedsel.",
  },
  {
    title: "Actieve afbraak",
    body: "In de bodem of op de stortplaats breken bacteriën en schimmels de vezels in 1 tot 2 jaar verder af. Zonder één microplastische rest.",
  },
  {
    title: "Volledig opgelost",
    body: "96% is verdwenen. Wat rest is CO₂, water en biomassa. Geen microplastics, geen restafval. Totale doorlooptijd: 2 tot 3 jaar.",
  },
];

// The brand's own data moment — measured, not promised.
const STATS = [
  { value: "96%", label: "Biologisch afbreekbaar" },
  { value: "2 tot 3 jaar", label: "Tot volledig opgelost" },
  { value: "0%", label: "Microplastics" },
  { value: "3 tot 4 mnd", label: "Functionele levensduur" },
];

// Independent certifications backing the claims.
const CERTS = [
  {
    name: "OEKO-TEX ECO PASSPORT",
    body: "Onafhankelijk bewijs dat elke grondstof en elk chemisch bestanddeel veilig is voor mens en milieu.",
  },
  {
    name: "ASTM D5988",
    body: "Genormeerde labtest voor biologische afbreekbaarheid in de bodem. De basis onder onze claim van 96%.",
  },
  {
    name: "ASTM D5511",
    body: "Genormeerde labtest voor afbraak onder anaerobe (stort)omstandigheden.",
  },
  {
    name: "REACH",
    body: "Voldoet aan de Europese verordening voor veilig gebruik van chemische stoffen.",
  },
];

// What CSRD / ESRS E2-5 means concretely for the customer.
const CSRD_POINTS = [
  {
    icon: <ShieldCheck size={26} />,
    title: "Niets te rapporteren",
    body: "Onze vlaggen lossen op. 96% verdwijnt volledig, zonder microplastics. Er is dus geen uitstoot om onder ESRS E2-5 te verantwoorden.",
  },
  {
    icon: <Check size={26} />,
    title: "Documentatie inbegrepen",
    body: "Bij elke bestelling ontvang je de documentatie voor ESRS E2-5 en de certificaten. Die neem je direct over in je duurzaamheidsverslag.",
  },
  {
    icon: <Leaf size={26} />,
    title: "Verifieerbaar, geen greenwashing",
    body: "Alle claims steunen op onafhankelijke ASTM labtests en internationale certificeringen. Controleerbaar door je accountant.",
  },
];

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

export default function DuurzaamheidPage() {
  return (
    <>
      {/* HERO — egaal forest vlak dat uit de header loopt; foto in de
          organische wapper-vorm, golf-overgang naar off-white. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<Recycle size={16} />}
              className={styles.heroEyebrow}
            >
              Flag-CiCLO® technologie
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Vlaggen die <span className={styles.heroAccent}>verdwijnen</span>.
              <br />
              Zero plastic.
            </h1>
            <p className={styles.heroSub}>
              Zelfde kwaliteit als je huidige vlag. Alleen lost deze op in de
              natuur. 96% biologisch afbreekbaar in 2 tot 3 jaar, 0%
              microplastics en klaar voor de CSRD.
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
              <a href="/contact" className={styles.ctaLink}>
                Vraag documentatie aan
              </a>
            </div>
          </div>

          <div className={styles.heroBlob}>
            <Image
              src={BRAND_IMAGES.fabricDetail.src}
              alt={BRAND_IMAGES.fabricDetail.alt}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
              className={styles.heroPhoto}
            />
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

      {/* FASEN — van wapperende vlag tot biomassa, genummerde merkchips. */}
      <section className={styles.section} aria-labelledby="how-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Hoe het werkt</Badge>
            <h2 id="how-title">Van wapperende vlag tot biomassa.</h2>
            <p className="lead">
              Flag-CiCLO® is biologisch afbreekbaar polyester. De vezel
              presteert als een gewone vlag. Alleen bevat hij een ingrediënt dat
              micro-organismen het materiaal volledig laat afbreken. In vier
              fasen.
            </p>
          </div>
          <div className={styles.phasesWrap}>
            {/* Wapper-lijn die de fasen verbindt en zichzelf tekent op scroll. */}
            <svg
              className={styles.phasesLine}
              viewBox="0 0 1200 44"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0,22 C150,44 300,0 450,22 C600,44 750,0 900,22 C1020,40 1120,12 1200,22"
                pathLength={1}
              />
            </svg>
            <ol className={styles.phases}>
              {PHASES.map((phase, i) => (
                <li key={phase.title} className={styles.phase}>
                  <span className={styles.phaseNum} aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3>{phase.title}</h3>
                  <p>{phase.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* DATA-BLOK — forest kleurblok tussen wapper-golven; de cijfers
          kolossaal, met zwevende glass stat-chips. Merkeigen data-moment. */}
      <section className={styles.dataBand} aria-labelledby="numbers-title">
        <svg
          className={styles.wave}
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={WAVE_PATH} fill="currentColor" />
        </svg>
        <div className={styles.dataBlock}>
          <Container className={styles.dataInner}>
            <span className={styles.dataEyebrow}>De cijfers</span>
            <h2 id="numbers-title" className={styles.dataTitle}>
              Onderbouwd. <span className={styles.dataAccent}>Niet beloofd.</span>
            </h2>
            <p className={styles.dataBody}>
              Elk getal is gemeten volgens internationale ASTM normen in een
              onafhankelijk laboratorium. Geen marketingclaim. Labresultaat.
            </p>
            <div className={styles.dataStats} aria-label="Kerncijfers">
              {STATS.map((stat) => (
                <div key={stat.label} className={styles.dataStat}>
                  <span className={styles.dataStatValue}>{stat.value}</span>
                  <span className={styles.dataStatLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
            <p className={styles.dataFootnote}>
              Afbreekbaarheid gemeten volgens ASTM D5988 (bodem) en ASTM D5511
              (anaeroob). Doorlooptijd afhankelijk van omgevingscondities.
            </p>
          </Container>
        </div>
        <svg
          className={`${styles.wave} ${styles.waveBottom}`}
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={WAVE_PATH} fill="currentColor" />
        </svg>
      </section>

      {/* CERTIFICERINGEN — clean merk-kaarten met gekantelde kleurchip. */}
      <section className={styles.section} aria-labelledby="certs-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Certificeringen</Badge>
            <h2 id="certs-title">Onafhankelijk getoetst.</h2>
            <p className="lead">
              We laten onze claims controleren door externe instanties. Zo weet
              je zeker dat &ldquo;duurzaam&rdquo; hier ook echt duurzaam
              betekent.
            </p>
          </div>
          <div className={styles.certsGrid}>
            {CERTS.map((cert) => (
              <div key={cert.name} className={styles.certCard}>
                <span className={styles.certIcon} aria-hidden="true">
                  <ShieldCheck size={24} />
                </span>
                <h3 className={styles.certName}>{cert.name}</h3>
                <p>{cert.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CSRD — forest-3 band met gekantelde kleurchips. */}
      <section
        className={`${styles.section} ${styles.csrdBand}`}
        aria-labelledby="csrd-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">CSRD &amp; ESRS E2-5</Badge>
            <h2 id="csrd-title">Wat dit betekent voor je verslag.</h2>
            <p className="lead">
              Onder de CSRD moeten bedrijven hun uitstoot van microplastics
              rapporteren. Kies je voor onze vlaggen, dan is die uitstoot er
              simpelweg niet.
            </p>
          </div>
          <div className={styles.csrdGrid}>
            {CSRD_POINTS.map((point) => (
              <div key={point.title} className={styles.csrdItem}>
                <span className={styles.csrdIcon} aria-hidden="true">
                  {point.icon}
                </span>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA — terracotta kleurblok, tweede merkkleur-moment. */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Duurzaam wapperen, zwart op wit.
              </h2>
              <p className={styles.ctaSub}>
                Vraag de certificaten en de documentatie voor ESRS E2-5 op. Of
                bestel direct een gratis staal van ons Flag-CiCLO® doek.
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
                <a href="/collectie" className={styles.ctaLink}>
                  Bekijk de collectie
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
