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
  FlagBanier,
  FlagMast,
  FlagBeach,
  FlagGevel,
  FlagPole,
  Price,
} from "@/components/ui";
import type { ComponentType } from "react";
import { WindSpecks, DecayCounter, WapperFilter } from "./home-fx";
import { BRAND_IMAGES, getAllProducts } from "@/lib/catalog/products";
import { getMessages } from "@/lib/i18n";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  // Absolute title — the root layout template would otherwise double the suffix
  // ("… | Sign Company | Duurzame Vlaggen").
  title: {
    absolute: "Duurzame Vlaggen. Biologisch afbreekbaar.",
  },
  description:
    "Elke gewone vlag wappert uiteen tot microplastic. De onze niet. Biologisch afbreekbare banier-, mast-, gevel- en beachvlaggen. Binnen 5 werkdagen geleverd.",
};

/* De vier geruststellingen, als strip onder de vlaggen in plaats van als eigen
   sectie. Ze hadden een eigen kop ("Zichtbaar duurzaam") met een regel die
   hetzelfde zei als het verhaalblok erboven, en vier alinea's die niemand las.
   Wat overblijft is waar het om gaat: vier kernwoorden op de plek waar je een
   vlag kiest. De uitleg staat op /duurzaamheid. */
const USPS = [
  { icon: <Leaf size={20} />, title: "100% biologisch afbreekbaar" },
  { icon: <Droplet size={20} />, title: "Inkt op waterbasis" },
  { icon: <NoEntry size={20} />, title: "PVC-vrij" },
  { icon: <Recycle size={20} />, title: "Recyclebaar" },
  { icon: <ShieldCheck size={20} />, title: "Klaar voor je CSRD-verslag" },
  { icon: <Truck size={20} />, title: "Binnen 5 werkdagen geleverd" },
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

/* De levenscyclus, als beeld in plaats van als uitleg: dezelfde vlag, vier keer.
   Strak en nieuw, dan rafelig, dan een snipper in het gras, en dan alleen nog
   gras. Die laatste foto is letterlijk niets — dat ís "0% afval".
   Ze zweven mee naast het verhaal, in volgorde van verval. */
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
    tijd: "1-2 jaar",
  },
  {
    src: "/levenscyclus/verdwenen.webp",
    alt: "Alleen nog gras en klaver: van de vlag is niets meer terug te vinden",
    fase: "Verdwenen",
    tijd: "2-3 jaar",
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
    title: "Wij produceren circulair",
    body: "Wij weven je vlag en bedrukken hem met inkt op waterbasis, op groene stroom, in ons Nederlandse atelier.",
  },
  {
    title: "Ontvang & rapporteer",
    body: "Je vlag wordt CO₂-neutraal bezorgd, inclusief materiaalpaspoort voor je CSRD-verslag.",
  },
];

export default async function Home() {
  const { dict } = await getMessages();
  const products = getAllProducts();
  const laagstePrijs = Math.min(...products.map((p) => p.priceFrom));

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
              Elke gewone vlag wappert zichzelf kapot tot duizenden stukjes
              microplastic. De onze breekt volledig af. Gedrukt in Nederland.
              Binnen 5 werkdagen op je mast.
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

      {/* Product showcase — meteen de winkel in: fotografie, prijzen, bestellen */}
      <section
        className={`${styles.section} ${styles.shop}`}
        aria-labelledby="types-title"
      >
        <Container className={styles.shopInner}>
          <div className={styles.sectionHead}>
            <Badge variant="success">Bestel direct online</Badge>
            <h2 id="types-title">Kies je vlag.</h2>
            <p className="lead">
              Samenstellen, ontwerp uploaden, afrekenen. Binnen 5 werkdagen aan
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
                        <Price amount={product.priceFrom} className={styles.showcasePriceValue} />
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
            De onze breekt gewoon af.
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
              <li key={fase.src} className={styles.cyclusFoto} data-fase={i + 1}>
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

          {/* Onderaan, als onderbouwing bij het beeld. De teller staat bewust
              níét tussen de twee koppen: daar brak hij de dreun. Hier staat hij
              naast zijn eigen voetnoot, waar de asterisk ook thuishoort. */}
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
          <Image
            src="/vergelijking/polyester-vs-duurzaam.webp"
            alt="Links een vlag van gerecycled plastic die uiteenvalt in microplastics, die neerslaan in de bodem en het water. Rechts een Duurzame Vlaggen-vlag die overgaat in bladeren en terugkeert in de kringloop."
            width={2534}
            height={1075}
            sizes="100vw"
            priority
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

          {/* Kruis op de petflesvlag, vink op de onze, midden op de plaat zelf.
              "Links" en "Rechts" waren woorden, en woorden worden niet gelezen:
              zo hoef je alleen te kíjken. Dezelfde twee tekens staan hieronder
              bij de tekst, dus de koppeling is visueel in plaats van talig.
              Percentages, want de plaat schaalt mee. */}
          <span className={styles.doekMerk} data-kant="slecht" aria-hidden="true">
            <Close size={26} />
          </span>
          <span className={styles.doekMerk} data-kant="goed" aria-hidden="true">
            <Check size={26} />
          </span>

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
              <p>Breekt af tot niets.</p>
            </div>
          </div>
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
