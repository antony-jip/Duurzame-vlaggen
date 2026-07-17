import type { Metadata } from "next";
import Image from "next/image";
import styles from "./page.module.css";
import { Badge, Container } from "@/components/ui";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact, offerte en advies",
  description:
    "Neem contact op met Duurzame Vlaggen in Enkhuizen. Stel je vraag via het formulier of bel 085 060 8963. Je hebt binnen 24 uur antwoord.",
};

// Contactkanalen. GEEN mailadres: dit is een webshop en alles loopt via het
// formulier hiernaast, zodat aanvragen gestructureerd binnenkomen in plaats van
// als losse mail. De telefoon blijft: dat is de terugvaloptie als het formulier
// het niet doet, en die staat ook in de foutmelding van /api/contact.
const CHANNELS = [
  {
    label: "Telefoon",
    value: "085 060 8963",
    href: "tel:+31850608963",
  },
  {
    label: "Vestiging",
    value: "Enkhuizen, Nederland",
    href: undefined,
  },
];

const WAVE_PATH =
  "M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z";

// Next 16: searchParams is a Promise and must be awaited.
interface ContactPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const rawProduct = params.product;
  const product =
    typeof rawProduct === "string" && rawProduct.trim().length > 0
      ? rawProduct.trim()
      : undefined;

  return (
    <>
      {/* HERO — forest vlak dat uit de header loopt, golf naar off-white. Erachter
          de distributiekaart: vanuit Enkhuizen door heel Nederland. Zelfde
          behandeling als de zee in de footer — een gradient dooft hem weg zodat
          het sfeer is en geen foto in een kader. Decoratief, dus aria-hidden:
          de kop vertelt het verhaal al. */}
      <section className={styles.hero} aria-labelledby="contact-title">
        <div className={styles.heroKaartWrap} aria-hidden="true">
          <Image
            src="/contact/kaart-nederland.webp"
            alt=""
            fill
            sizes="100vw"
            priority
            className={styles.heroKaart}
          />
        </div>
        <Container className={styles.heroInner}>
          <div className={styles.heroTekst}>
            <Badge variant="eyebrow" className={styles.heroEyebrow}>
              Contact
            </Badge>
            <h1 id="contact-title" className={styles.heroTitle}>
              Tijd om te{" "}
              <span className={styles.heroAccent}>wapperen</span>.
            </h1>
            <p className={styles.heroSub}>
              Stel je vraag via het formulier hieronder. Je hebt binnen 24 uur
              antwoord, meestal sneller.
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

      {/* BODY — contactgegevens + formulier. */}
      <section className={styles.body}>
        <Container>
          <div className={styles.layout}>
            {/* Contactgegevens */}
            <aside className={styles.details} aria-labelledby="details-title">
              <h2 id="details-title" className={styles.detailsTitle}>
                Direct contact
              </h2>
              <dl className={styles.channels}>
                {CHANNELS.map((channel) => (
                  <div key={channel.label} className={styles.channel}>
                    <dt className={styles.channelLabel}>{channel.label}</dt>
                    <dd className={styles.channelValue}>
                      {channel.href ? (
                        <a href={channel.href}>{channel.value}</a>
                      ) : (
                        channel.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className={styles.promise}>
                <p className={styles.promiseTitle}>Duurzame Vlaggen</p>
                <p className={styles.promiseBody}>
                  Levering binnen 5 werkdagen door heel Nederland (buitenland:
                  1,5 week). Bij elke bestelling ontvang je de certificaten en
                  ESRS E2-5-documentatie voor je duurzaamheidsverslag.
                </p>
              </div>
            </aside>

            {/* Contact / offerteformulier */}
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Stuur ons een bericht</h2>
              {product && (
                <p className={styles.prefillNote}>
                  Je vraag gaat over <strong>{product}</strong>. We hebben het
                  onderwerp alvast ingevuld.
                </p>
              )}
              <ContactForm defaultProduct={product} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
