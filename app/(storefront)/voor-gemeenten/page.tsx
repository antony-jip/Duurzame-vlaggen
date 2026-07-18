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
  FlagGevel,
  FlagMast,
  FlagBanier,
  VergelijkVlaggen,
} from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/voor-gemeenten" },
  title: "Gemeentevlaggen zonder microplastics",
  description:
    "Biologisch afbreekbare gemeentevlaggen: geen microplastics in de openbare ruimte, meetbaar voor MVI-rapportages en aanbestedingen. Documentatie inbegrepen.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

const REASONS = [
  {
    icon: <Leaf size={24} />,
    title: "Voorbeeldfunctie",
    body: "Laat inwoners en raadsleden zien dat je gemeente echt actie onderneemt tegen plastic vervuiling. Zichtbaar aan het gemeentehuis.",
  },
  {
    icon: <Check size={24} />,
    title: "Meetbare impact",
    body: "Concrete, onafhankelijk geteste cijfers voor raadsverslagen en communicatie naar burgers. Geen vage claims.",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "MVI-geschikt",
    body: "Past binnen Maatschappelijk Verantwoord Inkopen. Complete documentatie voor aanbestedingen leveren we mee.",
  },
  {
    icon: <Recycle size={24} />,
    title: "Vergelijkbare prijs",
    body: "Slechts enkele euro's meer per vlag dan traditioneel polyester. Ook bij volume snel geleverd, in circa 3 werkdagen.",
  },
];

const PRODUCTS = [
  {
    icon: <FlagGevel size={24} />,
    kicker: "Gemeentehuizen",
    title: "Gevelvlag",
    body: "Het gemeentewapen of logo in full-color aan het gemeentehuis of openbare gebouwen. Zonder microplastics in de openbare ruimte.",
    href: "/collectie/gevelvlag",
    label: "Bekijk gevelvlaggen",
  },
  {
    icon: <FlagMast size={24} />,
    kicker: "Openbare ruimte",
    title: "Mastvlag",
    body: "Voor masten bij pleinen, parken en gemeentelijke locaties. Zelfde levensduur als traditioneel, na vervanging volledig opgelost.",
    href: "/collectie/mastvlag",
    label: "Bekijk mastvlaggen",
  },
  {
    icon: <FlagBanier size={24} />,
    kicker: "Evenementen & feestdagen",
    title: "Baniervlag",
    body: "Voor straatversiering, Koningsdag, Bevrijdingsdag of lokale evenementen. Na afloop geen plastic afval in de straten.",
    href: "/collectie/baniervlag",
    label: "Bekijk baniervlaggen",
  },
];

export default function VoorGemeentenPage() {
  return (
    <>
      {/* HERO — publieke sector: het goede voorbeeld geven. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<Leaf size={16} />}
              className={styles.heroEyebrow}
            >
              Voor gemeenten
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Geef het goede voorbeeld,{" "}
              <span className={styles.heroAccent}>zichtbaar</span> voor
              iedereen.
            </h1>
            <p className={styles.heroSub}>
              Gemeentevlaggen zonder microplastics in de openbare ruimte. 96%
              lost volledig op in 2 tot 3 jaar na afdanking. Transparant richting
              inwoners, meetbaar voor MVI-rapportages en geschikt voor
              aanbestedingen.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="/contact"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Vraag offerte aan
              </Button>
              <Link href="/certificeringen" className={styles.heroLink}>
                Bekijk de certificeringen
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>96%</span>
              <span className={styles.heroStatLabel}>Afbreekbaar</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>0%</span>
              <span className={styles.heroStatLabel}>Microplastics</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>MVI</span>
              <span className={styles.heroStatLabel}>Geschikt</span>
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

      {/* WAAROM — vier argumenten voor de publieke sector. */}
      <section className={styles.section} aria-labelledby="why-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Waarom gemeenten kiezen</Badge>
            <h2 id="why-title">Meetbare duurzaamheid, geen mooie woorden.</h2>
            <p className="lead">
              Elke gemeente praat over een schonere leefomgeving. Met
              Flag-CiCLO®-vlaggen maak je het concreet. En je kunt het aantonen.
            </p>
          </div>
          <div className={`${styles.chipGrid} ${styles.chipGrid4}`}>
            {REASONS.map((item) => (
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

      {/* TOEPASSINGEN — van gemeentehuis tot straatversiering. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="products-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Toepassingen</Badge>
            <h2 id="products-title">Van gemeentehuis tot straatversiering.</h2>
            <p className="lead">
              Dezelfde kwaliteit als traditionele vlaggen, maar zonder
              microplastics in de openbare ruimte. Welke vlaggen heeft jouw
              gemeente nodig?
            </p>
          </div>
          <div className={styles.cardGrid}>
            {PRODUCTS.map((product) => (
              <div key={product.title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {product.icon}
                </span>
                <span className={styles.cardKicker}>{product.kicker}</span>
                <h3>{product.title}</h3>
                <p>{product.body}</p>
                <Link href={product.href} className={styles.cardLink}>
                  {product.label} <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* VERHAAL — burgers kijken naar wat je doet. */}
      <section className={styles.section} aria-labelledby="story-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Voorbeeldfunctie</Badge>
            <h2 id="story-title">
              Burgers kijken naar wat je doet, niet naar wat je zegt.
            </h2>
            <p className="lead">
              Klimaatdoelen, een schonere leefomgeving. Elke gemeente heeft
              ambities. Maar wat hangt er aan het eigen gemeentehuis? Polyester
              vlaggen die bij elke windvlaag microplastics loslaten in de
              openbare ruimte.
            </p>
            <p className="lead">
              Dat kan anders. Zelfde kwaliteit, zelfde kleuren, zelfde
              levensduur. Maar met een verhaal dat je kunt vertellen. Aan de
              raad, aan inwoners, aan de pers. Duurzaamheid begint bij de details
              die iedereen kan zien.
            </p>
            <Link href="/duurzaamheid" className={styles.arrowLink}>
              Bekijk de technologie <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </section>

      <VergelijkVlaggen />

      {/* CTA */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Maatwerk voor jouw gemeente?
              </h2>
              <p className={styles.ctaSub}>
                Aanbesteding, MVI-criteria of specifieke wensen? Wij denken
                graag mee en leveren de documentatie erbij.
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
