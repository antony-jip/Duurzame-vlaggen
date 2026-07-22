import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import styles from "./page.module.css";
import {
  Badge,
  Button,
  Container,
  ArrowRight,
  Leaf,
  Recycle,
  ShieldCheck,
  FlagBanier,
  FlagMast,
  FlagBeach,
  FlagGevel,
  FlagPole,
  Price,
} from "@/components/ui";
import { BRAND_IMAGES, getAllProducts } from "@/lib/catalog/products";
import { getMessages } from "@/lib/i18n";
import {
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";

/** Percentage in Nederlandse notatie (94.2 → "94,2"). */

export const metadata: Metadata = {
  alternates: { canonical: "/over-ons" },
  title: "Ons verhaal",
  description:
    "De vlaggenbranche concurreert op de laagste prijs en het doek is het kind van de rekening. Flag-CiCLO® is ander doek: biologisch afbreekbaar, gemeten volgens ASTM.",
};

/* Wat de klant eraan heeft, niet waar wij voor staan. Drie bezwaren, in de
   volgorde waarin een koper ze stelt: lever ik iets in? merk ik het? kan ik het
   hardmaken tegenover mijn eigen mensen? */
const OPBRENGST = [
  {
    icon: <Recycle size={26} />,
    title: "Je levert niets in",
    body: "Flag-CiCLO® wappert, kleurt en slijt precies als polyester. Kleurvast, weerbestendig, scherp bedrukt. Alleen het einde is anders.",
  },
  {
    icon: <Leaf size={26} />,
    title: "Je laat minder microplastic achter",
    body: `Vezels die tijdens gebruik loslaten breken af in plaats van te blijven liggen. In zeewater brak ${pctNl(HOOFDTEST.afbraakPct)}% van het doek af in ${HOOFDTEST.duur} (${HOOFDTEST.code}).`,
  },
  {
    icon: <ShieldCheck size={26} />,
    title: "Je kunt het hardmaken",
    body: "Bij elke bestelling zit een materiaalpaspoort: de vier ASTM-testrapporten, OEKO-TEX en REACH. Genoeg voor je duurzaamheidsverslag, zonder dat iemand erover doorvraagt.",
  },
];

/* Vlagtype-pictogrammen — zelfde tegels als de homepage, want dit is dezelfde
   keuze. Het verhaal eindigt waar de klant iets kan doen. */
const FLAG_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  baniervlag: FlagBanier,
  mastvlag: FlagMast,
  beachvlag: FlagBeach,
  gevelvlag: FlagGevel,
  vlaggenmast: FlagPole,
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

export default async function OverOnsPage() {
  const { dict } = await getMessages();
  const products = getAllProducts();

  return (
    <>
      {/* HERO — positionering in twee regels: waar de branche staat, en aan
          welke kant wij staan. Het beeld is het doek zelf, want daar gaat deze
          pagina over. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<Leaf size={16} />}
              className={styles.heroEyebrow}
            >
              Ons verhaal
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              De vlaggenbranche racet naar de bodem.{" "}
              <span className={styles.heroAccent}>
                Wij gaan de andere kant op.
              </span>
            </h1>
            <p className={styles.heroSub}>
              Wij zijn er voor bedrijven die op een duurzame manier willen
              opvallen. Dat begint niet bij een keurmerk of een verhaal. Dat
              begint bij het doek.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="#kies"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Kies je vlag
              </Button>
            </div>
          </div>

          <div className={styles.heroBlob}>
            <Image
              src="/vergelijking/doek-weven.webp"
              alt="Weefgetouw waarop honderden losse Flag-CiCLO-draden tot doek worden geweven"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
              className={styles.heroPhoto}
            />
          </div>
        </Container>
      </section>

      {/* DE RACE — donker blok, de aanklacht tegen de eigen branche. De hero
          golft er rechtstreeks in (geen off-white strook ertussen). */}
      <section className={styles.race} aria-labelledby="race-title">
        <svg
          className={styles.raceGolfBoven}
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={WAVE_PATH} fill="currentColor" />
        </svg>
        <Container className={styles.raceInner}>
          <p className={styles.raceKicker} id="race-title">
            Hoe het werkt in onze branche
          </p>
          <p className={styles.raceLine}>
            Vlaggen worden verkocht op{" "}
            <span className={styles.raceAccent}>
              één ding: de laagste prijs.
            </span>
          </p>
          <p className={styles.raceBody}>
            Elke leverancier onderbiedt de vorige. Er gaat een cent van het doek
            af, een cent van de inkt, een cent van de afwerking. Wat overblijft
            is het goedkoopste polyester dat er te krijgen is. Niemand vraagt
            meer waar dat vandaan komt, en al helemaal niet waar het heen gaat.
          </p>
          <p className={styles.racePunch}>
            Duurzaamheid is in die race geen kwaliteit. Het is een kostenpost.
          </p>
        </Container>
        <svg
          className={styles.raceGolfOnder}
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={WAVE_PATH} fill="currentColor" />
        </svg>
      </section>

      {/* HET DOEK — het hart van de pagina. Eerst de greenwash weerlegd (PET),
          dan wat Flag-CiCLO® wél anders doet, en dan waar het voor de klant op
          uitkomt: zijn merk. Beeld: de close-up van het doek zelf. */}
      <section className={styles.materiaal} aria-labelledby="doek-title">
        <Container className={styles.materiaalInner}>
          <div className={styles.materiaalBeeld}>
            <Image
              src={BRAND_IMAGES.fabricDetail.src}
              alt={BRAND_IMAGES.fabricDetail.alt}
              fill
              /* Bron is 655×540 — klein. Vandaar de kleine weergave (zie de
                 max-width in de CSS): groter uitvergroten wordt zichtbaar zacht. */
              sizes="(max-width: 900px) 100vw, 420px"
              className={styles.materiaalFoto}
            />
          </div>
          <div className={styles.materiaalCopy}>
            <Badge variant="personal">Het doek</Badge>
            <h2 id="doek-title" className={styles.materiaalTitel}>
              Alles staat of valt bij het doek.
            </h2>
            <p className={styles.materiaalBody}>
              Wat de branche duurzaam noemt, is meestal een petfles die tot
              draad is getrokken. Recycled PET. Het klinkt goed, het kost niets
              extra, en het is nog altijd polyester: het brokkelt net zo hard af
              tot microplastic. Het label is duurzaam, het doek niet.
            </p>
            <p className={styles.materiaalBody}>
              Flag-CiCLO® is wél ander doek. In de vezel zit een additief dat
              micro-organismen een ingang geeft, waardoor ze het polyester echt
              kunnen verteren. Geen sticker op hetzelfde spul, maar een vezel
              die zich anders gedraagt zodra hij is afgedankt.
            </p>
            <p className={styles.materiaalBody}>
              Daar wappert jouw merk straks op. Net zo fel, net zo lang, alleen
              zonder de nalatenschap.
            </p>
            {/* Subtiele uitstap naar alle vijf de vlaggen: wie hier al om is,
                hoeft niet door te scrollen naar het blok onderaan. */}
            <p className={styles.doekLinks}>
              <span className={styles.doekLinksLabel}>
                Bekijk het doek op je
              </span>
              {products.map((product, i) => (
                <span key={product.slug}>
                  {i > 0 && <span aria-hidden="true"> · </span>}
                  <Link href={`/collectie/${product.slug}`}>
                    {product.name}
                  </Link>
                </span>
              ))}
            </p>
          </div>
        </Container>
      </section>

      {/* WAT JIJ ERAAN HEBT — de drie bezwaren, in koperstaal. */}
      <section className={styles.sectionTight} aria-labelledby="values-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="success">Wat jij eraan hebt</Badge>
            <h2 id="values-title">Je levert niets in. Behalve het plastic.</h2>
          </div>
          <div className={styles.valuesGrid}>
            {OPBRENGST.map((value) => (
              <div key={value.title} className={styles.value}>
                <span className={styles.valueIcon} aria-hidden="true">
                  {value.icon}
                </span>
                <h3>{value.title}</h3>
                <p>{value.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* BEWIJS — forest band tussen wapper-golven. Alleen cijfers, geen betoog:
          hier is het verhaal verteld en moet het nog kloppen. */}
      <section className={styles.mission} aria-labelledby="proof-title">
        <svg
          className={styles.wave}
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={WAVE_PATH} fill="currentColor" />
        </svg>
        <div className={styles.missionBlock}>
          <Container className={styles.missionInner}>
            <h2 id="proof-title" className={styles.missionTitle}>
              Gemeten, niet{" "}
              <span className={styles.missionAccent}>beloofd</span>.
            </h2>
            <div className={styles.missionStats} aria-label="Kerncijfers">
              <div className={styles.missionStat}>
                <span className={styles.missionStatValue}>
                  {pctNl(HOOFDTEST.afbraakPct)}%
                </span>
                <span className={styles.missionStatLabel}>
                  Biologisch afgebroken in zeewater
                </span>
              </div>
              <div className={styles.missionStat}>
                <span className={styles.missionStatValue}>3,8%</span>
                <span className={styles.missionStatLabel}>
                  Onbehandeld polyester in dezelfde test
                </span>
              </div>
              <div className={styles.missionStat}>
                <span className={styles.missionStatValue}>
                  {HOOFDTEST.duur}
                </span>
                <span className={styles.missionStatLabel}>
                  Testduur volgens {HOOFDTEST.norm}
                </span>
              </div>
            </div>
            <p className={styles.missionStatLabel}>
              <Link href={ONDERBOUWING_PAD}>{ONDERBOUWING_LINK_TEKST}</Link>
            </p>
          </Container>
        </div>
        <svg
          className={`${styles.wave} ${styles.waveBottom}`}
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={WAVE_PATH} fill="currentColor" />
        </svg>
      </section>

      {/* KIES JE VLAG — het verhaal eindigt in een keuze, niet in een praatje.
          Zelfde tegels als de homepage: wie hier komt, is overtuigd. */}
      <section
        id="kies"
        className={styles.sectionTight}
        aria-labelledby="kies-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="success">Bestel direct online</Badge>
            <h2 id="kies-title">Kies je vlag.</h2>
            <p className="lead">
              Samenstellen, ontwerp uploaden, afrekenen. Binnen 5 werkdagen aan
              de mast.
            </p>
          </div>
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
        </Container>
      </section>
    </>
  );
}
