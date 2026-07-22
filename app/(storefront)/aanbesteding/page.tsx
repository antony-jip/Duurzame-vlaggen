import type { Metadata } from "next";
import Link from "next/link";
import styles from "../info.module.css";
import {
  Badge,
  Button,
  Container,
  ArrowRight,
  Check,
  NoEntry,
  ShieldCheck,
} from "@/components/ui";
import {
  AFBRAAK_TESTS,
  CICLO_DISCLAIMER,
  DOEK,
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";
import { breadcrumbJsonLd, jsonLd } from "@/lib/seo";

/**
 * Bestekpagina voor inkopers.
 *
 * Bestaansreden: PIANOo publiceert wel maatschappelijk verantwoorde
 * inkoopcriteria voor textiel en bedrijfskleding, maar niets voor vlaggen. Wie
 * de eerste bruikbare formulering aanreikt, bepaalt in de praktijk de norm.
 * Daarom staat hier één blok dat een inkoper letterlijk kan overnemen.
 *
 * Alle cijfers komen uit `lib/claims/afbreekbaarheid.ts`. Niets hardcoderen:
 * een bestektekst met een cijfer dat elders op de site anders staat, is precies
 * het soort onderbouwing waar een inkoper op afhaakt.
 *
 * De pagina benoemt bewust het tegenargument (de textielcriteria sturen op
 * recyclaat, ons doek is nieuw materiaal met een additief). Dat weglaten zou de
 * hele pagina ongeloofwaardig maken bij de enige lezer die telt.
 */

export const metadata: Metadata = {
  alternates: { canonical: "/aanbesteding" },
  title: "Bestektekst duurzame vlaggen. Aanbesteding en inkoopcriteria",
  description: `Kant-en-klare bestektekst voor duurzame vlaggen: eis, bewijsmiddel en gunningscriterium voor biologisch afbreekbaar vlaggendoek. Met de gemeten uitkomst van ${pctNl(HOOFDTEST.afbraakPct)}% afbraak in zeewater in ${HOOFDTEST.duur} volgens ${HOOFDTEST.norm}.`,
};

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Gestructureerde data: alleen het kruimelpad. Geen FAQPage, want deze pagina
// heeft geen vraag-en-antwoordblok, en geen aggregateRating of review.
const BREADCRUMB_JSON_LD = jsonLd(
  breadcrumbJsonLd([
    { naam: "Home", pad: "/" },
    { naam: "Bestektekst duurzame vlaggen", pad: "/aanbesteding" },
  ]),
);

/** Eén regel bestektekst: wat je eist, waarmee het wordt aangetoond, hoe je weegt. */
interface BestekRegel {
  onderwerp: string;
  eis: string;
  bewijsmiddel: string;
  gunning: string;
}

/**
 * De bestektekst zelf.
 *
 * Harde regel bij het uitbreiden hiervan: elk bewijsmiddel moet iets zijn dat
 * wij daadwerkelijk kunnen leveren. Een eis waar wij zelf niet aan voldoen
 * hoort hier niet, want dan is het geen bestektekst maar reclame.
 */
const BESTEK: readonly BestekRegel[] = [
  {
    onderwerp: "Biologische afbreekbaarheid van het doek",
    eis: `Het vlaggendoek is aantoonbaar biologisch afbreekbaar. De inschrijver toont dit aan met een meting volgens een genormeerde testmethode en vermeldt daarbij de testomgeving, het gemeten afbraakpercentage en de looptijd van de test. Een claim zonder deze gegevens wordt niet als bewijs aanvaard.`,
    bewijsmiddel: `Testrapport met volledige normaanduiding, bijvoorbeeld ${HOOFDTEST.norm} voor ${HOOFDTEST.omgeving.toLowerCase()}, inclusief de uitkomst van het onbehandelde referentiemonster dat in dezelfde test is meegelopen.`,
    gunning: `Het aantal omgevingen waarin het doek onafhankelijk is getest en de gemeten afbraak per omgeving. Meer geteste omgevingen leveren meer punten op dan één gunstige uitschieter.`,
  },
  {
    onderwerp: "Herkomst en natrekbaarheid",
    eis: "De inschrijver maakt de herkomst van het doek natrekbaar tot en met de weverij. Merknaam, weefselnaam, artikelnummer en de naam en vestigingsplaats van de weverij zijn per levering bekend.",
    bewijsmiddel:
      "Materiaalpaspoort per order, met de genoemde gegevens en het ordernummer waarop het betrekking heeft. Op verzoek aangevuld met het batchcertificaat van de gebruikte productiepartij.",
    gunning:
      "Levert de inschrijver het materiaalpaspoort standaard bij elke order, of pas op verzoek achteraf? Standaard meeleveren weegt zwaarder, omdat het dossier dan ook compleet is als er niemand om vraagt.",
  },
  {
    onderwerp: "Chemische veiligheid van het doek",
    eis: "Het doek en de gebruikte inkten zijn gekeurd op schadelijke stoffen voor mens en milieu, en voldoen aan de Europese verordening voor veilig gebruik van chemische stoffen.",
    bewijsmiddel:
      "OEKO-TEX® ECO PASSPORT voor het doek, aangevuld met de REACH-verklaring van de leverancier. Certificaatnummers worden op verzoek verstrekt.",
    gunning:
      "Certificering op het niveau van de grondstof en het chemisch bestanddeel weegt zwaarder dan een verklaring die alleen over het eindproduct gaat.",
  },
  {
    onderwerp: "Onderbouwing van de milieuclaims",
    eis: "Elke milieuclaim in de inschrijving is onderbouwd conform EU-richtlijn 2024/825, die vanaf 27 september 2026 van toepassing is. Generieke claims zonder testmethode, omstandigheden, percentage en termijn worden terzijde gelegd.",
    bewijsmiddel:
      "Een publiek raadpleegbare onderbouwing waarin per claim de norm, de omgeving, het percentage en de termijn staan, plus de grenzen van de test.",
    gunning:
      "De volledigheid van de onderbouwing, inclusief de vermelding van wat de technologie niet doet. Een inschrijver die dat zelf benoemt, hoef je later niet te corrigeren.",
  },
] as const;

export default function AanbestedingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: BREADCRUMB_JSON_LD }}
      />
      {/* HERO — waarom deze pagina bestaat. */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Container className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Badge
              variant="eyebrow"
              icon={<ShieldCheck size={16} />}
              className={styles.heroEyebrow}
            >
              Voor inkopers en aanbestedende diensten
            </Badge>
            <h1 id="hero-title" className={styles.heroTitle}>
              Bestektekst voor{" "}
              <span className={styles.heroAccent}>duurzame vlaggen</span>.
            </h1>
            <p className={styles.heroSub}>
              Voor bedrijfskleding en textiel bestaan er landelijke
              inkoopcriteria. Voor vlaggen bestaat er niets. Wie een vlag
              aanbesteedt, moet de duurzaamheidseis dus zelf formuleren, en komt
              dan uit bij leveranciers die allemaal roepen dat ze duurzaam zijn.
              Hieronder staat een bestektekst die je letterlijk kunt overnemen,
              met per regel de eis, het bewijsmiddel en het gunningscriterium.
            </p>
            <div className={styles.heroActions}>
              <Button
                as="a"
                href="/contact"
                variant="secondary"
                size="lg"
                icon={<ArrowRight />}
              >
                Vraag het inkoopdossier op
              </Button>
              <Link href={ONDERBOUWING_PAD} className={styles.heroLink}>
                {ONDERBOUWING_LINK_TEKST}
              </Link>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Kerngegevens">
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>
                {pctNl(HOOFDTEST.afbraakPct)}%
              </span>
              <span className={styles.heroStatLabel}>
                Afgebroken in zeewater in {HOOFDTEST.duur} ({HOOFDTEST.norm})
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>
                {AFBRAAK_TESTS.length}
              </span>
              <span className={styles.heroStatLabel}>
                Onafhankelijk geteste omgevingen
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>27-09-2026</span>
              <span className={styles.heroStatLabel}>
                Vanaf deze datum geldt EU-richtlijn 2024/825
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

      {/* WAT JE WEL KUNT UITVRAGEN */}
      <section className={styles.section} aria-labelledby="waarom-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Het vertrekpunt</Badge>
            <h2 id="waarom-title">
              Er is geen inkoopcriterium voor vlaggen. Wat vraag je dan uit?
            </h2>
            <p className="lead">
              De landelijke criteriadocumenten gaan over bedrijfskleding en
              textiel in het algemeen. Een vlag valt daar in de praktijk buiten:
              hij wordt niet gewassen, niet gedragen en niet ingezameld, hij
              hangt jarenlang in weer en wind en verweert aan de rand. Dat maakt
              de gebruikelijke textieleisen slecht toepasbaar en laat een gat in
              het bestek achter.
            </p>
          </div>
          <div className={styles.prose}>
            <p>
              Wat wel werkt, is uitvragen op drie dingen die een leverancier
              zwart op wit kan aantonen. Ten eerste wat er met het materiaal
              gebeurt als het uiteindelijk in het milieu belandt, gemeten
              volgens een genormeerde testmethode. Ten tweede waar het doek
              vandaan komt en of dat tot de weverij natrekbaar is. Ten derde of
              het doek is gekeurd op schadelijke stoffen. Alle drie zijn
              controleerbaar met een document, en juist dat maakt ze bruikbaar
              in een aanbesteding.
            </p>
            <p>
              Stel de eis zo dat een leverancier die het niet kan aantonen ook
              echt afvalt. Een eis die alleen zegt dat het doek duurzaam moet
              zijn, kan iedereen aanvinken. Een eis waarin de norm, de omgeving,
              het percentage en de termijn genoemd moeten worden, kan alleen
              worden ingevuld door wie het heeft laten testen.
            </p>
          </div>
        </Container>
      </section>

      {/* HET BESTEKTEKSTBLOK */}
      <section
        className={`${styles.section} ${styles.band}`}
        aria-labelledby="bestek-title"
      >
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="primary">Bestektekst</Badge>
            <h2 id="bestek-title">
              Eis, bewijsmiddel en gunningscriterium, klaar om over te nemen.
            </h2>
            <p className="lead">
              Vier regels die je in een bestek of programma van eisen kunt
              plakken. Elk bewijsmiddel is iets dat wij zelf ook leveren, dus je
              vraagt hier niets uit dat in de markt niet bestaat.
            </p>
            <Link href={ONDERBOUWING_PAD} className={styles.arrowLink}>
              {ONDERBOUWING_LINK_TEKST} <ArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.proseTableWrap}>
            <table
              className={styles.proseTable}
              aria-label="Voorbeeldbestektekst voor duurzame vlaggen, met per onderwerp de eis, het bewijsmiddel en het gunningscriterium"
            >
              <thead>
                <tr>
                  <th scope="col">Eis</th>
                  <th scope="col">Bewijsmiddel</th>
                  <th scope="col">Gunningscriterium</th>
                </tr>
              </thead>
              <tbody>
                {BESTEK.map((regel) => (
                  <tr key={regel.onderwerp}>
                    <td>
                      <strong>{regel.onderwerp}</strong>
                      <br />
                      {regel.eis}
                    </td>
                    <td>{regel.bewijsmiddel}</td>
                    <td>{regel.gunning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <Check size={20} />
            </span>
            <div>
              <h3>Wat wij op die eisen invullen</h3>
              <p>
                Ons doek is {DOEK.merk}, geweven door {DOEK.weverij}, en is in{" "}
                {AFBRAAK_TESTS.length} omgevingen getest volgens ASTM-normen. In
                zeewater brak {pctNl(HOOFDTEST.afbraakPct)}% van het materiaal
                af in {HOOFDTEST.duur} ({HOOFDTEST.norm}); het onbehandelde
                polyester dat in dezelfde test meeliep kwam niet verder dan{" "}
                {pctNl(HOOFDTEST.referentiePct ?? 0)}%. {CICLO_DISCLAIMER}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* HET TEGENARGUMENT */}
      <section className={styles.section} aria-labelledby="tegen-title">
        <Container>
          <div className={styles.sectionHead}>
            <Badge variant="personal">Het tegenargument, eerlijk benoemd</Badge>
            <h2 id="tegen-title">
              De bestaande textielcriteria sturen op gerecycled materiaal. Ons
              doek is dat niet.
            </h2>
            <p className="lead">
              Als je de landelijke textielcriteria één op één overneemt, valt
              ons doek af. Dat verzwijgen zou onhandig zijn, want je komt er in
              de beoordeling toch achter.
            </p>
          </div>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                <NoEntry size={24} />
              </span>
              <h3>Wat wij niet zijn</h3>
              <p>
                {DOEK.merk} is nieuw polyester met een additief in de vezel. Het
                is geen recyclaat. Een eis met een minimumpercentage gerecycled
                materiaal halen wij dus niet, en wij gaan die eis ook niet
                creatief uitleggen.
              </p>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                <Check size={24} />
              </span>
              <h3>Waar de twee criteria op sturen</h3>
              <p>
                Een eis op recyclaat stuurt op de grondstof, dus op wat er aan
                de voorkant het product in gaat. Een eis op afbreekbaarheid
                stuurt op wat er aan de achterkant achterblijft, in de berm, in
                de sloot of op de stortplaats. Dat zijn twee verschillende
                vragen, en ze hebben niet hetzelfde antwoord.
              </p>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                <ShieldCheck size={24} />
              </span>
              <h3>De keuze die je zelf moet maken</h3>
              <p>
                Vind je beide belangrijk, maak dat dan expliciet. Zet ze
                bijvoorbeeld naast elkaar als gunningscriteria met een eigen
                weging, in plaats van recyclaat als harde eis te stellen en
                afbreekbaarheid daarmee onbedoeld uit te sluiten. Een vlag wordt
                aan het einde van zijn leven zelden ingezameld, dus voor deze
                productgroep is de vraag wat er achterblijft geen bijzaak.
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
                Het dossier zit bij elke bestelling.
              </h2>
              <p className={styles.ctaSub}>
                Bij elke order leveren wij het inkoopdossier mee, met de
                testrapporten, de herkomst van het doek en de certificaten. Heb
                je het eerder nodig, bijvoorbeeld om je bestek te schrijven of
                een inschrijving te beoordelen, vraag het dan vooraf op. Wij
                sturen het dezelfde werkdag toe.
              </p>
              <div className={styles.ctaActions}>
                <Button
                  as="a"
                  href="/contact"
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight />}
                >
                  Vraag het dossier vooraf op
                </Button>
                <Link href="/voor-gemeenten" className={styles.ctaLink}>
                  Voor gemeenten
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
