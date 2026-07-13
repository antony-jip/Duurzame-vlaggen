import type { Metadata } from "next";
import Link from "next/link";
import styles from "../info.module.css";
import { Badge, Container } from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/algemene-voorwaarden" },
  title: "Algemene voorwaarden",
  description:
    "De algemene voorwaarden van Duurzame Vlaggen (Sign Company B.V.): aanbod, overeenkomst, herroepingsrecht, levering, betaling en klachtenregeling.",
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

export default function AlgemeneVoorwaardenPage() {
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
              Algemene voorwaarden
            </h1>
            <p className={styles.heroSub}>
              Duurzame Vlaggen is onderdeel van Sign Company B.V. Deze
              voorwaarden zijn gebaseerd op de algemene voorwaarden van
              Stichting Webshop Keurmerk, opgesteld in overleg met de
              Consumentenbond.
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

            <h2>Artikel 1 — Identiteit van de ondernemer</h2>
            <div className={styles.proseCard}>
              <p>
                <strong>Sign Company B.V.</strong>, handelend onder de naam
                Duurzame Vlaggen
                <br />
                De Drie Kronen 115, 1601 MT Enkhuizen
                <br />
                Telefoon: <a href="tel:+31850608963">085 060 8963</a>{" "}
                (maandag t/m vrijdag, 9:00–17:00 uur)
                <br />
                E-mail:{" "}
                <a href="mailto:info@duurzame-vlaggen.nl">
                  info@duurzame-vlaggen.nl
                </a>
                <br />
                KvK-nummer: 36011150 · BTW-nummer: NL006284267B01
              </p>
            </div>

            <h2>Artikel 2 — Toepasselijkheid</h2>
            <p>
              Deze voorwaarden gelden voor elk aanbod van Duurzame Vlaggen en
              voor elke overeenkomst op afstand tussen ons en jou als
              consument. We stellen de tekst van deze voorwaarden beschikbaar
              voordat de overeenkomst wordt gesloten; bij een elektronische
              bestelling kun je ze eenvoudig opslaan. Bij tegenstrijdige
              aanvullende voorwaarden geldt altijd de bepaling die voor jou het
              gunstigst is.
            </p>

            <h2>Artikel 3 — Het aanbod</h2>
            <p>
              Elk aanbod bevat een volledige en nauwkeurige omschrijving van de
              producten, zodat je het goed kunt beoordelen. Afbeeldingen zijn
              een waarheidsgetrouwe weergave. Kennelijke vergissingen of fouten
              in het aanbod binden ons niet. Heeft een aanbod een beperkte
              geldigheidsduur of voorwaarden, dan vermelden we dat er
              nadrukkelijk bij.
            </p>

            <h2>Artikel 4 — De overeenkomst</h2>
            <p>
              De overeenkomst komt tot stand zodra jij het aanbod aanvaardt en
              aan de gestelde voorwaarden voldoet. Bestel je online, dan
              bevestigen we de ontvangst van je bestelling direct per e-mail.
              Zolang die bevestiging niet is verzonden, kun je de overeenkomst
              ontbinden. We zorgen voor een veilige webomgeving en passende
              beveiliging van je gegevens en betaling.
            </p>

            <h2>Artikel 5 — Herroepingsrecht</h2>
            <p>
              Je kunt een aankoop gedurende een bedenktijd van 14 dagen zonder
              opgave van redenen ontbinden. De bedenktijd gaat in op de dag
              nadat jij (of een door jou aangewezen ontvanger) het product hebt
              ontvangen. Tijdens de bedenktijd ga je zorgvuldig om met het
              product en de verpakking: je mag het product hanteren en
              inspecteren zoals je dat in een winkel zou doen.
            </p>
            <p>
              Wil je herroepen? Meld dit binnen de bedenktijd via het
              modelformulier of op een andere ondubbelzinnige manier, en stuur
              het product binnen 14 dagen terug — waar mogelijk in originele
              staat en verpakking. De rechtstreekse kosten van terugzending
              zijn voor jouw rekening. Wij betalen alle betalingen, inclusief
              eventuele leveringskosten, binnen 14 dagen na je melding terug
              met hetzelfde betaalmiddel.
            </p>
            <div className={styles.proseCard}>
              <p>
                <strong>Let op — maatwerk is uitgesloten:</strong> vlaggen die
                op jouw specificatie zijn bedrukt (met eigen logo of ontwerp)
                zijn volgens de wet uitgesloten van het herroepingsrecht. Dit
                zijn producten die volgens jouw individuele keuze zijn
                vervaardigd.
              </p>
            </div>

            <h2>Artikel 6 — De prijs</h2>
            <p>
              Gedurende de geldigheidsduur van een aanbod verhogen we de
              prijzen niet, behalve bij wijzigingen in btw-tarieven. De in het
              aanbod genoemde prijzen zijn inclusief btw. Prijsverhogingen
              binnen drie maanden na het sluiten van de overeenkomst zijn
              alleen toegestaan als ze het gevolg zijn van wettelijke
              regelingen.
            </p>

            <h2>Artikel 7 — Nakoming en garantie</h2>
            <p>
              We staan ervoor in dat producten voldoen aan de overeenkomst, de
              vermelde specificaties en redelijke eisen van deugdelijkheid.
              Een door ons of de fabrikant verstrekte extra garantie beperkt
              nooit je wettelijke rechten. Zie ook onze{" "}
              <Link href="/garantie">garantievoorwaarden</Link> per
              productgroep.
            </p>

            <h2>Artikel 8 — Levering en uitvoering</h2>
            <p>
              We leveren op het adres dat jij aan ons hebt doorgegeven en
              voeren geaccepteerde bestellingen uiterlijk binnen 30 dagen uit,
              tenzij een andere termijn is afgesproken. Loopt de bezorging
              vertraging op, dan hoor je dat uiterlijk 30 dagen na je
              bestelling en mag je de overeenkomst kosteloos ontbinden. Het
              risico van beschadiging of vermissing ligt bij ons tot het moment
              van bezorging.
            </p>

            <h2>Artikel 9 — Betaling</h2>
            <p>
              Tenzij anders overeengekomen betaal je binnen 14 dagen na het
              ingaan van de bedenktermijn. Als consument kun je nooit verplicht
              worden tot vooruitbetaling van meer dan 50%. Betaal je niet op
              tijd, dan ontvang je eerst een herinnering met een termijn van 14
              dagen; daarna kunnen wettelijke rente en incassokosten in
              rekening worden gebracht (maximaal 15% over de eerste €2.500,
              met een minimum van €40).
            </p>

            <h2>Artikel 10 — Klachten</h2>
            <p>
              Klachten over de uitvoering van de overeenkomst dien je binnen
              bekwame tijd, volledig en duidelijk omschreven bij ons in. We
              beantwoorden klachten binnen 14 dagen; vraagt de afhandeling
              langer, dan laten we binnen die termijn weten wanneer je een
              uitvoerig antwoord kunt verwachten. Je kunt klachten ook melden
              via het{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Europese ODR-platform
              </a>
              .
            </p>

            <h2>Artikel 11 — Geschillen</h2>
            <p>
              Op alle overeenkomsten waarop deze voorwaarden betrekking hebben
              is uitsluitend Nederlands recht van toepassing, ook als je in het
              buitenland woont. Het Weens Koopverdrag is niet van toepassing.
              Aanvullende of afwijkende bepalingen mogen nooit in jouw nadeel
              zijn en worden schriftelijk vastgelegd.
            </p>

            <h2>Bijlage — Modelformulier voor herroeping</h2>
            <p>
              Wil je de overeenkomst herroepen? Stuur dan onderstaande gegevens
              aan Sign Company B.V. (Duurzame Vlaggen), De Drie Kronen 115,
              1601 MT Enkhuizen, of per e-mail aan{" "}
              <a href="mailto:info@duurzame-vlaggen.nl">
                info@duurzame-vlaggen.nl
              </a>
              :
            </p>
            <ul>
              <li>
                De mededeling dat je de overeenkomst over de volgende producten
                herroept (met aanduiding van het product)
              </li>
              <li>Datum van bestelling en/of ontvangst</li>
              <li>Je naam en adres</li>
              <li>Datum en (bij een papieren formulier) je handtekening</li>
            </ul>

            <p>
              Vragen over deze voorwaarden?{" "}
              <Link href="/contact">Neem gerust contact op</Link> — we helpen
              je graag.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
