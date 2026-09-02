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
  Droplet,
  NoEntry,
  Check,
  Close,
  Price,
} from "@/components/ui";
import { WapperFilter } from "./home-fx";
import { BRAND_IMAGES, getAllProducts } from "@/lib/catalog/products";
import { getMessages } from "@/lib/i18n";
import {
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  // Absolute title — the root layout template would otherwise double the suffix
  // ("… | Sign Company | Duurzame Vlaggen").
  title: {
    absolute: "Duurzame Vlaggen. Biologisch afbreekbaar.",
  },
  description:
    "Biologisch afbreekbare banier-, mast-, gevel- en beachvlaggen. Van ons doek brak 94,2% af in zeewater in ruim drie en een half jaar (ASTM D6691). Binnen 5 werkdagen geleverd.",
};

/* De vier geruststellingen, als strip onder de vlaggen in plaats van als eigen
   sectie. Ze hadden een eigen kop ("Zichtbaar duurzaam") met een regel die
   hetzelfde zei als het verhaalblok erboven, en vier alinea's die niemand las.
   Wat overblijft is waar het om gaat: vier kernwoorden op de plek waar je een
   vlag kiest. De uitleg staat op /duurzaamheid. */
const USPS = [
  { icon: <Leaf size={20} />, title: "Biologisch afbreekbaar doek" },
  { icon: <Recycle size={20} />, title: "94,2% afgebroken in zeewater" },
  { icon: <Droplet size={20} />, title: "Inkt op waterbasis" },
  { icon: <NoEntry size={20} />, title: "Laat minder microplastic achter" },
  { icon: <ShieldCheck size={20} />, title: "Inkoopdossier bij elke order" },
  { icon: <Truck size={20} />, title: "Binnen 5 werkdagen geleverd" },
];

/* De levenscyclus, als beeld in plaats van als uitleg: dezelfde vlag, vier keer.
   Strak en nieuw, dan rafelig, dan een snipper in het gras, en dan alleen nog
   gras. Ze zweven mee naast het verhaal, in volgorde van verval.

   De termijnen volgen de gemeten zeewatertest (ASTM D6691, 1.362 dagen tot
   94,2% afbraak) en niet meer de oude "2-3 jaar", die nergens op gebaseerd was.
   Zie lib/claims/afbreekbaarheid.ts. */
const LEVENSCYCLUS = [
  {
    src: "/levenscyclus/in-gebruik.webp",
    alt: "Nieuwe groene vlag met logo, wapperend tegen een blauwe lucht",
    fase: "In gebruik",
    tijd: "3-4 maanden",
  },
  {
    src: "/levenscyclus/start-afbraak.webp",
    alt: "Dezelfde vlag, nu verbleekt en met rafelende randen",
    fase: "Start afbraak",
    tijd: "Na afdanking",
  },
  {
    src: "/levenscyclus/afbraak.webp",
    alt: "Een restje vlagdoek in het gras, het logo nog half leesbaar",
    fase: "Afbraak",
    tijd: "1 tot 2 jaar",
  },
  {
    src: "/levenscyclus/verdwenen.webp",
    alt: "Alleen nog gras en klaver: van de vlag is bijna niets meer terug te vinden",
    fase: "Grotendeels verdwenen",
    tijd: "Ruim 3,5 jaar",
  },
];

const STEPS = [
  {
    title: "Kies je vlag",
    body: "Selecteer het model en formaat dat bij je toepassing past. Of laat je adviseren door ons team.",
  },
  {
    title: "Upload je ontwerp",
    body: "Stuur je logo of ontwerp aan. Je ontvangt binnen één werkdag een kosteloze digitale drukproef.",
  },
  {
    title: "Wij produceren",
    body: "Het doek wordt geweven in Duitsland. Bedrukken en afwerken doen wij met inkt op waterbasis in ons Nederlandse atelier.",
  },
  {
    title: "Ontvangen en onderbouwen",
    body: "Bij je vlag zit het inkoopdossier met de testresultaten, de herkomst van het doek en de certificaten van de batch.",
  },
];

export default async function Home() {
  const { dict } = await getMessages();
  const products = getAllProducts();
  // De laagste échte prijs uit de catalogus. Hier stond een hardgecodeerde
  // € 11,50 die bij geen enkel product hoorde; na de herprijzing van
  // 2026-07-20 was het goedkoopste product € 20,00. Een "vanaf"-prijs die je
  // niet voert is niet alleen slordig, het is een misleidende prijsvermelding.
  const laagstePrijs = Math.min(...products.map((p) => p.priceFrom));

  return (
    <>
      {/* HERO — Dopper-clean: één egaal forest vlak dat naadloos uit de header
          loopt, een korte pakkende zin, en de foto in een organische
          wapper-vorm (ons water-druppel-moment: een vlag ís een golf). */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <WapperFilter />
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1 id="hero-title" className={styles.heroTitle}>
              100% vlag.
              <br />
              <span className={styles.heroAccent}>
                {pctNl(HOOFDTEST.afbraakPct)}% verdwenen.
              </span>
            </h1>
            <p className={styles.heroSub}>
              Elke vlag wappert zichzelf langzaam kapot, ook de onze. Het
              verschil zit in wat er daarna gebeurt. Van ons doek brak{" "}
              {pctNl(HOOFDTEST.afbraakPct)}% af in{" "}
              {HOOFDTEST.omgeving.toLowerCase()}, in {HOOFDTEST.duur}. Gewoon
              polyester kwam in dezelfde test niet verder dan{" "}
              {pctNl(HOOFDTEST.referentiePct ?? 0)}%.
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
              <span className={styles.heroFrom}>
                vanaf <Price amount={laagstePrijs} suffix />
              </span>
              <Link href="/contact" className={styles.heroQuote}>
                Of vraag een offerte aan
              </Link>
            </div>
            {/* Wie erachter zit. Een jong merk zonder reviews leent hier het
                vertrouwen van het familiebedrijf dat al sinds 1983 gevels en
                wagens voorziet. */}
            <p className={styles.heroTrust}>
              Onderdeel van Sign Company, familiebedrijf in signing sinds 1983.
            </p>
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

      {/* Product showcase — meteen de winkel in: fotografie, prijzen, bestellen */}
      <section
        className={`${styles.section} ${styles.shop}`}
        aria-labelledby="types-title"
      >
        <Container className={styles.shopInner}>
          <div className={styles.sectionHead}>
            <Badge variant="success">Bestel direct online</Badge>
            {/* "Kies je vlag." stond hier én als H1 op /collectie. Twee pagina's
                met dezelfde kop concurreren om dezelfde zoekvraag; deze kop
                draagt nu de term waarop de homepage staat. */}
            <h2 id="types-title">Kies je duurzame vlag.</h2>
            <p className="lead">
              Samenstellen, ontwerp uploaden, afrekenen. Binnen 5 werkdagen aan
              de mast.
            </p>
          </div>

          <div className={styles.showcase}>
            {/* Alle vijf modellen als gelijke tegels, met de echte productfoto
                in de wapper-vorm. Hier stonden pictogrammen; een foto van de
                vlag aan een echte gevel verkoopt beter dan een icoon. */}
            <div className={styles.showcaseGrid}>
              {products.map((product) => {
                return (
                  <Link
                    key={product.slug}
                    href={`/collectie/${product.slug}`}
                    className={styles.showcaseCard}
                    data-accent={product.accent}
                  >
                    <div className={styles.showcaseMedia}>
                      <Image
                        src={product.heroImage.src}
                        alt={product.heroImage.alt}
                        fill
                        sizes="(max-width: 480px) 90vw, (max-width: 760px) 45vw, (max-width: 1180px) 30vw, 18vw"
                        className={styles.showcasePhoto}
                      />
                    </div>
                    {product.badge && (
                      <Badge variant="outline" className={styles.showcaseTag}>
                        {product.badge}
                      </Badge>
                    )}
                    <div className={styles.showcaseBody}>
                      <h3>{product.name}</h3>
                      <p>{product.tagline}</p>
                      <span className={styles.showcasePrice}>
                        {dict.product.priceFrom}{" "}
                        <Price
                          amount={product.priceFrom}
                          className={styles.showcasePriceValue}
                        />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Direct onder de vlaggen: waarom je hier koopt, op het moment dat
              je kiest. Als eigen sectie stond dit een scroll verderop, los van
              de beslissing waar het over gaat. */}
          <ul className={styles.uspStrip}>
            {USPS.map((usp) => (
              <li key={usp.title}>
                <span className={styles.uspStripIcon} aria-hidden="true">
                  {usp.icon}
                </span>
                {usp.title}
              </li>
            ))}
          </ul>

          {/* De homepage rankt op termen die eigenlijk bij een dieper liggende
              pagina horen ("duurzame vlaggen bedrukken", "bedrijfsvlag",
              "pet vlaggen", "duurzame vlaggenstokken") en linkte nergens naar
              die pagina's. Wie hier landt met zo'n vraag moest terug naar de
              navigatie. Dit blok stuurt hem door, met de term als ankertekst.
              De homepage zelf blijft ongemoeid: er gaat niets af, er komt
              alleen een route bij. */}
          <p className={styles.homeLinks}>
            Zoek je iets specifieks?{" "}
            <Link href="/collectie">Duurzame vlaggen bedrukken</Link> doen we
            voor elke situatie:{" "}
            <Link href="/voor-bedrijven">bedrijfsvlaggen</Link> aan het pand,{" "}
            <Link href="/voor-gemeenten">vlaggen voor gemeenten</Link> in de
            openbare ruimte en{" "}
            <Link href="/voor-verenigingen">clubvlaggen voor verenigingen</Link>
            . Hoort er een mast bij, kijk dan bij onze{" "}
            <Link href="/collectie/vlaggenmast">duurzame vlaggenstokken</Link>.
            Wil je eerst het doek doorgronden: zo werkt{" "}
            <Link href="/materiaal">afbreekbaar polyester</Link>, en dit is wat
            het doet tegen{" "}
            <Link href="/kennisbank/microplastics">
              microplastics uit vlaggen
            </Link>
            .
          </p>
        </Container>
      </section>

      {/* HET VERHAAL — donker, filmisch blok dat je de pagina in zuigt:
          de ongemakkelijke waarheid over de vlag die er nu hangt. */}
      <section className={styles.story} aria-labelledby="story-title">
        {/* Het lichte vlak van de vlaggen erboven golft dit donkere blok in.
            Nodig sinds de winkel naar voren is gehaald: daarvoor kwam dit blok
            direct achter de hero en deed de hero-golf dit werk. */}
        <svg
          className={styles.storyWaveTop}
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z"
            fill="currentColor"
          />
        </svg>
        <Container className={styles.storyInner}>
          <p className={styles.storyKicker} id="story-title">
            De vlag die er nu hangt
          </p>
          <p className={styles.storyLine}>verliest elke dag microplastics.</p>
          {/* Probleem in vier woorden, antwoord in vier woorden, bewijs in vier
              foto's. Hier stonden nog drie grote regels; die las niemand, en ze
              duwden de foto's uit beeld. Het beeld overtuigt hier sneller dan
              de tekst, dus wint het beeld.

              Tussen deze twee koppen staat niets meer: elke regel ertussen
              breekt de dreun van probleem → antwoord. */}
          {/* "Verdwijnt" is te vaag: dan weet je nog niet wáár hij blijft.
              Er moet gewoon staan wat er gebeurt, want het woord "afbreken"
              stond alleen nog in bijschriften van 11px. */}
          <p className={`${styles.storyLine} ${styles.storyTurn}`}>
            Wat de onze verliest, breekt af.
          </p>

          {/* Het antwoord op de omslagregel, in beeld in plaats van in tekst:
              dezelfde vlag, vier keer, van nieuw tot niets. Alle vier tegelijk
              in beeld en op één rij, want de clou is de vólgorde en die moet je
              in één blik kunnen lezen. Verspreid over de sectie werkt het niet.

              Ze staan bewust ná de omslag: hiervoor gaat het over de vlag die
              er nu hangt, en dat is deze niet.

              Zonder introregel: de foto's zeggen zelf al dat het dezelfde vlag
              is, en een bijschrift dat het beeld navertelt is precies de tekst
              die niemand leest. */}
          <ol className={styles.cyclus}>
            {LEVENSCYCLUS.map((fase, i) => (
              <li
                key={fase.src}
                className={styles.cyclusFoto}
                data-fase={i + 1}
              >
                <figure>
                  {/* De wikkel draagt het verbindingslijntje naar de volgende
                      foto: zonder die lijn zijn het vier losse plaatjes, met
                      die lijn is het één proces dat verstrijkt. */}
                  <span className={styles.cyclusBeeld}>
                    <Image
                      src={fase.src}
                      alt={fase.alt}
                      width={500}
                      height={500}
                      sizes="(max-width: 767px) 40vw, 220px"
                      /* Niet lazy: deze rij staat direct onder de hero en is
                         het hele argument van de sectie. Lazy laden betekent
                         dat een snelle scroller op lege cirkels landt, en dan
                         mist hij precies de clou. Samen ~143KB. */
                      loading="eager"
                    />
                  </span>
                  <figcaption>
                    <span className={styles.cyclusFase}>{fase.fase}</span>
                    <span className={styles.cyclusTijd}>{fase.tijd}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ol>

          {/* Hier stond een live teller ("sinds je deze pagina opende: 1,7 mg
              microplastic") met een voetnoot dat het een illustratieve
              schatting was. Een cijfer dat je zelf niet hard kunt maken hoort
              niet naast een meting die je wél hard maakt; de vier foto's
              zeggen het al. */}
        </Container>
        {/* Geen golf meer onderaan: hieronder komt geen licht blok maar direct
            de plaat. De golf die dit blok de plaat in laat lopen zit in de
            figuur zelf (`doekGolfBoven`), want daar kan hij ÓVER het beeld
            vallen in plaats van op de pagina-achtergrond. */}
      </section>

      {/* HET DOEK — het beeld doet het verhaal: links de polyester vlag die
          uiteenvalt, rechts de onze die de kringloop in gaat.

          Hier stond een foto met een alinea en drie bullets. Twee van die drie
          bullets waren onwaar ("Composteerbare vezels" en "Waterloos bedrukt"),
          en de rest vertelde in woorden wat deze plaat in één blik laat zien. */}
      <section className={styles.doek} aria-labelledby="craft-title">
        {/* Eerst de klap, dan pas het woord. De plaat loopt van rand tot rand,
            direct onder het missieblok: geen kop, geen marge, geen kaartje.
            Daarna landt "Een petfles aan je mast" als onderschrift. */}
        <figure className={styles.doekBeeld}>
          {/* Hier stond een gegenereerde illustratie (petfles, wolk, plantje
              met pijlen). Die zag eruit als een illustratie, en dat ondermijnt
              precies de sectie die over écht materiaal gaat. Nu: het garen op
              de weefmachine, het doek waar het over gaat. */}
          <Image
            src="/vergelijking/doek-weven.webp"
            alt="Garen van het doek op de weefmachine"
            width={4403}
            height={2458}
            sizes="100vw"
          />

          {/* Het donkere verhaalblok golft hier de scène in. Deze golf ligt óver
              het beeld, dus zijn doorzichtige helft toont de foto in plaats van
              de pagina-achtergrond: geen witte strook. Nam de taak over van de
              missie-golf toen die sectie eruit ging. */}
          <svg
            className={styles.doekGolfBoven}
            viewBox="0 0 1440 72"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z"
              fill="currentColor"
            />
          </svg>

          {/* Dezelfde golf als tussen de andere secties. Bovenaan loopt het
              missieblok in een golf de scène in; zonder deze golf eindigde de
              plaat onderaan met een kaarsrechte snijlijn. */}
          <svg
            className={styles.doekGolf}
            viewBox="0 0 1440 72"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z"
              fill="currentColor"
            />
          </svg>
        </figure>

        <Container>
          {/* Eén raster van twee kolommen, twee rijen. Links de klap, rechts de
              weerlegging; daaronder de twee helften van de plaat, elk in de
              kolom van zijn eigen kant. Als losse rijen bleef de knop alleen
              linksonder hangen met een leeg vlak ernaast. */}
          <div className={styles.doekRaster}>
            <div className={styles.doekKop}>
              <Badge variant="detail">Het doek</Badge>
              {/* Benoemt wat je links op de plaat zag. Geen merknaam: het gaat
                  om het materiaal, niet om één concurrent. */}
              <h2 id="craft-title">Een petfles aan je mast.</h2>
            </div>
            {/* Hier stond nog een inleiding. Die vertelde precies wat het label
                linksonder ook al zegt, dus hij is weg: de plaat en twee regels
                doen het werk. */}
            <div className={styles.doekUitleg}>
              <Button
                as="a"
                href="/duurzaamheid"
                variant="secondary"
                icon={<ArrowRight />}
              >
                Zo werkt het
              </Button>
            </div>

            {/* Hetzelfde kruis en dezelfde vink als op de plaat: dát is de
                koppeling. "Links"/"Rechts" stond er eerst, maar dat moet je
                lezen, en dan werkt het dus niet. */}
            <div className={styles.doekHelft} data-kant="slecht">
              <span className={styles.doekHelftKop}>
                <span className={styles.doekTeken} aria-hidden="true">
                  <Close size={14} />
                </span>
                Gerecycled PET
              </span>
              <p>Brokkelt af tot microplastic.</p>
            </div>
            <div className={styles.doekHelft} data-kant="goed">
              <span className={styles.doekHelftKop}>
                <span className={styles.doekTeken} aria-hidden="true">
                  <Check size={14} />
                </span>
                Ons doek
              </span>
              <p>Breekt af, voor 94,2% in zeewater.</p>
            </div>
          </div>
          {/* De wettelijk vereiste onderbouwing bij de claim hierboven: elke
              pagina met een afbraakcijfer verwijst naar de meting. */}
          <p className={styles.doekBron}>
            <Link href={ONDERBOUWING_PAD} className={styles.doekBronLink}>
              {ONDERBOUWING_LINK_TEKST}
            </Link>
          </p>
        </Container>
      </section>

      {/* HOE WERKT HET — loopt over uit "Het doek": daar zie je waaróm, hier
          hoe je het koopt. Dit is het slot van de pagina, dus geen harde
          scheidslijn meer tussen het argument en de handeling. */}
      <section
        className={`${styles.section} ${styles.stepsBand}`}
        aria-labelledby="how-title"
      >
        {/* Het lichte vlak van "Het doek" golft de stappenband in. */}
        <svg
          className={styles.stepsGolf}
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,0 L0,0 Z"
            fill="currentColor"
          />
        </svg>
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

      {/* Hier stond een CTA-band ("Haal die petfles van je mast" + Stel je vlag
          samen). Die is eruit: de footer eronder sluit de pagina al af met
          dezelfde belofte en dezelfde actie, dus stonden er twee afsluiters op
          elkaar. */}
    </>
  );
}
