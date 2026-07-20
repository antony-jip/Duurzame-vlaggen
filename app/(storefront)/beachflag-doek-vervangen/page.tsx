import type { Metadata } from "next";
import Link from "next/link";
import styles from "../info.module.css";
import {
  Badge,
  Button,
  Container,
  ArrowRight,
  Check,
  FlagBeach,
  Leaf,
  Truck,
} from "@/components/ui";
import { getProduct } from "@/lib/catalog/products";
import {
  CICLO_DISCLAIMER,
  DOEK,
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";
import { breadcrumbJsonLd, jsonLd } from "@/lib/seo";

/**
 * Landingspagina op de zoekterm "beachflag doek vervangen".
 *
 * Waarom apart en niet als blokje op de productpagina: dit is een andere
 * zoekintentie. Wie hier komt heeft de stok en de voet al staan en zoekt alleen
 * een nieuw doek. Geen enkele concurrent bedient die term, terwijl het een
 * terugkerende aankoop is: het doek gaat een seizoen mee, de rest jaren.
 *
 * De maten komen uit de catalogus, niet uit deze pagina, zodat ze niet uiteen
 * kunnen lopen met de configurator. Prijzen staan hier bewust niet: die staan in
 * `lib/pricing/local-catalog.ts` en horen alleen op de productpagina.
 */

/** De maten uit de catalogus, gesplitst op model. Leeg is onmogelijk, maar we
    renderen defensief zodat een catalogswijziging deze pagina niet sloopt. */
const MATEN = getProduct("beachvlag")?.sizes ?? [];
const STRAIGHT = MATEN.filter((m) => m.label.startsWith("Straight"));
const SQUARE = MATEN.filter((m) => m.label.startsWith("Square"));

export const metadata: Metadata = {
  alternates: { canonical: "/beachflag-doek-vervangen" },
  title: "Beachflag doek vervangen. Los doek, biologisch afbreekbaar",
  description: `Alleen het doek van je beachflag vervangen, zonder nieuwe stok en voet. Kies de maat van je straight- of squareflag en bestel een los doek van biologisch afbreekbaar materiaal: ${pctNl(HOOFDTEST.afbraakPct)}% afgebroken in zeewater in ${HOOFDTEST.duur} volgens ${HOOFDTEST.norm}.`,
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Gestructureerde data: alleen het kruimelpad. Geen FAQPage, want deze pagina
// heeft geen vraag-en-antwoordblok, en geen aggregateRating of review.
const BREADCRUMB_JSON_LD = jsonLd(
  breadcrumbJsonLd([
    { naam: "Home", pad: "/" },
    { naam: "Beachflag doek vervangen", pad: "/beachflag-doek-vervangen" },
  ]),
);

/** Wanneer alleen het doek toe is aan vervanging. */
const SIGNALEN = [
  {
    icon: <FlagBeach size={24} />,
    kop: "De kleur is weggetrokken",
    body: "Uv-licht bleekt de print. Rood en blauw verschieten het eerst, en na een zomer buiten hangt er een vlag die niet meer bij je huisstijl past terwijl het doek zelf nog heel is.",
  },
  {
    icon: <Check size={24} />,
    kop: "De achterrand begint te rafelen",
    body: "De vrije rand van een beachflag klappert de hele dag. Daar slijt hij, en een rafel loopt door. Vervangen op het moment dat het begint, is goedkoper dan wachten tot er een scheur in staat.",
  },
  {
    icon: <Truck size={24} />,
    kop: "Stok en voet zijn nog prima",
    body: "De glasvezelstok en de voet gaan bij normaal gebruik jaren mee. Bij intensief buitengebruik is het doek na ongeveer drie tot vier maanden aan vervanging toe. Een hele nieuwe set kopen betekent dus vooral dat je twee onderdelen weggooit die nog werken.",
  },
];

export default function BeachflagDoekVervangenPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: BREADCRUMB_JSON_LD }}
      />
      {/* HERO */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<FlagBeach size={16} />}
              className={styles.heroEyebrow}
            >
              Alleen het doek, niet de hele set
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Beachflag doek vervangen.{" "}
              <span className={styles.heroAccent}>
                Stok en voet houd je gewoon.
              </span>
            </h1>
            <p className={styles.heroSub}>
              Je stok staat er nog, je voet staat er nog, alleen het doek is
              verschoten of gerafeld. Dan bestel je een los vervangingsdoek in
              de maat die je al hebt. Wij drukken op biologisch afbreekbaar
              doek, wat juist bij vervanging telt: je vervangt vaker, dus het
              oude doek stapelt zich sneller op.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="/collectie/beachvlag"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Bestel je vervangingsdoek
              </Button>
              <Link href={ONDERBOUWING_PAD} className={styles.heroLink}>
                {ONDERBOUWING_LINK_TEKST}
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerngegevens">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>3 tot 4 maanden</span>
              <span className={styles.heroStatLabel}>
                Levensduur van een doek bij intensief buitengebruik
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{MATEN.length}</span>
              <span className={styles.heroStatLabel}>
                Maten, straight en square
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>5 werkdagen</span>
              <span className={styles.heroStatLabel}>
                Levertijd na goedkeuring van je ontwerp
              </span>
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

      {/* WANNEER VERVANG JE ALLEEN HET DOEK */}
      <section className={styles.section} aria-labelledby="wanneer-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Wanneer</Badge>
            <h2 id="wanneer-title">
              Wanneer je alleen het doek vervangt en niet de hele beachflag.
            </h2>
            <p className="lead">
              Een beachflag bestaat uit drie onderdelen met heel verschillende
              levensduren. Het doek is het onderdeel dat slijt, de rest niet.
            </p>
          </div>
          <div className={styles.cardGrid}>
            {SIGNALEN.map((item) => (
              <div key={item.kop} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <h3>{item.kop}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* WELKE MAAT */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="maat-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">De juiste maat</Badge>
            <h2 id="maat-title">Zo weet je welke maat doek je nodig hebt.</h2>
            <p className="lead">
              Er zijn twee manieren om erachter te komen. Leg het oude doek plat
              op de grond en meet de breedte en de hoogte, tunnelzoom
              meegerekend. Weet je de maat niet meer, kijk dan naar de vorm: een
              straightflag loopt taps toe en heeft een gebogen bovenkant, een
              squareflag is recht en rechthoekig. Twijfel je nog, stuur ons dan
              een foto van de opgezette vlag met de stok erbij.
            </p>
          </div>

          <div className={styles.proseTableWrap}>
            <table
              className={styles.proseTable}
              aria-label="Beschikbare maten voor vervangingsdoeken van beachflags, per model"
            >
              <thead>
                <tr>
                  <th scope="col">Model</th>
                  <th scope="col">Maat</th>
                  <th scope="col">Breedte × hoogte</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { model: "Straightflag", maten: STRAIGHT },
                  { model: "Squareflag", maten: SQUARE },
                ].map((groep) =>
                  groep.maten.map((maat, i) => (
                    <tr key={maat.label}>
                      <td>{i === 0 ? <strong>{groep.model}</strong> : ""}</td>
                      <td>{maat.label.split("—")[0]?.trim()}</td>
                      <td>
                        {maat.widthCm} × {maat.heightCm} cm
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <Check size={20} />
            </span>
            <div>
              <h3>Meet het oude doek, niet de stok</h3>
              <p>
                De stok is altijd langer dan het doek, want een deel steekt in
                de voet. Meet dus het doek zelf. Zit je tussen twee maten in,
                kies dan de maat die het dichtst bij je meting ligt en meld het
                even bij je bestelling. Dan controleren wij het voor we gaan
                drukken.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* AANLEVEREN EN LEVERTIJD */}
      <section className={styles.section} aria-labelledby="aanleveren-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Aanleveren</Badge>
            <h2 id="aanleveren-title">
              Wat je aanlevert en wanneer het er is.
            </h2>
          </div>
          <div className={styles.prose}>
            <p>
              Je levert je ontwerp aan als pdf, ai, eps of een andere vector, of
              als afbeelding op ware grootte met voldoende resolutie. Houd aan
              de tunnelzijde en de buitenrand ruimte vrij voor de zoom, zodat er
              geen tekst of logo in de naad verdwijnt. Heb je het originele
              ontwerpbestand niet meer, stuur dan wat je hebt en een foto van de
              oude vlag; in de meeste gevallen kunnen we het opnieuw opbouwen.
            </p>
            <p>
              Je hoeft het oude doek niet naar ons op te sturen. Wij drukken een
              nieuw doek in de maat en het model die je opgeeft, met dezelfde
              tunnelzoom, zodat het op je bestaande stok past. Kies bij het
              bestellen de samenstelling waarin alleen de vlag zit, want stok en
              voet heb je al. Na goedkeuring van je ontwerp is het doek binnen
              vijf werkdagen bij je.
            </p>
            <p>
              Het oude doek kun je bij ons niet inleveren. Wat er wel mee kan
              gebeuren, lees je hieronder.
            </p>
          </div>
        </Container>
      </section>

      {/* WAAROM FLAG-CICLO BIJ VERVANGING */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="waarom-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Bij vervanging telt het zwaarder</Badge>
            <h2 id="waarom-title">
              Waarom een vervangingsdoek van biologisch afbreekbaar materiaal
              zinnig is.
            </h2>
            <p className="lead">
              Een beachflag is geen aankoop voor tien jaar. Wie er het hele
              seizoen mee buiten staat, vervangt het doek een paar keer per
              jaar. Elk vervangen doek verdwijnt daarna in de restafvalbak, want
              bedrukt vlaggendoek wordt in Nederland niet apart ingezameld. Bij
              een terugkerende vervanging telt dus zwaarder wat er met het oude
              doek gebeurt dan bij een vlag die er vijf jaar hangt.
            </p>
            <Link href={ONDERBOUWING_PAD} className={styles.arrowLink}>
              {ONDERBOUWING_LINK_TEKST} <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                <Leaf size={24} />
              </span>
              <h3>Wat er gemeten is</h3>
              <p>
                Ons doek is {DOEK.merk} van {DOEK.weverij}. In zeewater brak{" "}
                {pctNl(HOOFDTEST.afbraakPct)}% van het materiaal af in{" "}
                {HOOFDTEST.duur}, gemeten volgens {HOOFDTEST.norm}. Onbehandeld
                polyester kwam in diezelfde test niet verder dan{" "}
                {pctNl(HOOFDTEST.referentiePct ?? 0)}%. {CICLO_DISCLAIMER}
              </p>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                <Check size={24} />
              </span>
              <h3>Wat de technologie wel en niet doet</h3>
              <p>
                Het additief zit in de vezel, waardoor micro-organismen die
                vezel als voedsel herkennen en afbreken. Het zorgt er niet voor
                dat er tijdens gebruik minder vezels loslaten: een klapperende
                beachflag laat er net zoveel los als een gewone. Het verschil
                zit in wat er daarna met die vezels gebeurt.
              </p>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                <FlagBeach size={24} />
              </span>
              <h3>Dezelfde vlag om te zien</h3>
              <p>
                Je levert in op niets. Het doek weegt en drapeert als gewoon
                vlaggendoek, neemt dezelfde kleuren aan en past op de stok die
                je al hebt. De vlag zelf breekt niet af zolang hij hangt, want
                daar zijn geen micro-organismen die er langdurig bij kunnen.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Bestel je vervangingsdoek.
              </h2>
              <p className={styles.ctaSub}>
                Kies je model en maat, upload je ontwerp en selecteer de
                samenstelling waarin alleen de vlag zit. De actuele prijs per
                maat staat op de productpagina. Weet je de maat niet zeker, neem
                dan eerst contact op.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/collectie/beachvlag"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Naar de beachvlag
                </Button>
                <Link href="/contact" className={styles.ctaLink}>
                  Vraag het even na
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
