import type { Metadata } from "next";
import Link from "next/link";
import styles from "../info.module.css";
import { Badge, Container } from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/privacyverklaring" },
  title: "Privacyverklaring",
  description:
    "Hoe Duurzame Vlaggen (Sign Company B.V.) omgaat met jouw persoonsgegevens: wat we verzamelen, waarom, hoe lang we het bewaren en welke rechten je hebt.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

export default function PrivacyverklaringPage() {
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
              Privacyverklaring
            </h1>
            <p className={styles.heroSub}>
              We respecteren je privacy en behandelen de gegevens die je met
              ons deelt vertrouwelijk. Hier lees je welke gegevens we
              verzamelen, waarom, en welke rechten je hebt.
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

            <h2>Wie is verantwoordelijk?</h2>
            <div className={styles.proseCard}>
              <p>
                <strong>Sign Company B.V.</strong>, handelend onder de naam
                Duurzame Vlaggen
                <br />
                De Drie Kronen 115, 1601 MT Enkhuizen
                <br />
                Telefoon: <a href="tel:+31850608963">085 060 8963</a>
                <br />
                E-mail:{" "}
                <a href="mailto:info@duurzame-vlaggen.nl">
                  info@duurzame-vlaggen.nl
                </a>
                <br />
                KvK-nummer: 36011150
              </p>
            </div>

            <h2>1. Welke gegevens verzamelen we?</h2>
            <p>
              We verzamelen alleen gegevens die nodig zijn om je bestelling te
              verwerken en je goed van dienst te zijn:
            </p>
            <ul>
              <li>
                <strong>Contactgegevens</strong>: naam en eventueel
                bedrijfsnaam, e-mailadres, telefoonnummer, factuur- en
                afleveradres
              </li>
              <li>
                <strong>Bestelgegevens</strong>: bestelde producten en
                specificaties, geüploade logo's en ontwerpen, betaalgegevens
                (verwerkt door onze betaalprovider) en bestelhistorie
              </li>
              <li>
                <strong>Websitegebruik</strong>: IP-adres, browsertype,
                bezochte pagina's en verwijzende website
              </li>
            </ul>

            <h2>2. Waarom verzamelen we deze gegevens?</h2>
            <div className={styles.proseTableWrap}>
              <table className={styles.proseTable}>
                <thead>
                  <tr>
                    <th>Doel</th>
                    <th>Grondslag</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Verwerken en leveren van bestellingen</td>
                    <td>Uitvoering overeenkomst</td>
                  </tr>
                  <tr>
                    <td>Versturen van facturen en offertes</td>
                    <td>Uitvoering overeenkomst / toestemming</td>
                  </tr>
                  <tr>
                    <td>Klantenservice en beantwoorden van vragen</td>
                    <td>Uitvoering overeenkomst / gerechtvaardigd belang</td>
                  </tr>
                  <tr>
                    <td>Verbeteren van website en dienstverlening</td>
                    <td>Gerechtvaardigd belang</td>
                  </tr>
                  <tr>
                    <td>Nieuwsbrieven</td>
                    <td>Alleen met jouw toestemming</td>
                  </tr>
                  <tr>
                    <td>Belastingadministratie</td>
                    <td>Wettelijke verplichting</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>3. Hoe lang bewaren we je gegevens?</h2>
            <p>Niet langer dan noodzakelijk:</p>
            <div className={styles.proseTableWrap}>
              <table className={styles.proseTable}>
                <thead>
                  <tr>
                    <th>Type gegevens</th>
                    <th>Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Klantgegevens en bestelhistorie</td>
                    <td>7 jaar na laatste bestelling (wettelijke plicht)</td>
                  </tr>
                  <tr>
                    <td>Facturen en financiële administratie</td>
                    <td>7 jaar (wettelijke plicht)</td>
                  </tr>
                  <tr>
                    <td>Offerteaanvragen zonder bestelling</td>
                    <td>1 jaar na laatste contact</td>
                  </tr>
                  <tr>
                    <td>Geüploade ontwerpen en logo's</td>
                    <td>1 jaar na laatste bestelling</td>
                  </tr>
                  <tr>
                    <td>Nieuwsbriefvoorkeuren</td>
                    <td>Tot je je afmeldt</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>4. Delen we je gegevens met derden?</h2>
            <p>
              We verkopen je gegevens nooit. Wel schakelen we partijen in die
              nodig zijn om onze diensten te leveren: betaalproviders,
              verzendpartners, onze hostingprovider, e-mailsoftware en
              boekhoudsoftware. Met al deze verwerkers hebben we
              verwerkersovereenkomsten gesloten. Daarnaast delen we gegevens
              alleen als we daartoe wettelijk verplicht zijn.
            </p>

            <h2>5. Cookies</h2>
            <p>
              Onze website gebruikt cookies: kleine tekstbestandjes die bij je
              bezoek op je apparaat worden geplaatst. Welke cookies dat zijn en
              hoe je ze beheert, lees je in ons{" "}
              <Link href="/cookiebeleid">cookiebeleid</Link>.
            </p>

            <h2>6. Beveiliging</h2>
            <p>
              We nemen passende technische en organisatorische maatregelen
              tegen misbruik, verlies en onbevoegde toegang: een versleutelde
              verbinding (https), beveiligde servers binnen de EU, beperkte
              toegang tot persoonsgegevens, sterke wachtwoorden met
              tweefactorauthenticatie waar mogelijk, regelmatige back-ups en
              up-to-date software.
            </p>

            <h2>7. Jouw rechten</h2>
            <p>Op grond van de AVG heb je recht op:</p>
            <ul>
              <li>Inzage in de gegevens die we van je hebben</li>
              <li>Rectificatie van onjuiste gegevens</li>
              <li>
                Verwijdering van je gegevens (voor zover wettelijk toegestaan)
              </li>
              <li>Beperking van de verwerking</li>
              <li>Dataportabiliteit (je gegevens in overdraagbaar formaat)</li>
              <li>Bezwaar tegen de verwerking</li>
              <li>Intrekken van eerder gegeven toestemming</li>
            </ul>
            <p>
              Wil je een van deze rechten gebruiken? Mail naar{" "}
              <a href="mailto:info@duurzame-vlaggen.nl">
                info@duurzame-vlaggen.nl
              </a>
              . We reageren binnen 30 dagen. Om je privacy te beschermen kunnen
              we je vragen je te identificeren.
            </p>

            <h2>8. Wijzigingen</h2>
            <p>
              We kunnen deze privacyverklaring aanpassen wanneer onze
              dienstverlening of de wet verandert. De meest recente versie
              staat altijd op deze pagina; bij belangrijke wijzigingen
              informeren we je per e-mail of via de website.
            </p>

            <h2>9. Vragen of klachten?</h2>
            <p>
              Vragen over deze verklaring of over hoe we met je gegevens
              omgaan? <Link href="/contact">Neem contact op</Link>. We helpen
              je graag. Kom je er met ons niet uit, dan heb je altijd het recht
              een klacht in te dienen bij de{" "}
              <a
                href="https://www.autoriteitpersoonsgegevens.nl/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Autoriteit Persoonsgegevens
              </a>
              .
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
