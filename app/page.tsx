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
  Leaf,
  Recycle,
  ShieldCheck,
  Truck,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Duurzame Vlaggen — biologisch afbreekbaar | Sign Company",
  description:
    "Laat je merk wapperen zonder de planeet te belasten. Biologisch afbreekbare banier-, mast-, gevelvlaggen en beachflags. CSRD-proof en binnen 2–4 weken geleverd.",
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
    title: "2–4 weken levertijd",
    body: "Van ontwerp tot deurmat in maximaal vier weken, inclusief kosteloze digitale drukproef en montageadvies.",
  },
];

const TYPES = [
  {
    visual: styles.typeVisualBanier,
    name: "Baniervlaggen",
    body: "Verticale banieren die opvallen bij entrees, beurzen en evenementen. Verkrijgbaar in vijf hoogtes met composteerbare grondankers.",
    tags: ["Vanaf 1 stuk", "5 formaten"],
  },
  {
    visual: styles.typeVisualMast,
    name: "Mastvlaggen",
    body: "Klassieke mastvlaggen die je merk hoog laten wapperen. Weerbestendig geweven, tóch volledig afbreekbaar aan het einde van de levensduur.",
    tags: ["Weerbestendig", "Rok of ring"],
  },
  {
    visual: styles.typeVisualGevel,
    name: "Gevelvlaggen",
    body: "Haaks op de gevel voor maximale zichtbaarheid vanaf de straat. Inclusief herbruikbare uithouder van gerecycled aluminium.",
    tags: ["Straatniveau", "Met uithouder"],
  },
  {
    visual: styles.typeVisualBeach,
    name: "Beachflags",
    body: "Lichte, meegebogen flags voor sport, festivals en pop-ups. Snel op te zetten, compact op te bergen en 100% composteerbaar doek.",
    tags: ["3 maten", "Draagtas incl."],
  },
];

const STEPS = [
  {
    title: "Kies je vlagtype",
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

export default function Home() {
  return (
    <>
      <Hero
        eyebrow={
          <Badge variant="eyebrow" icon={<Leaf size={16} />}>
            Biologisch afbreekbaar
          </Badge>
        }
        title={
          <>
            Laat je merk <span className="accent">wapperen</span>, niet de
            planeet belasten
          </>
        }
        lead="Duurzame vlaggen voor bedrijven: geweven van composteerbare vezels, waterloos bedrukt en CSRD-proof geleverd. Zichtbaar zonder afdruk op het milieu."
        actions={
          <>
            <Button as="a" href="/collectie" size="lg" icon={<ArrowRight />}>
              Bekijk collectie
            </Button>
            <Button as="a" href="/offerte" variant="secondary" size="lg">
              Vraag offerte
            </Button>
          </>
        }
        aside={
          <div className={styles.heroVisual}>
            <div className={styles.flag} aria-hidden="true">
              <span className={styles.flagMark}>
                <span>
                  <Leaf size={44} />
                </span>
              </span>
            </div>
            <StatCard
              className={`${styles.statFloat} ${styles.statA}`}
              value="100%"
              label="Biologisch afbreekbaar"
              labelTone="blue"
            />
            <StatCard
              className={`${styles.statFloat} ${styles.statB}`}
              value="CSRD-proof"
              label="Materiaalpaspoort"
              labelTone="purple"
            />
            <StatCard
              className={`${styles.statFloat} ${styles.statC}`}
              value="2–4 wkn"
              label="Levertijd"
              labelTone="blue"
            />
          </div>
        }
      />

      {/* USPs */}
      <section className={styles.section} aria-labelledby="usp-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Waarom duurzame vlaggen</Badge>
            <h2 id="usp-title">Zichtbaar wapperen zonder restafval</h2>
            <p className="lead">
              Traditionele vlaggen van polyester belanden na een campagne op de
              afvalberg. Onze vlaggen doen dat niet — en dat toon je zwart-op-wit
              aan.
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

      {/* Product types */}
      <section
        className={`${styles.section} ${styles.stepsBand}`}
        aria-labelledby="types-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="success">Collectie</Badge>
            <h2 id="types-title">Vier vlagtypes, één belofte</h2>
            <p className="lead">
              Van beursbanier tot beachflag — elk model is er in een volledig
              composteerbare uitvoering, zonder in te leveren op kleurkracht of
              levensduur.
            </p>
          </div>
          <div className={styles.typesGrid}>
            {TYPES.map((type) => (
              <Card
                key={type.name}
                hover
                className={styles.typeCard}
                elevation="raised"
              >
                <div
                  className={`${styles.typeVisual} ${type.visual}`}
                  aria-hidden="true"
                />
                <div className={styles.typeBody}>
                  <h3>{type.name}</h3>
                  <p>{type.body}</p>
                  <div className={styles.typeMeta}>
                    {type.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className={styles.section} aria-labelledby="how-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Hoe werkt het</Badge>
            <h2 id="how-title">Van ontwerp tot wapperende vlag in 4 stappen</h2>
          </div>
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
        </Container>
      </section>

      {/* CTA band */}
      <section className={styles.sectionTight} aria-labelledby="cta-title">
        <Container>
          <div className={styles.ctaBand}>
            <div className={styles.ctaInner}>
              <Badge variant="detail">Sign Company B.V.</Badge>
              <h2 id="cta-title">
                Klaar om duurzaam op te vallen?
              </h2>
              <p className="lead">
                Vraag een vrijblijvende offerte aan of vraag een gratis staal van
                ons composteerbare vlaggendoek aan. We denken graag met je mee.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/offerte"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Vraag offerte aan
                </Button>
                <Button as="a" href="/contact" variant="tertiary" size="lg">
                  Vraag een staal aan
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
