import type { Metadata } from "next";
import Link from "next/link";
import styles from "../info.module.css";
import { Badge, Container } from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/cookiebeleid" },
  title: "Cookiebeleid",
  description:
    "Welke cookies gebruikt Duurzame Vlaggen en waarom? Functionele en analytische cookies uitgelegd, plus hoe je je voorkeuren beheert of cookies verwijdert.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

export default function CookiebeleidPage() {
  return (
    <>
      {/* HERO — compact juridisch. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container
          className={`${styles.heroInner} ${styles.heroSingle} ${styles.heroCompact}`}
        >
          <div className={styles.heroCopy}>
            <Badge variant="eyebrow" className={styles.heroEyebrow}>
              Juridisch
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Cookiebeleid
            </h1>
            <p className={styles.heroSub}>
              Welke cookies we gebruiken, waarom we ze gebruiken en hoe je ze
              beheert, in gewoon Nederlands.
            </p>
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

      <section className={styles.sectionTight}>
        <Container>
          <div className={styles.prose}>
            <p className={styles.proseMeta}>Laatst bijgewerkt: januari 2025</p>

            <h2>1. Wat zijn cookies?</h2>
            <p>
              Cookies zijn kleine tekstbestanden die een website bij je bezoek
              op je computer, tablet of smartphone plaatst. Ze zorgen ervoor
              dat de website goed werkt (bijvoorbeeld door je winkelwagen te
              onthouden) en geven ons inzicht om de site te verbeteren.
              Cookies kunnen geen virussen verspreiden en hebben geen toegang
              tot andere informatie op je apparaat.
            </p>

            <h2>2. Welke cookies gebruiken wij?</h2>
            <h3>Functionele cookies (noodzakelijk)</h3>
            <p>
              Deze zijn nodig om de website te laten werken: ze onthouden
              bijvoorbeeld de inhoud van je winkelwagen en je sessie tijdens
              het bestellen. Zonder deze cookies kun je niet afrekenen. Voor
              functionele cookies is geen toestemming nodig.
            </p>
            <h3>Analytische cookies</h3>
            <p>
              Hiermee zien we hoe bezoekers de website gebruiken, zodat we de
              site kunnen verbeteren. We hebben onze analytics
              privacyvriendelijk ingesteld: IP-adressen worden geanonimiseerd
              en er worden geen gegevens gedeeld voor advertentiedoeleinden.
            </p>
            <h3>Marketing cookies</h3>
            <p>
              Op dit moment gebruiken we géén marketing cookies. Mocht dat in
              de toekomst veranderen, dan vragen we daarvoor altijd eerst je
              toestemming.
            </p>

            <h2>3. Je cookies beheren of verwijderen</h2>
            <p>
              Je kunt cookies op elk moment beheren of verwijderen via de
              instellingen van je browser (Chrome, Firefox, Safari of Edge):
              kies daar de optie om cookies en websitegegevens te wissen. Houd
              er rekening mee dat:
            </p>
            <ul>
              <li>je voorkeuren op websites daarna verloren gaan;</li>
              <li>je winkelwagen wordt geleegd;</li>
              <li>
                sommige delen van de website mogelijk niet goed meer werken
                als je cookies volledig uitschakelt.
              </li>
            </ul>

            <h2>4. Wijzigingen</h2>
            <p>
              We kunnen dit cookiebeleid aanpassen, bijvoorbeeld wanneer we
              nieuwe cookies gaan gebruiken of wanneer de wet dat vereist. De
              meest recente versie staat altijd op deze pagina, met bovenaan de
              datum van de laatste wijziging.
            </p>

            <h2>5. Vragen?</h2>
            <p>
              Vragen over dit cookiebeleid? Mail naar{" "}
              <a href="mailto:info@duurzame-vlaggen.nl">
                info@duurzame-vlaggen.nl
              </a>{" "}
              of bel <a href="tel:+31850608963">085 060 8963</a>. Hoe we
              omgaan met je persoonsgegevens lees je in onze{" "}
              <Link href="/privacyverklaring">privacyverklaring</Link>.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
