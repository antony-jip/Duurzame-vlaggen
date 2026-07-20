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
  alternates: { canonical: "/voor-bedrijven" },
  title: "Biologisch afbreekbare bedrijfsvlaggen",
  description:
    "Biologisch afbreekbare bedrijfsvlaggen met dezelfde kwaliteit als polyester. In zeewater brak 94,2% van het doek af in ruim drie en een half jaar (ASTM D6691). Inkoopdossier inbegrepen, levering in circa 3 werkdagen.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Waarom bedrijven overstappen — de vier zakelijke argumenten.
const REASONS = [
  {
    icon: <ShieldCheck size={24} />,
    title: "Laat minder microplastic achter",
    body: `Vezels die tijdens gebruik loslaten breken af in plaats van te blijven liggen. In ${HOOFDTEST.omgeving.toLowerCase()} brak ${HOOFD_PCT}% van het doek af in ${HOOFDTEST.duur} (${HOOFDTEST.norm}).`,
  },
  {
    icon: <Check size={24} />,
    title: "Inkoopdossier inbegrepen",
    body: "Bij elke bestelling zit een inkoopdossier met testresultaten, herkomst en certificaten. Direct bruikbaar voor je inkoop en je accountant.",
  },
  {
    icon: <Recycle size={24} />,
    title: "Zelfde kwaliteit",
    body: "Identieke levensduur, kleurvastheid en printkwaliteit als traditioneel polyester. Niemand ziet het verschil.",
  },
  {
    icon: <Leaf size={24} />,
    title: "Vergelijkbare prijs",
    body: "Slechts enkele euro's meer per vlag. Bij zakelijke volumes is het prijsverschil verwaarloosbaar.",
  },
];

// Producttips per toepassing, gekoppeld aan de echte collectie-pagina's.
const PRODUCTS = [
  {
    icon: <FlagGevel size={24} />,
    kicker: "Aan je pand",
    title: "Gevelvlag",
    body: `Je logo in full-color aan de gevel, op biologisch afbreekbaar doek. In ${HOOFDTEST.omgeving.toLowerCase()} brak ${HOOFD_PCT}% van dat doek af in ${HOOFDTEST.duur} (${HOOFDTEST.norm}).`,
    href: "/collectie/gevelvlag",
    label: "Bekijk gevelvlaggen",
  },
  {
    icon: <FlagMast size={24} />,
    kicker: "Klassiek display",
    title: "Mastvlag",
    body: "De vertrouwde mastvlag, met dezelfde levensduur en kwaliteit als gewoon polyester. Laat minder microplastic achter, want vezels die loslaten breken af in plaats van te blijven liggen.",
    href: "/collectie/mastvlag",
    label: "Bekijk mastvlaggen",
  },
  {
    icon: <FlagBanier size={24} />,
    kicker: "Representatief",
    title: "Baniervlag",
    body: "Strak en representatief bij entrees en beurzen. Na de campagne breekt het doek af in plaats van als plastic achter te blijven.",
    href: "/collectie/baniervlag",
    label: "Bekijk baniervlaggen",
  },
];

export default function VoorBedrijvenPage() {
  return (
    <>
      {/* HERO — forest vlak met glass-stats, zakelijke insteek. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<Leaf size={16} />}
              className={styles.heroEyebrow}
            >
              Voor bedrijven
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Bedrijfsvlaggen die{" "}
              <span className={styles.heroAccent}>verdwijnen</span>.
            </h1>
            <p className={styles.heroSub}>
              Elke gewone vlag wappert zichzelf kapot tot microplastic. Onze
              biologisch afbreekbare bedrijfsvlaggen hebben dezelfde kwaliteit
              en kleurvastheid als je huidige polyester, maar het doek breekt
              af. In {HOOFDTEST.omgeving.toLowerCase()} brak {HOOFD_PCT}% van
              het doek af in {HOOFDTEST.duur} ({HOOFDTEST.norm}). Vezels die
              tijdens gebruik loslaten breken af in plaats van te blijven
              liggen.
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
              <Link href="/contact" className={styles.heroLink}>
                Vraag offerte aan
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

      {/* WAAROM — vier zakelijke argumenten in chip-taal. */}
      <section className={styles.section} aria-labelledby="why-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Waarom overstappen</Badge>
            <h2 id="why-title">Duurzaam zonder concessies.</h2>
            <p className="lead">
              Bedrijven kiezen voor Flag-CiCLO® omdat het niets kost aan
              kwaliteit en omdat de onderbouwing meekomt. {CICLO_DISCLAIMER}
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

      {/* PRODUCTEN — merk-kaarten naar de collectie. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="products-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Toepassingen</Badge>
            <h2 id="products-title">Welke vlag past bij je pand?</h2>
            <p className="lead">
              Van gevel tot entree: elke vlag drukken we in full-color op
              Flag-CiCLO®-doek. Speciale wensen of grotere aantallen? Wij denken
              graag mee.
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

      {/* CSRD-VERHAAL — de urgentie, met doorverwijzing naar /csrd. */}
      <section className={styles.section} aria-labelledby="csrd-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">CSRD en je keten</Badge>
            <h2 id="csrd-title">
              Die vlaggen aan je gevel? Daar krijg je vragen over.
            </h2>
            <p className="lead">
              Sinds het Omnibus-pakket van december 2025 geldt de CSRD alleen
              voor bedrijven met meer dan 1.000 medewerkers én meer dan 450
              miljoen euro omzet. Val je daar niet onder, dan geldt er voor jou
              geen CSRD-plicht. De vraag krijg je wel, namelijk van grote
              opdrachtgevers in je keten die hun eigen rapportage moeten vullen.
            </p>
            <p className="lead">
              Bij elke bestelling zit daarom een inkoopdossier met
              testresultaten, herkomst en certificaten. Daarmee kun je laten
              zien wat je hebt ingekocht en hoe dat is gemeten, in plaats van te
              verwijzen naar een belofte van je leverancier.
            </p>
            <Link href="/csrd" className={styles.arrowLink}>
              Alles over CSRD en je vlaggen <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </section>

      <VergelijkVlaggen />

      {/* CTA — terracotta afsluiter naar persoonlijk contact. */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Maatwerk voor jouw bedrijf?
              </h2>
              <p className={styles.ctaSub}>
                Speciale wensen, grotere aantallen of het inkoopdossier vooraf
                inzien? Vertel ons je situatie en we maken een voorstel op maat.
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
