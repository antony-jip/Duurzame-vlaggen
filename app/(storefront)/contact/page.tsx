import type { Metadata } from "next";
import styles from "./page.module.css";
import { Badge, Container } from "@/components/ui";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact — offerte & advies",
  description:
    "Neem contact op met Sign Company B.V. in Enkhuizen. Bel 085 060 8963, mail info@duurzame-vlaggen.nl of vraag direct een offerte aan voor duurzame vlaggen.",
};

// Contact channels — kept as data so the markup stays tidy.
const CHANNELS = [
  {
    label: "E-mail",
    value: "info@duurzame-vlaggen.nl",
    href: "mailto:info@duurzame-vlaggen.nl",
  },
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
      {/* HERO — egaal forest vlak dat uit de header loopt, golf naar off-white. */}
      <section className={styles.hero} aria-labelledby="contact-title">
        <Container className={styles.heroInner}>
          <Badge variant="eyebrow" className={styles.heroEyebrow}>
            Contact
          </Badge>
          <h1 id="contact-title" className={styles.heroTitle}>
            Laten we je vlag laten{" "}
            <span className={styles.heroAccent}>wapperen</span>.
          </h1>
          <p className={styles.heroSub}>
            Vraag een offerte aan, bestel een gratis staal of stel je vraag over
            CSRD en compliance. We reageren binnen 24 uur — meestal sneller.
          </p>
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
                  Je vraag gaat over <strong>{product}</strong> — we hebben het
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
