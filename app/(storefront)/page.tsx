import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import {
  Badge,
  Button,
  Container,
  ArrowRight,
  Leaf,
  Recycle,
  ShieldCheck,
  Truck,
  FlagBanier,
  FlagMast,
  FlagBeach,
  FlagGevel,
  FlagPole,
} from "@/components/ui";
import type { ComponentType } from "react";
import { WindSpecks, DecayCounter, WapperFilter } from "./home-fx";
import { BRAND_IMAGES, getAllProducts } from "@/lib/catalog/products";
import { getMessages } from "@/lib/i18n";
import { formatCurrency } from "@/lib/i18n/formatting";

export const metadata: Metadata = {
  // Absolute title — the root layout template would otherwise double the suffix
  // ("… | Sign Company | Duurzame Vlaggen").
  title: {
    absolute: "Duurzame Vlaggen — biologisch afbreekbaar | Sign Company",
  },
  description:
    "Laat je merk wapperen zonder de planeet te belasten. Biologisch afbreekbare banier-, mast-, gevelvlaggen en beachflags. CSRD-proof en binnen 5 werkdagen geleverd.",
};

const USPS = [
  {
    icon: <Leaf size={26} />,
    title: "100% biologisch afbreekbaar",
    body: "Geweven van plantaardige, composteerbare vezels. Na gebruik terug de kringloop in — geen microplastics, geen restafval.",
  },
  {
    icon: <Recycle size={26} />,
    title: "Circulair geproduceerd",
    body: "Waterloos bedrukt met pigmenten op biobasis en geproduceerd op groene stroom in eigen atelier in Nederland.",
  },
  {
    icon: <ShieldCheck size={26} />,
    title: "CSRD-proof rapportage",
    body: "Bij elke bestelling een CO₂- en materiaalpaspoort dat naadloos aansluit op je duurzaamheidsverslag.",
  },
  {
    icon: <Truck size={26} />,
    title: "Binnen 5 werkdagen geleverd",
    body: "Van ontwerp tot deurmat in 5 werkdagen (buitenland: 1,5 week), inclusief kosteloze digitale drukproef en montageadvies.",
  },
];

/* Vlagtype-pictogrammen voor de collectie-tegels — merkeigen, rustiger dan
   vijf foto's naast elkaar. */
const FLAG_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  baniervlag: FlagBanier,
  mastvlag: FlagMast,
  beachvlag: FlagBeach,
  gevelvlag: FlagGevel,
  vlaggenmast: FlagPole,
};

const STEPS = [
  {
    title: "Kies je vlag",
    body: "Selecteer het model en formaat dat bij je toepassing past — of laat je adviseren door ons team.",
  },
  {
    title: "Upload je ontwerp",
    body: "Stuur je logo of ontwerp aan. Je ontvangt binnen één werkdag een kosteloze digitale drukproef.",
  },
  {
    title: "Wij produceren circulair",
    body: "Wij weven en bedrukken je vlag waterloos op groene stroom in ons Nederlandse atelier.",
  },
  {
    title: "Ontvang & rapporteer",
    body: "Je vlag wordt CO₂-neutraal bezorgd, inclusief materiaalpaspoort voor je CSRD-verslag.",
  },
];

export default async function Home() {
  const { catalog, dict } = await getMessages();
  const products = getAllProducts();

  return (
    <>
      {/* HERO — Dopper-clean: één egaal forest vlak dat naadloos uit de header
          loopt, een korte pakkende zin, en de foto in een organische
          wapper-vorm (ons water-druppel-moment: een vlag ís een golf). */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <WapperFilter />
        {/* Snippers die met je muis mee waaien — de wind op de pagina. */}
        <WindSpecks
          className={styles.heroParticles}
          speckClassName={styles.speck}
        />
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1 id="hero-title" className={styles.heroTitle}>
              100% vlag.
              <br />
              <span className={styles.heroAccent}>0% afval.</span>
            </h1>
            <p className={styles.heroSub}>
              Gewone vlaggen slijten tot duizenden stukjes microplastic in de
              natuur. De onze composteren volledig — bedrukt in Nederland,
              geleverd binnen 5 werkdagen.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="/collectie"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Bestel direct
              </Button>
              <span className={styles.heroFrom}>vanaf € 11,50 excl. btw</span>
            </div>
          </div>

          <div className={styles.heroBlob}>
            <Image
              src={BRAND_IMAGES.homeHero.src}
              alt={BRAND_IMAGES.homeHero.alt}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 52vw"
              className={styles.heroPhoto}
            />
          </div>
        </Container>
        {/* Wapper-golf als overgang naar de collectie — de secties sluiten
            op elkaar aan met het merkmotief. */}
        <svg
          className={styles.heroWave}
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z"
            fill="currentColor"
          />
        </svg>
      </section>

      {/* HET VERHAAL — donker, filmisch blok dat je de pagina in zuigt:
          de ongemakkelijke waarheid over de vlag die er nu hangt. */}
      <section className={styles.story} aria-labelledby="story-title">
        <WindSpecks
          className={styles.storyParticles}
          speckClassName={styles.speck}
        />
        <Container className={styles.storyInner}>
          <p className={styles.storyKicker} id="story-title">
            De vlag die er nu hangt
          </p>
          <p className={styles.storyLine}>
            verliest elke dag microplastics.
          </p>
          <p className={styles.storyLine}>
            Bij wind. Bij regen. Op jouw terrein.
          </p>
          <p className={styles.storyLine}>
            En in je duurzaamheidsverslag? Daar staat er niets over.
          </p>
          <p className={`${styles.storyLine} ${styles.storyTurn}`}>
            Tijd voor een vlag die wél klopt met je verhaal.
          </p>
          <p className={styles.storyCounter}>
            Sinds je deze pagina opende:{" "}
            <DecayCounter className={styles.storyCounterNum} /> microplastic de
            natuur in.<span className={styles.storyFootnote}>*</span>
          </p>
          <p className={styles.storyFootnoteText}>
            * Illustratieve schatting voor polyester bedrijfsvlaggen in
            Nederland samen.
          </p>
        </Container>
      </section>

      {/* DE NO-BRAINER — gewone vlag vs onze vlag, in de woorden van de klant */}
      <section className={styles.brainer} aria-labelledby="brainer-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">De vergelijking</Badge>
            <h2 id="brainer-title">Waarom heb je deze nog niet?</h2>
          </div>
          <div className={styles.brainerGrid}>
            <div className={`${styles.brainerCard} ${styles.brainerOld}`}>
              <h3>De gewone vlag</h3>
              <ul>
                <li data-mark="✗">Polyester — slijt tot microplastics</li>
                <li data-mark="✗">Eindigt op de afvalberg</li>
                <li data-mark="✗">Niets te melden in je CSRD-verslag</li>
                <li data-mark="—">Scherpe print, weerbestendig</li>
              </ul>
            </div>
            <div className={`${styles.brainerCard} ${styles.brainerNew}`}>
              <h3>De duurzame vlag</h3>
              <ul>
                <li data-mark="✓">Composteert volledig — nul restafval</li>
                <li data-mark="✓">CO₂- en materiaalpaspoort bij elke order</li>
                <li data-mark="✓">Direct een regel vóór je duurzaamheidsverslag</li>
                <li data-mark="✓">Even scherpe print, even weerbestendig</li>
              </ul>
            </div>
          </div>
          <div className={styles.brainerPunch}>
            <p className={styles.brainerPunchline}>
              Bijna dezelfde prijs. <span>Totaal ander verhaal.</span>
            </p>
            <Button as="a" href="/collectie" size="lg" icon={<ArrowRight />}>
              Bestel de betere vlag
            </Button>
          </div>
        </Container>
      </section>

      {/* Product showcase — meteen de winkel in: fotografie, prijzen, bestellen */}
      <section className={styles.section} aria-labelledby="types-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="success">Bestel direct online</Badge>
            <h2 id="types-title">Kies je vlag.</h2>
            <p className="lead">
              Samenstellen, ontwerp uploaden, afrekenen — binnen 5 werkdagen aan
              de mast.
            </p>
          </div>

          <div className={styles.showcase}>
            {/* Alle vijf modellen als gelijke merk-tegels: pictogram in de
                accentkleur op een wapper-vorm. */}
            <div className={styles.showcaseGrid}>
              {products.map((product) => {
                const FlagIcon = FLAG_ICONS[product.slug] ?? FlagMast;
                return (
                  <Link
                    key={product.slug}
                    href={`/collectie/${product.slug}`}
                    className={styles.showcaseCard}
                    data-accent={product.accent}
                  >
                    <div className={styles.showcaseIconWrap}>
                      <FlagIcon size={116} aria-hidden="true" />
                      {product.badge && (
                        <Badge variant="outline" className={styles.showcaseTag}>
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                    <div className={styles.showcaseBody}>
                      <h3>{product.name}</h3>
                      <p>{product.tagline}</p>
                      <span className={styles.showcasePrice}>
                        {dict.product.priceFrom}{" "}
                        <b>{formatCurrency(product.priceFrom, catalog)}</b>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* USPs */}
      <section className={styles.section} aria-labelledby="usp-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Waarom duurzame vlaggen</Badge>
            <h2 id="usp-title">Zichtbaar duurzaam.</h2>
            <p className="lead">
              Polyester vlaggen eindigen op de afvalberg. De onze niet — en dat
              bewijs je zwart-op-wit.
            </p>
          </div>
          <div className={styles.uspGrid}>
            {USPS.map((usp) => (
              <div key={usp.title} className={styles.usp}>
                <span className={styles.uspIcon} aria-hidden="true">
                  {usp.icon}
                </span>
                <h3>{usp.title}</h3>
                <p>{usp.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Missie — Dopper-achtig kleurblok: de merkbelofte kolossaal in forest,
          begrensd door wapper-golven (een vlag ís een golf). */}
      <section className={styles.mission} aria-labelledby="mission-title">
        <svg
          className={styles.wave}
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z"
            fill="currentColor"
          />
        </svg>
        <div className={styles.missionBlock}>
          <Container className={styles.missionInner}>
            <span className={styles.missionEyebrow}>Onze missie</span>
            <h2 id="mission-title" className={styles.missionTitle}>
              Geen microplastics.
              <br />
              Wél <span className={styles.missionAccent}>vlagvertoon</span>.
            </h2>
            <p className={styles.missionBody}>
              Elke polyester vlag eindigt als plastic afval. De onze niet: het
              doek composteert na gebruik volledig — en dat bewijzen we bij elke
              bestelling zwart-op-wit.
            </p>
            <div className={styles.missionStats} aria-label="Kerncijfers">
              <div className={styles.missionStat}>
                <span className={styles.missionStatValue}>100%</span>
                <span className={styles.missionStatLabel}>
                  Composteerbaar doek
                </span>
              </div>
              <div className={styles.missionStat}>
                <span className={styles.missionStatValue}>0</span>
                <span className={styles.missionStatLabel}>Microplastics</span>
              </div>
              <div className={styles.missionStat}>
                <span className={styles.missionStatValue}>5</span>
                <span className={styles.missionStatLabel}>
                  Werkdagen levertijd
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
          <path
            d="M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z"
            fill="currentColor"
          />
        </svg>
      </section>

      {/* Craft / material story — atmospheric weaving shot */}
      <section className={styles.craft} aria-labelledby="craft-title">
        <Container className={styles.craftInner}>
          <div className={styles.craftMedia}>
            {/* Scherpe afwerkingsfoto — ambacht in beeld; de wazige
                weefsel-shot is bewust vervangen. */}
            <Image
              src={BRAND_IMAGES.finishing.src}
              alt={BRAND_IMAGES.finishing.alt}
              fill
              sizes="(max-width: 900px) 100vw, 46vw"
              className={styles.craftPhoto}
            />
          </div>
          <div className={styles.craftBody}>
            <Badge variant="detail">Het doek</Badge>
            <h2 id="craft-title">Geweven om te wapperen. Niet om te blijven.</h2>
            <p>
              Ons Flag-CiCLO®-doek voelt en print als premium polyester, maar is
              opgebouwd uit vezels die na hun leven volledig in de natuur
              afbreken — in jaren, niet in eeuwen. Geen microplastics, geen
              afvalberg.
            </p>
            <ul className={styles.craftList}>
              <li>
                <Leaf size={18} aria-hidden="true" /> Composteerbare vezels,
                CSRD-onderbouwd
              </li>
              <li>
                <Recycle size={18} aria-hidden="true" /> Waterloos bedrukt op
                groene stroom
              </li>
              <li>
                <ShieldCheck size={18} aria-hidden="true" /> Kleurvast en
                weerbestendig in gebruik
              </li>
            </ul>
            <Button
              as="a"
              href="/duurzaamheid"
              variant="secondary"
              icon={<ArrowRight />}
            >
              Zo werkt het
            </Button>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section
        className={`${styles.section} ${styles.stepsBand}`}
        aria-labelledby="how-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Hoe werkt het</Badge>
            <h2 id="how-title">In vier stappen aan de mast.</h2>
          </div>
          <div className={styles.stepsWrap}>
            {/* Wapper-lijn die de stappen verbindt en zichzelf tekent bij
                het scrollen — de route van ontwerp naar mast. */}
            <svg
              className={styles.stepsLine}
              viewBox="0 0 1200 44"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0,22 C150,44 300,0 450,22 C600,44 750,0 900,22 C1020,40 1120,12 1200,22"
                pathLength={1}
              />
            </svg>
            <ol className={styles.steps}>
              {STEPS.map((step, i) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepNum} aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* CTA band */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Klaar om te wapperen?
              </h2>
              <p className={styles.ctaSub}>
                Bestel direct, of vraag eerst een gratis staal van het doek aan.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/collectie"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Bestel direct
                </Button>
                <a href="/contact" className={styles.ctaLink}>
                  Vraag een gratis staal aan
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
