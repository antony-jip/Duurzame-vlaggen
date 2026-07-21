import type { Metadata } from "next";
import Link from "next/link";
import styles from "../../info.module.css";
import { faqJsonLd } from "@/lib/seo";
import {
  Badge,
  Button,
  Container,
  ArrowRight,
  ShieldCheck,
  FlagBanier,
  FlagBeach,
  FlagGevel,
  FlagMast,
} from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/kennisbank/vlaggen-kiezen" },
  title: "Vlag kiezen: formaten en masthoogtes",
  description:
    "Welk vlagtype en welk formaat past bij jouw situatie? Praktische keuzegids met standaardmaten voor mast- en baniervlaggen per masthoogte, plus gratis advies.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Vlagtypes met hun ideale toepassing.
const TYPES = [
  {
    icon: <FlagMast size={24} />,
    kicker: "6 tot 12 m masten",
    title: "Mastvlag",
    body: "De klassieke keuze voor vlaggenmasten bij je pand of entree. Standaardmaten: 100×150, 150×225 en 200×300 cm.",
    href: "/collectie/mastvlag",
  },
  {
    icon: <FlagBanier size={24} />,
    kicker: "3 tot 8 m baniermasten",
    title: "Baniervlag",
    body: "Verticaal en representatief, ideaal bij entrees. Standaardmaten: 80×300, 100×400 en 120×500 cm.",
    href: "/collectie/baniervlag",
  },
  {
    icon: <FlagGevel size={24} />,
    kicker: "Aan het pand",
    title: "Gevelvlag",
    body: "Voor aan de gevel van je gebouw, aan een schuine uithouder. Opvallend op straatniveau.",
    href: "/collectie/gevelvlag",
  },
  {
    icon: <FlagBeach size={24} />,
    kicker: "Events & acties",
    title: "Beachvlag",
    body: "Flexibel en snel te plaatsen bij evenementen, beurzen en tijdelijke acties. Geen mast nodig.",
    href: "/collectie/beachvlag",
  },
];

// Welk baniervlag-formaat bij welke masthoogte.
const BANIER_SIZES = [
  { size: "80×300 cm", mast: "4 meter mast" },
  { size: "100×400 cm", mast: "6 meter mast" },
  { size: "120×500 cm", mast: "8 meter mast" },
];

// Welk mastvlag-formaat bij welke masthoogte.
const MAST_SIZES = [
  { size: "100×150 cm", mast: "6 meter mast" },
  { size: "150×225 cm", mast: "7 tot 8 meter mast" },
  { size: "200×300 cm", mast: "10 tot 12 meter mast" },
];

const FAQ = [
  {
    q: "Welke baniervlag-formaten zijn er?",
    a: "Er zijn drie standaardformaten: 80×300 cm voor een 4 meter mast, 100×400 cm voor een 6 meter mast en 120×500 cm voor een 8 meter mast. Zo weet je direct welk formaat bij jouw mast past.",
  },
  {
    q: "Welke maat past bij een 6 meter baniermast?",
    a: "Bij een 6 meter baniermast past een baniervlag van 100×400 cm het beste. Dat formaat geeft optimale zichtbaarheid en staat mooi in verhouding tot de mast.",
  },
  {
    q: "Hoelang gaat zo'n vlag mee?",
    a: "Bij normaal buitengebruik zo'n 3 tot 4 maanden; de kleuren blijven tot 2 jaar UV-bestendig. En het mooie: onze vlaggen zijn 96% biologisch afbreekbaar, dus geen microplastics die in de natuur achterblijven.",
  },
  {
    q: "Kan ik ook een afwijkend formaat bestellen?",
    a: "Zeker. Heb je een custom maat nodig? Neem contact op met je specifieke afmetingen en we maken graag een offerte op maat.",
  },
  {
    q: "Ik twijfel nog over het formaat...",
    a: "Geen probleem. Stuur ons een foto van je mast (liefst met iets voor de schaal erbij) en we geven je vrijblijvend advies over het juiste formaat.",
  },
];

/** Het directe antwoord bovenaan; zie het gelijknamige blok in microplastics. */
const KORT_ANTWOORD = [
  "Kies eerst het vlagtype op basis van waar de vlag komt: een mastvlag voor een staande mast, een baniervlag voor een baniermast, een gevelvlag aan een uithouder tegen de muur en een beachvlag voor evenementen.",
  "Het formaat volgt uit de masthoogte. Voor baniervlaggen zijn er drie standaardmaten: 80×300 cm bij een mast van 4 meter, 100×400 cm bij 6 meter en 120×500 cm bij 8 meter. Maten staan altijd als breedte × hoogte. Een vlag gaat bij normaal buitengebruik 3 tot 4 maanden mee en de kleuren blijven tot 2 jaar UV-bestendig.",
];

const FAQ_JSON_LD = faqJsonLd(FAQ);

export default function VlaggenKiezenPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: FAQ_JSON_LD }}
      />
      {/* HERO */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Link href="/kennisbank" className={styles.crumb}>
              Kennisbank · Keuzegids
            </Link>
            <h1 id="hero-title" className={styles.heroTitle}>
              Welke vlag past{" "}
              <span className={styles.heroAccent}>bij jou</span>?
            </h1>
            <p className={styles.heroSub}>
              Van vlagtype tot formaat: met deze gids kies je in een paar
              minuten de juiste vlag voor jouw mast, gevel of evenement. Kom je
              er niet uit? We adviseren gratis.
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
                Advies nodig? Vraag het ons
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>4</span>
              <span className={styles.heroStatLabel}>Vlagtypes</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>3 tot 12 m</span>
              <span className={styles.heroStatLabel}>Masthoogtes</span>
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

      {/* KORT ANTWOORD — direct onder de hero, vóór de verdieping. */}
      <section className={styles.sectionTight} aria-labelledby="kort-antwoord">
        <Container>
          <div className={styles.kortAntwoord}>
            <span id="kort-antwoord" className={styles.kortAntwoordLabel}>
              Kort antwoord
            </span>
            {KORT_ANTWOORD.map((alinea) => (
              <p key={alinea.slice(0, 40)}>{alinea}</p>
            ))}
          </div>
        </Container>
      </section>

      {/* VLAGTYPES */}
      <section className={styles.section} aria-labelledby="types-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Stap 1</Badge>
            <h2 id="types-title">Kies je vlagtype.</h2>
            <p className="lead">
              Elk type heeft zijn eigen kracht. Waar komt jouw vlag te hangen?
            </p>
          </div>
          <div className={`${styles.cardGrid} ${styles.cardGrid4}`}>
            {TYPES.map((type) => (
              <div key={type.title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {type.icon}
                </span>
                <span className={styles.cardKicker}>{type.kicker}</span>
                <h3>{type.title}</h3>
                <p>{type.body}</p>
                <Link href={type.href} className={styles.cardLink}>
                  Bekijk en stel samen <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FORMATEN PER MASTHOOGTE */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="sizes-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Stap 2</Badge>
            <h2 id="sizes-title">Welk formaat bij welke mast?</h2>
            <p className="lead">
              In één oogopslag zie je welke vlagformaten passen bij de gangbare
              masthoogtes. Vuistregel: hoe hoger de mast, hoe groter de vlag.
            </p>
          </div>
          <div className={styles.cardGrid2}>
            <div className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                <FlagMast size={24} />
              </span>
              <span className={styles.cardKicker}>6 tot 12 m masten</span>
              <h3>Mastvlag-formaten</h3>
              <ul className={styles.cardList}>
                {MAST_SIZES.map((row) => (
                  <li key={row.size}>
                    <strong>{row.size}</strong> · {row.mast}
                  </li>
                ))}
              </ul>
              <Link href="/collectie/mastvlag" className={styles.cardLink}>
                Mastvlag samenstellen <ArrowRight size={16} />
              </Link>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                <FlagBanier size={24} />
              </span>
              <span className={styles.cardKicker}>3 tot 8 m masten</span>
              <h3>Baniervlag-formaten</h3>
              <ul className={styles.cardList}>
                {BANIER_SIZES.map((row) => (
                  <li key={row.size}>
                    <strong>{row.size}</strong> · {row.mast}
                  </li>
                ))}
              </ul>
              <Link href="/collectie/baniervlag" className={styles.cardLink}>
                Baniervlag samenstellen <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3>Ook een mast nodig?</h3>
              <p>
                We leveren ook vlaggenmasten, met 5 tot 15 jaar breukgarantie
                afhankelijk van het type.{" "}
                <Link href="/collectie/vlaggenmast">Bekijk vlaggenmasten</Link>{" "}
                of vraag advies over de juiste combinatie.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className={styles.section} aria-labelledby="faq-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Veelgestelde vragen</Badge>
            <h2 id="faq-title">Nog vragen? We helpen je graag.</h2>
          </div>
          <div className={styles.faqGroup}>
            {FAQ.map((item) => (
              <details key={item.q} className={styles.faq}>
                <summary>{item.q}</summary>
                <div className={styles.faqBody}>
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Je weet nu welk formaat bij je past.
              </h2>
              <p className={styles.ctaSub}>
                Gevonden wat je zocht? We leveren binnen circa 3 dagen. Twijfel
                je nog? Neem gerust contact op. We denken graag met je mee.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/collectie"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Stel je vlag samen
                </Button>
                <Link href="/contact" className={styles.ctaLink}>
                  Vraag gratis advies
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
