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
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Voor verenigingen — duurzame clubvlaggen in jullie kleuren",
  description:
    "Biologisch afbreekbare clubvlaggen voor sportverenigingen en clubs. Exacte clubkleuren, staffelkorting vanaf 10 stuks en geen microplastics op het sportpark.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

const REASONS = [
  {
    icon: <Check size={24} />,
    title: "Clubkorting",
    body: "Hoe meer vlaggen, hoe voordeliger: staffelkorting vanaf 10 stuks. Elke euro telt bij een vereniging — dat snappen wij.",
  },
  {
    icon: <Recycle size={24} />,
    title: "Mix & match",
    body: "Clubvlag, teamvlaggen, sponsorvlaggen: combineer verschillende ontwerpen in één bestelling.",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Exacte clubkleuren",
    body: "Full-color print in jullie exacte clubkleuren, tot 2 jaar kleurecht. Geen compromis op de clubtrots.",
  },
  {
    icon: <Leaf size={24} />,
    title: "Wij denken mee",
    body: "Vertel ons jullie situatie en wij adviseren vrijblijvend over formaten en aantallen. Reactie binnen 24 uur.",
  },
];

const PRODUCTS = [
  {
    icon: <FlagGevel size={24} />,
    kicker: "Clubhuis & kantine",
    title: "Gevelvlag",
    body: "Perfect voor aan het clubhuis of bij de ingang. Jullie logo in full-color, elke thuiswedstrijd zichtbaar.",
    href: "/collectie/gevelvlag",
    label: "Bekijk gevelvlaggen",
  },
  {
    icon: <FlagBanier size={24} />,
    kicker: "Langs het veld",
    title: "Baniervlag",
    body: "Maximale zichtbaarheid bij wedstrijden en toernooien. Ook geschikt voor sponsoruitingen langs het veld.",
    href: "/collectie/baniervlag",
    label: "Bekijk baniervlaggen",
  },
  {
    icon: <FlagMast size={24} />,
    kicker: "Sportcomplex & entree",
    title: "Mastvlag",
    body: "De klassieke clubvlag voor aan de mast bij de entree van het sportcomplex.",
    href: "/collectie/mastvlag",
    label: "Bekijk mastvlaggen",
  },
];

// Het seizoensverhaal: presteren, afdanken, verdwijnen.
const SEASON = [
  {
    meta: "Seizoen start",
    title: "Trots bij het clubhuis",
    body: "Zelfde kwaliteit als traditionele vlaggen — jullie kleuren in de wind bij elke thuiswedstrijd.",
  },
  {
    meta: "Seizoen einde",
    title: "Tijd voor nieuwe vlaggen",
    body: "Na 3–4 maanden intensief gebruik mogen de oude vlaggen weg. Geen gedoe, gewoon bij het afval.",
  },
  {
    meta: "1–2 jaar",
    title: "Natuurlijk proces",
    body: "Micro-organismen breken de vezels af, net zoals bij natuurlijke materialen.",
  },
  {
    meta: "2–3 jaar",
    title: "Geen sporen",
    body: "96% volledig opgelost. Alleen CO₂, water en biomassa blijven over — niets op het sportpark.",
  },
];

export default function VoorVerenigingenPage() {
  return (
    <>
      {/* HERO — clubtrots zonder plastic erfenis. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<Leaf size={16} />}
              className={styles.heroEyebrow}
            >
              Voor verenigingen
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Clubvlaggen in jullie kleuren.{" "}
              <span className={styles.heroAccent}>Zonder plastic erfenis.</span>
            </h1>
            <p className={styles.heroSub}>
              Biologisch afbreekbare vlaggen voor jullie vereniging. Zelfde
              kwaliteit en clubkleuren als traditioneel, maar na het seizoen
              geen microplastics op het sportpark waar jullie jeugd speelt.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="/collectie"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Ontwerp je clubvlag
              </Button>
              <Link href="/contact" className={styles.heroLink}>
                Vraag clubofferte aan
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>96%</span>
              <span className={styles.heroStatLabel}>Afbreekbaar</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>2 jaar</span>
              <span className={styles.heroStatLabel}>Kleurvast</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>~3 dagen</span>
              <span className={styles.heroStatLabel}>Levertijd</span>
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

      {/* WAAROM — vier clubvoordelen. */}
      <section className={styles.section} aria-labelledby="why-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Voor ambitieuze clubs</Badge>
            <h2 id="why-title">Geen plastic. Wél clubtrots.</h2>
            <p className="lead">
              Jullie verdienen vlaggen die net zo goed presteren als jullie
              teams — tegen verenigingsvriendelijke prijzen.
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

      {/* PRODUCTEN — clubhuis, veld, entree. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="products-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Klaar voor het nieuwe seizoen</Badge>
            <h2 id="products-title">Clubvlaggen in jullie kleuren.</h2>
            <p className="lead">
              Van clubhuis tot wedstrijdveld: vlaggen die opvallen én na het
              seizoen geen plastic sporen achterlaten.
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

      {/* SEIZOENSVERHAAL — wapperen, scoren, verdwijnen. */}
      <section className={styles.section} aria-labelledby="season-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Duurzaam statement</Badge>
            <h2 id="season-title">Wapperen, scoren, verdwijnen.</h2>
            <p className="lead">
              Jullie clubvlaggen presteren een heel seizoen en laten daarna
              geen plastic sporen achter op het veld of in de natuur. Een
              statement naar leden en sponsors — en dat mag je best laten zien.
            </p>
          </div>
          <div className={styles.steps}>
            {SEASON.map((item, i) => (
              <div key={item.title} className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">
                  {i + 1}
                </span>
                <span className={styles.stepMeta}>{item.meta}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA — clubofferte. */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Klaar om jullie club te laten wapperen?
              </h2>
              <p className={styles.ctaSub}>
                Vertel ons over jullie club en we maken een voorstel op maat
                met clubkorting. Vrijblijvend advies, reactie binnen 24 uur.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/contact"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Vraag clubofferte aan
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
