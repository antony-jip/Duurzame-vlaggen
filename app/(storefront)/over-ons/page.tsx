import type { Metadata } from "next";
import Image from "next/image";
import styles from "./page.module.css";
import {
  Badge,
  Button,
  Container,
  ArrowRight,
  Leaf,
  Recycle,
  ShieldCheck,
} from "@/components/ui";
import { BRAND_IMAGES } from "@/lib/catalog/products";

export const metadata: Metadata = {
  title: "Over ons — Sign Company B.V.",
  description:
    "Sign Company B.V. uit Enkhuizen maakt duurzame signing en vlaggen die volledig verdwijnen. Waarom wij kozen voor biologisch afbreekbare vlaggen zonder microplastics.",
};

// Core values that guide the company.
const VALUES = [
  {
    icon: <Leaf size={26} />,
    title: "Verdwijnen zoals het hoort",
    body: "Onze vlaggen lossen op in 2–3 jaar en laten alleen CO₂, water en biomassa achter. Geen microplastics die 200 jaar in de natuur blijven.",
  },
  {
    icon: <Recycle size={26} />,
    title: "Geen concessie aan kwaliteit",
    body: "Flag-CiCLO® presteert identiek aan polyester: kleurvast, weerbestendig en scherp bedrukt. Alleen het einde van de levensduur is anders.",
  },
  {
    icon: <ShieldCheck size={26} />,
    title: "Aantoonbaar duurzaam",
    body: "Onafhankelijke ASTM-labtests en certificeringen als OEKO-TEX en REACH onderbouwen elke claim. Geen greenwashing, wel bewijs.",
  },
];

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

export default function OverOnsPage() {
  return (
    <>
      {/* HERO — egaal forest vlak, ambachtsfoto in de organische wapper-vorm. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<Leaf size={16} />}
              className={styles.heroEyebrow}
            >
              Sign Company B.V.
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Signing die je merk laat{" "}
              <span className={styles.heroAccent}>wapperen</span>.
            </h1>
            <p className={styles.heroSub}>
              Sign Company B.V. uit Enkhuizen ontwikkelt duurzame signing en
              vlaggen. Wij bewijzen dat een vlag opvallend én verantwoord kan
              zijn — met Flag-CiCLO®-technologie die volledig verdwijnt na
              gebruik.
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
                Neem contact op
              </a>
            </div>
          </div>

          <div className={styles.heroBlob}>
            <Image
              src={BRAND_IMAGES.finishing.src}
              alt={BRAND_IMAGES.finishing.alt}
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

      {/* HET PROBLEEM — donker filmisch blok, confronterend. */}
      <section className={styles.problem} aria-labelledby="problem-title">
        <Container className={styles.problemInner}>
          <p className={styles.problemKicker} id="problem-title">
            Het probleem
          </p>
          <p className={styles.problemLine}>
            Elke gewone vlag laat{" "}
            <span className={styles.problemAccent}>700.000 deeltjes</span>{" "}
            microplastic achter.
          </p>
          <p className={styles.problemBody}>
            In Nederland wapperen zo&apos;n 47 miljoen vlaggen. Ze zijn vrijwel
            allemaal van polyester en slijten met elke windvlaag. Die
            microplastics blijven meer dan 200 jaar in onze bodem en ons water.
            Voor iets dat vaak maar één campagne of seizoen meegaat, is dat een
            onnodig zware erfenis.
          </p>
        </Container>
      </section>

      {/* MISSIE — forest kleurblok tussen wapper-golven met glass stat-chips. */}
      <section className={styles.mission} aria-labelledby="mission-title">
        <svg
          className={styles.wave}
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={WAVE_PATH} fill="currentColor" />
        </svg>
        <div className={styles.missionBlock}>
          <Container className={styles.missionInner}>
            <span className={styles.missionEyebrow}>Onze missie</span>
            <h2 id="mission-title" className={styles.missionTitle}>
              Vlaggen die verdwijnen{" "}
              <span className={styles.missionAccent}>zoals het hoort</span>.
            </h2>
            <p className={styles.missionBody}>
              Daarom kozen wij voor Flag-CiCLO®: biologisch afbreekbaar polyester
              dat micro-organismen volledig kunnen verteren. Onze vlaggen breken
              voor 96% af in 2–3 jaar en laten geen microplastics achter —
              terwijl ze tijdens gebruik net zo goed presteren als een gewone
              vlag. Zo maken we duurzaamheid concreet én rapporteerbaar: de
              certificaten en ESRS E2-5-documentatie leveren we standaard mee.
            </p>
            <div className={styles.missionStats} aria-label="Kerncijfers">
              <div className={styles.missionStat}>
                <span className={styles.missionStatValue}>96%</span>
                <span className={styles.missionStatLabel}>
                  Biologisch afbreekbaar
                </span>
              </div>
              <div className={styles.missionStat}>
                <span className={styles.missionStatValue}>0</span>
                <span className={styles.missionStatLabel}>Microplastics</span>
              </div>
              <div className={styles.missionStat}>
                <span className={styles.missionStatValue}>2–3 jaar</span>
                <span className={styles.missionStatLabel}>
                  Tot volledig opgelost
                </span>
              </div>
            </div>
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

      {/* WAARDEN — drie beloftes met gekantelde kleurchips. */}
      <section className={styles.section} aria-labelledby="values-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Waar we voor staan</Badge>
            <h2 id="values-title">Drie beloftes, geen kleine lettertjes.</h2>
          </div>
          <div className={styles.valuesGrid}>
            {VALUES.map((value) => (
              <div key={value.title} className={styles.value}>
                <span className={styles.valueIcon} aria-hidden="true">
                  {value.icon}
                </span>
                <h3>{value.title}</h3>
                <p>{value.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA — terracotta kleurblok. */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Benieuwd wat we voor je kunnen betekenen?
              </h2>
              <p className={styles.ctaSub}>
                Bekijk de collectie duurzame vlaggen of neem contact op voor
                advies, een offerte of een gratis staal.
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
                <a href="/contact" className={styles.ctaLink}>
                  Neem contact op
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
