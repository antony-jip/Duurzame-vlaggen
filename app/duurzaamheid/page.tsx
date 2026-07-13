import type { Metadata } from "next";
import styles from "./page.module.css";
import {
  Badge,
  Button,
  Card,
  Container,
  Hero,
  StatCard,
  ArrowRight,
  Check,
  Leaf,
  Recycle,
  ShieldCheck,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Duurzaamheid — Flag-CiCLO® technologie",
  description:
    "Duurzame vlaggen die verdwijnen. Zero plastic. Onze Flag-CiCLO®-vlaggen zijn 96% biologisch afbreekbaar in 2–3 jaar, bevatten 0% microplastics en zijn CSRD/ESRS E2-5-compliant.",
};

// The four-phase breakdown of how a Flag-CiCLO® flag returns to nature.
const PHASES = [
  {
    title: "In gebruik",
    body: "Je vlag presteert identiek aan polyester: kleurvast, weerbestendig en tot 2 jaar UV-stabiel. Functionele levensduur 3–4 maanden intensief buiten.",
  },
  {
    title: "Start van de afbraak",
    body: "Na afdanking hechten micro-organismen zich aan de vezels. De CiCLO®-technologie opent de kunststofstructuur zodat de natuur het materiaal herkent als voedsel.",
  },
  {
    title: "Actieve afbraak",
    body: "In de bodem of in een stortomgeving breken bacteriën en schimmels de vezels in 1–2 jaar verder af — zonder microplastische resten achter te laten.",
  },
  {
    title: "Volledig opgelost",
    body: "96% is verdwenen. Wat rest zijn alleen CO₂, water en biomassa. Geen microplastics, geen restafval. Totale doorlooptijd: 2–3 jaar.",
  },
];

// Independent certifications backing the claims.
const CERTS = [
  {
    name: "OEKO-TEX ECO PASSPORT",
    body: "Onafhankelijk bewijs dat elke grondstof en elk chemisch bestanddeel veilig is voor mens en milieu.",
  },
  {
    name: "ASTM D5988",
    body: "Genormeerde labtest voor biologische afbreekbaarheid in de bodem — de basis onder onze 96%-claim.",
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
    icon: <ShieldCheck size={24} />,
    title: "Niets te rapporteren",
    body: "Onze vlaggen lossen op. 96% verdwijnt volledig, zonder microplastics. Er is dus geen uitstoot om onder ESRS E2-5 te verantwoorden.",
  },
  {
    icon: <Check size={24} />,
    title: "Documentatie inbegrepen",
    body: "Bij elke bestelling ontvang je de ESRS E2-5-documentatie en certificaten die je één-op-één in je duurzaamheidsverslag opneemt.",
  },
  {
    icon: <Leaf size={24} />,
    title: "Verifieerbaar, geen greenwashing",
    body: "Alle claims steunen op onafhankelijke ASTM-labtests en internationale certificeringen — controleerbaar door je accountant.",
  },
];

export default function DuurzaamheidPage() {
  return (
    <>
      <Hero
        eyebrow={
          <Badge variant="eyebrow" icon={<Recycle size={16} />}>
            Flag-CiCLO® technologie
          </Badge>
        }
        title={
          <>
            Duurzame vlaggen die <span className="accent">verdwijnen</span>.
            Zero plastic.
          </>
        }
        lead="Zelfde kwaliteit als je huidige vlag — alleen lost deze op in de natuur. 96% biologisch afbreekbaar in 2–3 jaar, 0% microplastics en volledig CSRD-compliant."
        actions={
          <>
            <Button as="a" href="/collectie" size="lg" icon={<ArrowRight />}>
              Bekijk de collectie
            </Button>
            <Button as="a" href="/contact" variant="secondary" size="lg">
              Vraag documentatie aan
            </Button>
          </>
        }
        aside={
          <div className={styles.heroVisual}>
            <div className={styles.panel} aria-hidden="true">
              <span className={styles.panelMark}>
                <Leaf size={40} />
              </span>
            </div>
            <StatCard
              className={`${styles.statFloat} ${styles.statA}`}
              value="96%"
              label="Biologisch afbreekbaar"
              labelTone="blue"
            />
            <StatCard
              className={`${styles.statFloat} ${styles.statB}`}
              value="0%"
              label="Microplastics"
              labelTone="purple"
            />
            <StatCard
              className={`${styles.statFloat} ${styles.statC}`}
              value="2–3 jaar"
              label="Tot volledig opgelost"
              labelTone="blue"
            />
          </div>
        }
      />

      {/* How Flag-CiCLO works */}
      <section className={styles.section} aria-labelledby="how-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Hoe het werkt</Badge>
            <h2 id="how-title">Van wapperende vlag tot biomassa in vier fasen</h2>
            <p className="lead">
              Flag-CiCLO® is biologisch afbreekbaar polyester. De vezel presteert
              als een gewone vlag, maar bevat een ingrediënt dat micro-organismen
              in staat stelt het materiaal volledig af te breken.
            </p>
          </div>
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
        </Container>
      </section>

      {/* The numbers */}
      <section
        className={`${styles.section} ${styles.numbersBand}`}
        aria-labelledby="numbers-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="success">De cijfers</Badge>
            <h2 id="numbers-title">Onderbouwd, niet beloofd</h2>
            <p className="lead">
              Elk getal is gemeten volgens internationale ASTM-normen in een
              onafhankelijk laboratorium.
            </p>
          </div>
          <div className={styles.stats}>
            <StatCard value="96%" label="Biologisch afbreekbaar" labelTone="blue" />
            <StatCard value="2–3 jaar" label="Tot volledig opgelost" labelTone="purple" />
            <StatCard value="0%" label="Microplastics" labelTone="blue" />
            <StatCard value="3–4 mnd" label="Functionele levensduur" labelTone="purple" />
          </div>
        </Container>
      </section>

      {/* Certifications */}
      <section className={styles.section} aria-labelledby="certs-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Certificeringen</Badge>
            <h2 id="certs-title">Onafhankelijk getoetst</h2>
            <p className="lead">
              We laten onze claims controleren door externe instanties. Zo weet je
              zeker dat &ldquo;duurzaam&rdquo; hier ook echt duurzaam betekent.
            </p>
          </div>
          <div className={styles.certsGrid}>
            {CERTS.map((cert) => (
              <Card key={cert.name} elevation="raised" className={styles.certCard}>
                <span className={styles.certIcon} aria-hidden="true">
                  <ShieldCheck size={22} />
                </span>
                <h3 className={styles.certName}>{cert.name}</h3>
                <p>{cert.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* What CSRD means for you */}
      <section
        className={`${styles.section} ${styles.numbersBand}`}
        aria-labelledby="csrd-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">CSRD &amp; ESRS E2-5</Badge>
            <h2 id="csrd-title">Wat dit betekent voor jouw rapportage</h2>
            <p className="lead">
              Onder de CSRD moeten bedrijven hun microplastic-uitstoot
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

      {/* CTA */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <Badge variant="detail">Sign Company B.V.</Badge>
              <h2 id="cta-title">Duurzaam wapperen, zwart-op-wit onderbouwd</h2>
              <p className="lead">
                Vraag de certificaten en ESRS E2-5-documentatie op, of bestel
                direct een gratis staal van ons Flag-CiCLO®-doek.
              </p>
              <div className={styles.ctaActions}>
                <Button as="a" href="/offerte" size="lg" icon={<ArrowRight />}>
                  Vraag offerte aan
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
