import type { Metadata } from "next";
import Link from "next/link";
import styles from "../info.module.css";
import {
  Badge,
  Button,
  Container,
  ArrowRight,
  Check,
  Droplet,
  NoEntry,
  ShieldCheck,
} from "@/components/ui";
import {
  AFBRAAK_TESTS,
  CERTIFICATEN,
  CICLO_DISCLAIMER,
  DOEK,
  HOOFDTEST,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";
import { breadcrumbJsonLd, jsonLd } from "@/lib/seo";

/**
 * De claimpagina: de onderbouwing waar elke afbreekbaarheidsclaim op de site
 * naartoe linkt.
 *
 * Deze pagina bestaat omdat EU-richtlijn 2024/825 (Empowering Consumers,
 * geldig vanaf 27 september 2026) kale milieuclaims verbiedt. Met testmethode,
 * omstandigheden, percentage en termijn erbij is "biologisch afbreekbaar" geen
 * claim meer maar een meting. Alle cijfers komen uit
 * `lib/claims/afbreekbaarheid.ts`, nergens hardgecodeerd.
 *
 * De pagina zegt bewust ook wat CiCLO NIET doet. Dat is geen bescheidenheid
 * maar de kern: het versnelt de afbraak van afgegeven vezels, het vermindert de
 * afgifte niet.
 */

export const metadata: Metadata = {
  alternates: { canonical: "/afbreekbaarheid" },
  title: "Biologisch afbreekbaar vlaggendoek. De testresultaten",
  description:
    "Wat betekent biologisch afbreekbaar precies? Vier onafhankelijke ASTM-tests in zeewater, bodem, stortplaats en rioolslib, met percentages, termijnen en de grenzen van de test. Geen claim zonder cijfer.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Gestructureerde data: alleen het kruimelpad. Geen FAQPage, want deze pagina
// heeft geen vraag-en-antwoordblok, en geen aggregateRating of review.
const BREADCRUMB_JSON_LD = jsonLd(
  breadcrumbJsonLd([
    { naam: "Home", pad: "/" },
    { naam: "Biologisch afbreekbaar vlaggendoek", pad: "/afbreekbaarheid" },
  ]),
);

/** Wat CiCLO wel en niet doet — het misverstand dat we zelf hebben gevoed. */
const WEL_NIET = [
  {
    icon: <Check size={24} />,
    kop: "Wat het wel doet",
    body: "CiCLO® zit verwerkt in de vezel zelf. Micro-organismen herkennen die vezel daardoor als voedsel en breken hem af, ook op plekken waar gewoon polyester eeuwenlang blijft liggen. Dat is wat de tests hieronder meten.",
  },
  {
    icon: <NoEntry size={24} />,
    kop: "Wat het niet doet",
    body: "Een vlag van Flag-CiCLO® laat tijdens gebruik net zoveel vezels los als een gewone polyester vlag. De technologie vermindert de afgifte niet, hij versnelt de afbraak van wat is afgegeven. Wie iets anders beweert, verkoopt je een verhaal.",
  },
  {
    icon: <NoEntry size={24} />,
    kop: "Wat het niet is",
    body: "Flag-CiCLO® is niet composteerbaar. Die claim is door de maker van de technologie uitdrukkelijk verboden, omdat compostering andere normen en veel kortere termijnen kent dan de tests hieronder. Gooi een afgedankte vlag dus niet op de composthoop.",
  },
];

export default function AfbreekbaarheidPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: BREADCRUMB_JSON_LD }}
      />
      {/* HERO — het cijfer en meteen de context erbij. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<ShieldCheck size={16} />}
              className={styles.heroEyebrow}
            >
              Labresultaten, geen beloftes
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Biologisch afbreekbaar.{" "}
              <span className={styles.heroAccent}>
                Dit is wat dat betekent.
              </span>
            </h1>
            <p className={styles.heroSub}>
              Iedere vlaggenleverancier noemt zichzelf duurzaam. Vrijwel niemand
              zet er een getal bij. Wij wel, en ook de grenzen ervan. Ons doek
              is in vier omgevingen getest volgens internationale ASTM-normen.
              In zeewater brak {pctNl(HOOFDTEST.afbraakPct)}% van het materiaal
              af in {HOOFDTEST.duur}. Onbehandeld polyester kwam in dezelfde
              test niet verder dan {pctNl(HOOFDTEST.referentiePct ?? 0)}%.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="/contact"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Vraag de testrapporten op
              </Button>
              <Link href="/materiaal" className={styles.heroLink}>
                Hoe werkt het materiaal?
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerncijfers">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>
                {pctNl(HOOFDTEST.afbraakPct)}%
              </span>
              <span className={styles.heroStatLabel}>
                Afgebroken in zeewater
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>
                {pctNl(HOOFDTEST.referentiePct ?? 0)}%
              </span>
              <span className={styles.heroStatLabel}>
                Gewoon polyester, zelfde test
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>
                {AFBRAAK_TESTS.length}
              </span>
              <span className={styles.heroStatLabel}>Testomgevingen</span>
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

      {/* DE TABEL — de kern van de pagina. */}
      <section className={styles.section} aria-labelledby="tests-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">De vier tests</Badge>
            <h2 id="tests-title">Vier omgevingen, vier uitkomsten.</h2>
            <p className="lead">
              Elke test is uitgevoerd door een onafhankelijk laboratorium, naast
              een controlemonster van onbehandeld polyester. Die vergelijking is
              het hele punt: hetzelfde doek, dezelfde omstandigheden, alleen het
              additief verschilt.
            </p>
          </div>

          <div className={styles.proseTableWrap}>
            <table
              className={styles.proseTable}
              aria-label="Afbraakpercentages van Flag-CiCLO tegenover onbehandeld polyester, per ASTM-testmethode"
            >
              <thead>
                <tr>
                  <th scope="col">Omgeving</th>
                  <th scope="col">Norm</th>
                  <th scope="col">Testduur</th>
                  <th scope="col">Flag-CiCLO®</th>
                  <th scope="col">Onbehandeld polyester</th>
                </tr>
              </thead>
              <tbody>
                {AFBRAAK_TESTS.map((test) => (
                  <tr key={test.norm}>
                    <td>
                      <strong>{test.omgeving}</strong>
                      <br />
                      <span className={styles.proseMeta}>
                        {test.toelichting}
                      </span>
                    </td>
                    <td>{test.norm}</td>
                    <td>
                      {test.duur}
                      <br />
                      <span className={styles.proseMeta}>
                        {test.dagen.toLocaleString("nl-NL")} dagen
                      </span>
                    </td>
                    <td>
                      <strong>{pctNl(test.afbraakPct)}%</strong>
                    </td>
                    <td>
                      {test.referentiePct == null
                        ? "Geen afbraak gemeten"
                        : `${pctNl(test.referentiePct)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <Droplet size={20} />
            </span>
            <div>
              <h3>De grenzen van deze cijfers</h3>
              <p>{CICLO_DISCLAIMER}</p>
              <p>
                Een vlag in een berm ligt niet in een testvat. De temperatuur
                wisselt, de microbiologie verschilt per plek en er is geen
                gecontroleerde vochtigheid. Reken deze termijnen dus als een
                ondergrens van wat mogelijk is onder gunstige omstandigheden,
                niet als een garantie voor jouw specifieke situatie. Dat is
                precies waarom wij geen enkele afbraaktermijn noemen zonder de
                norm en de omgeving erbij.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* WEL EN NIET — de eerlijke afbakening. */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="welniet-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Eerlijk afbakenen</Badge>
            <h2 id="welniet-title">Wat de technologie wel en niet doet.</h2>
            <p className="lead">
              Hier gaat het in deze markt het vaakst mis, en wij hebben die fout
              zelf ook gemaakt. Afbraak versnellen is iets anders dan afgifte
              voorkomen.
            </p>
          </div>
          <div className={styles.cardGrid}>
            {WEL_NIET.map((item) => (
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

      {/* HERKOMST EN CERTIFICATEN — voor de inkoper. */}
      <section className={styles.section} aria-labelledby="herkomst-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Herkomst</Badge>
            <h2 id="herkomst-title">Natrekbaar tot aan de weverij.</h2>
            <p className="lead">
              Wij voeren één doek. Geen assortiment waarin je zelf moet
              uitzoeken welke variant nu de duurzame is.
            </p>
          </div>

          <div className={styles.proseTableWrap}>
            <table
              className={styles.proseTable}
              aria-label="Herkomst van het vlaggendoek"
            >
              <thead>
                <tr>
                  <th scope="col">Gegeven</th>
                  <th scope="col">Waarde</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Doek</td>
                  <td>{DOEK.merk}</td>
                </tr>
                <tr>
                  <td>Samenstelling</td>
                  <td>{DOEK.samenstelling}</td>
                </tr>
                <tr>
                  <td>Geweven door</td>
                  <td>{DOEK.weverij}</td>
                </tr>
                <tr>
                  <td>Weefselnaam</td>
                  <td>{DOEK.weefselnaam}</td>
                </tr>
                <tr>
                  <td>Artikelnummers</td>
                  <td>{DOEK.artikelnummers.join(" · ")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.cardGrid}>
            {CERTIFICATEN.map((cert) => (
              <div key={cert.naam} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  <ShieldCheck size={24} />
                </span>
                <h3>{cert.naam}</h3>
                <p>{cert.omschrijving}</p>
                <span className={styles.cardValue}>
                  {cert.nummer
                    ? `Certificaatnummer ${cert.nummer}`
                    : "Certificaatnummer op aanvraag"}
                </span>
              </div>
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
                Nodig voor een aanbesteding?
              </h2>
              <p className={styles.ctaSub}>
                Bij elke bestelling zit een inkoopdossier met deze
                testresultaten, de herkomst van het doek en de certificaten van
                jouw batch. Nodig je het eerder? Vraag het op, dan sturen we het
                dezelfde werkdag.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/contact"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Vraag het dossier op
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
