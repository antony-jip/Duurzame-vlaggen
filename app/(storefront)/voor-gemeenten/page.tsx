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
import {
  CICLO_DISCLAIMER,
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";

/** Nederlandse schrijfwijze van een percentage: 94.2 wordt 94,2. */

const HOOFD_PCT = pctNl(HOOFDTEST.afbraakPct);
const REFERENTIE_PCT =
  HOOFDTEST.referentiePct === null ? null : pctNl(HOOFDTEST.referentiePct);

export const metadata: Metadata = {
  alternates: { canonical: "/voor-gemeenten" },
  title: "Duurzame, biologisch afbreekbare gemeentevlaggen",
  description:
    "Gemeentevlaggen die minder microplastic achterlaten. In zeewater brak 94,2% van het doek af in ruim drie en een half jaar (ASTM D6691). Klaar voor MVI en aanbestedingen.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

const REASONS = [
  {
    icon: <Leaf size={24} />,
    title: "Laat minder microplastic achter",
    body: `Vezels die tijdens gebruik loslaten breken af in plaats van te blijven liggen. In ${HOOFDTEST.omgeving.toLowerCase()} brak ${HOOFD_PCT}% van het doek af in ${HOOFDTEST.duur} (${HOOFDTEST.norm}).`,
  },
  {
    icon: <Check size={24} />,
    title: "Meetbare cijfers",
    body: "Testresultaten per omgeving, met norm, percentage en termijn. Bruikbaar in raadsverslagen en in communicatie naar inwoners.",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "MVI-geschikt",
    body: "Past binnen Maatschappelijk Verantwoord Inkopen. Bij elke bestelling zit een inkoopdossier met testresultaten, herkomst en certificaten, direct bruikbaar bij aanbestedingen.",
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
    body: "Het gemeentewapen of logo in full-color aan het gemeentehuis of openbare gebouwen, op biologisch afbreekbaar doek dat minder microplastic achterlaat.",
    href: "/collectie/gevelvlag",
    label: "Bekijk gevelvlaggen",
  },
  {
    icon: <FlagMast size={24} />,
    kicker: "Openbare ruimte",
    title: "Mastvlag",
    body: `Voor masten bij pleinen, parken en gemeentelijke locaties. Zelfde levensduur als traditioneel polyester, maar in ${HOOFDTEST.omgeving.toLowerCase()} brak ${HOOFD_PCT}% van het doek af in ${HOOFDTEST.duur} (${HOOFDTEST.norm}).`,
    href: "/collectie/mastvlag",
    label: "Bekijk mastvlaggen",
  },
  {
    icon: <FlagBanier size={24} />,
    kicker: "Evenementen & feestdagen",
    title: "Baniervlag",
    body: "Voor straatversiering, Koningsdag, Bevrijdingsdag of lokale evenementen. Wat er na afloop achterblijft breekt af in plaats van als plastic te blijven liggen.",
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
              Vlaggen voor gemeenten: duurzaam en biologisch afbreekbaar, en ze
              laten minder microplastic achter in de openbare ruimte. Vezels
              die tijdens gebruik loslaten breken af in plaats van te blijven
              liggen. In {HOOFDTEST.omgeving.toLowerCase()} brak {HOOFD_PCT}%
              van het doek af in {HOOFDTEST.duur} ({HOOFDTEST.norm}). Meetbaar
              voor MVI-rapportages en geschikt voor aanbestedingen.
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
              <Link href={ONDERBOUWING_PAD} className={styles.heroLink}>
                {ONDERBOUWING_LINK_TEKST}
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{HOOFD_PCT}%</span>
              <span className={styles.heroStatLabel}>
                Afgebroken in {HOOFDTEST.omgeving.toLowerCase()}
              </span>
            </div>
            {REFERENTIE_PCT !== null && (
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{REFERENTIE_PCT}%</span>
                <span className={styles.heroStatLabel}>
                  Gewoon polyester, zelfde test
                </span>
              </div>
            )}
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
              Flag-CiCLO®-vlaggen maak je het concreet, en je kunt het aantonen.{" "}
              {CICLO_DISCLAIMER}
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
              Dezelfde kwaliteit als traditionele vlaggen, maar het doek laat
              minder microplastic achter in de openbare ruimte. Welke vlaggen
              heeft jouw gemeente nodig?
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
              vlaggen die bij elke windvlaag vezels loslaten in de openbare
              ruimte, en die vezels blijven daar liggen.
            </p>
            <p className="lead">
              Dat kan anders. Zelfde kwaliteit, zelfde kleuren, zelfde
              levensduur, maar de vezels die loslaten breken af. In{" "}
              {HOOFDTEST.omgeving.toLowerCase()} brak {HOOFD_PCT}% van het doek
              af in {HOOFDTEST.duur} volgens {HOOFDTEST.norm}, tegenover{" "}
              {REFERENTIE_PCT}% voor onbehandeld polyester in dezelfde test. Dat
              is een cijfer dat je kunt uitleggen aan de raad, aan inwoners en
              aan de pers.
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
