import type { Metadata } from "next";
import Image from "next/image";
import styles from "./page.module.css";
import { Badge, Button, Container, ArrowRight, Recycle } from "@/components/ui";
import { BRAND_IMAGES } from "@/lib/catalog/products";

export const metadata: Metadata = {
  alternates: { canonical: "/duurzaamheid" },
  title: "Duurzaamheid. Flag-CiCLO® technologie",
  description:
    "Vlaggen die verdwijnen. Zero plastic. Onze Flag-CiCLO® vlaggen zijn 96% biologisch afbreekbaar in 2 tot 3 jaar, bevatten 0% microplastics en voldoen aan CSRD en ESRS E2-5.",
};

/* The four-phase breakdown of how a Flag-CiCLO® flag returns to nature.
   Dezelfde vier foto's als in het verhaalblok op de homepage: één en dezelfde
   vlag, van strak tot niets. Hier staan ze bij de uitleg, daar bij de klap.
   Die twee moeten dus dezelfde vlag laten zien, anders klopt het verhaal niet. */
const PHASES = [
  {
    title: "In gebruik",
    body: "Wappert als elke topvlag. Kleurvast, weerbestendig, tot 2 jaar UV-stabiel. Functionele levensduur 3 tot 4 maanden intensief buiten.",
    src: "/levenscyclus/in-gebruik.webp",
    alt: "Nieuwe groene vlag met logo, wapperend tegen een blauwe lucht",
  },
  {
    title: "Start van de afbraak",
    body: "Vlag afgedankt? Nu hechten micro-organismen zich aan de vezels. De CiCLO® technologie opent de kunststofstructuur, zodat de natuur het materiaal herkent als voedsel.",
    src: "/levenscyclus/start-afbraak.webp",
    alt: "Dezelfde vlag, nu verbleekt en met rafelende randen",
  },
  {
    title: "Actieve afbraak",
    body: "In de bodem of op de stortplaats breken bacteriën en schimmels de vezels in 1 tot 2 jaar verder af. Zonder één microplastische rest.",
    src: "/levenscyclus/afbraak.webp",
    alt: "Een restje vlagdoek in het gras, het logo nog half leesbaar",
  },
  {
    title: "Volledig opgelost",
    body: "96% is verdwenen. Wat rest is CO₂, water en biomassa. Geen microplastics, geen restafval. Totale doorlooptijd: 2 tot 3 jaar.",
    src: "/levenscyclus/verdwenen.webp",
    alt: "Alleen nog gras en klaver: van de vlag is niets meer terug te vinden",
  },
];

// The brand's own data moment — measured, not promised.
const STATS = [
  { value: "96%", label: "Biologisch afbreekbaar" },
  { value: "2 tot 3 jaar", label: "Tot volledig opgelost" },
  { value: "0%", label: "Microplastics" },
  { value: "3 tot 4 mnd", label: "Functionele levensduur" },
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
                  {/* De foto draagt de fase, het nummer ligt erop. Vier keer
                      dezelfde vlag: dat zie je in één blik, en de tekst
                      eronder vult de details aan. */}
                  <span className={styles.phaseBeeld}>
                    <Image
                      src={phase.src}
                      alt={phase.alt}
                      width={500}
                      height={500}
                      sizes="(max-width: 1000px) 40vw, 220px"
                    />
                    <span className={styles.phaseNum} aria-hidden="true">
                      {i + 1}
                    </span>
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

      {/* Hier stonden een Certificeringen-blok ("Onafhankelijk getoetst") en een
          CSRD-blok ("Wat dit betekent voor je verslag"). Beide zijn eruit; ze
          hebben allebei hun eigen pagina (/certificeringen en /csrd) die vanuit
          de footer bereikbaar blijft. */}

      {/* SLOT — het weefgetouw waar het doek ontstaat, met de actie erop.
          Hier stond een terracotta CTA-blok ("Duurzaam wapperen, zwart op wit").
          Beeld en actie zitten nu in één band: dat scheelt de pagina een heel
          blok hoogte, en je ziet waar het doek vandaan komt in plaats van het te
          lezen. */}
      <section className={styles.weefBand} aria-labelledby="cta-title">
        <Image
          src="/vergelijking/doek-weven.webp"
          alt="Weefgetouw waarop honderden losse Flag-CiCLO-draden tot doek worden geweven"
          fill
          sizes="100vw"
          className={styles.weefFoto}
        />
        {/* Geen eigen golven meer. Die tekenden hun doorzichtige helft op de
            pagina-achtergrond, en die is off-white: precies de witte randen.
            In plaats daarvan schuift deze band ónder de golf van het datablok
            erboven en ónder die van de footer eronder door, zodat het forest er
            in een golf overheen loopt en de sage eronder doorkomt. */}
        <Container className={styles.weefInner}>
          <h2 id="cta-title" className={styles.weefTitel}>
            Uit losse draden. Terug naar niets.
          </h2>
          <p className={styles.weefSub}>
            Zo wordt je vlag geweven: Flag-CiCLO® doek dat presteert als
            polyester en er na afdanking niet meer is.
          </p>
          <Button
            as="a"
            href="/collectie"
            variant="secondary"
            size="lg"
            icon={<ArrowRight />}
          >
            Stel je vlag samen
          </Button>
        </Container>
      </section>
    </>
  );
}
