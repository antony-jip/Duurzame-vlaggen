import type { Metadata } from "next";
import styles from "./page.module.css";
import {
  Badge,
  Button,
  Card,
  Container,
  Hero,
  ArrowRight,
  Leaf,
  Recycle,
  ShieldCheck,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Over ons — Sign Company B.V.",
  description:
    "Sign Company B.V. uit Enkhuizen maakt duurzame signing en vlaggen die volledig verdwijnen. Waarom wij kozen voor biologisch afbreekbare vlaggen zonder microplastics.",
};

// Core values that guide the company.
const VALUES = [
  {
    icon: <Leaf size={24} />,
    title: "Verdwijnen zoals het hoort",
    body: "Onze vlaggen lossen op in 2–3 jaar en laten alleen CO₂, water en biomassa achter. Geen microplastics die 200 jaar in de natuur blijven.",
  },
  {
    icon: <Recycle size={24} />,
    title: "Geen concessie aan kwaliteit",
    body: "Flag-CiCLO® presteert identiek aan polyester: kleurvast, weerbestendig en scherp bedrukt. Alleen het einde van de levensduur is anders.",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Aantoonbaar duurzaam",
    body: "Onafhankelijke ASTM-labtests en certificeringen als OEKO-TEX en REACH onderbouwen elke claim. Geen greenwashing, wel bewijs.",
  },
];

export default function OverOnsPage() {
  return (
    <>
      <Hero
        eyebrow={
          <Badge variant="eyebrow" icon={<Leaf size={16} />}>
            Sign Company B.V.
          </Badge>
        }
        title={
          <>
            Signing die je merk laat wapperen, niet de{" "}
            <span className="accent">planeet belast</span>
          </>
        }
        lead="Sign Company B.V. uit Enkhuizen ontwikkelt duurzame signing en vlaggen. Wij bewijzen dat een vlag opvallend én verantwoord kan zijn — met Flag-CiCLO®-technologie die volledig verdwijnt na gebruik."
        actions={
          <>
            <Button as="a" href="/collectie" size="lg" icon={<ArrowRight />}>
              Bekijk de collectie
            </Button>
            <Button as="a" href="/contact" variant="secondary" size="lg">
              Neem contact op
            </Button>
          </>
        }
      />

      {/* The problem */}
      <section className={styles.section} aria-labelledby="problem-title">
        <Container variant="medium">
          <div className={styles.prose}>
            <Badge variant="primary">Het probleem</Badge>
            <h2 id="problem-title">
              Elke gewone vlag laat 700.000 deeltjes microplastic achter
            </h2>
            <p className="lead">
              In Nederland wapperen zo&apos;n 47 miljoen vlaggen. Ze zijn vrijwel
              allemaal van polyester en slijten met elke windvlaag. Die
              microplastics blijven meer dan 200 jaar in onze bodem en ons water.
              Voor iets dat vaak maar één campagne of seizoen meegaat, is dat een
              onnodig zware erfenis.
            </p>
          </div>
        </Container>
      </section>

      {/* The mission / solution */}
      <section
        className={`${styles.section} ${styles.missionBand}`}
        aria-labelledby="mission-title"
      >
        <Container variant="medium">
          <div className={styles.prose}>
            <Badge variant="success">Onze missie</Badge>
            <h2 id="mission-title">Vlaggen die verdwijnen zoals het hoort</h2>
            <p className="lead">
              Daarom kozen wij voor Flag-CiCLO®: biologisch afbreekbaar polyester
              dat micro-organismen volledig kunnen verteren. Onze vlaggen breken
              voor 96% af in 2–3 jaar en laten geen microplastics achter — terwijl
              ze tijdens gebruik net zo goed presteren als een gewone vlag.
            </p>
            <p>
              Zo maken we duurzaamheid concreet én rapporteerbaar. Onder de CSRD
              moeten bedrijven vanaf 2025 hun microplastic-uitstoot verantwoorden.
              Onze vlaggen leveren daarvoor niets om te rapporteren — en de
              certificaten en ESRS E2-5-documentatie leveren we standaard mee.
            </p>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className={styles.section} aria-labelledby="values-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Waar we voor staan</Badge>
            <h2 id="values-title">Drie beloftes, geen kleine lettertjes</h2>
          </div>
          <div className={styles.valuesGrid}>
            {VALUES.map((value) => (
              <Card key={value.title} elevation="raised" className={styles.valueCard}>
                <span className={styles.valueIcon} aria-hidden="true">
                  {value.icon}
                </span>
                <h3>{value.title}</h3>
                <p>{value.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <Badge variant="detail">Enkhuizen, Nederland</Badge>
              <h2 id="cta-title">Benieuwd wat we voor je kunnen betekenen?</h2>
              <p className="lead">
                Bekijk de collectie duurzame vlaggen of neem contact op voor
                advies, een offerte of een gratis staal.
              </p>
              <div className={styles.ctaActions}>
                <Button as="a" href="/collectie" size="lg" icon={<ArrowRight />}>
                  Bekijk de collectie
                </Button>
                <Button as="a" href="/contact" variant="tertiary" size="lg">
                  Neem contact op
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
