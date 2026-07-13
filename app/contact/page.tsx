import type { Metadata } from "next";
import styles from "./page.module.css";
import { Badge, Card, Container } from "@/components/ui";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
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
    <div className={styles.page}>
      <Container>
        <div className={styles.intro}>
          <Badge variant="primary">Contact</Badge>
          <h1>Laten we je vlag laten wapperen</h1>
          <p className="lead">
            Vraag een offerte aan, bestel een gratis staal of stel je vraag over
            CSRD en compliance. We reageren binnen 24 uur — meestal sneller.
          </p>
        </div>

        <div className={styles.layout}>
          {/* Contact details */}
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

            <Card elevation="flat" className={styles.promise}>
              <p className={styles.promiseTitle}>Sign Company B.V.</p>
              <p className={styles.promiseBody}>
                Levering binnen 3–4 werkdagen door heel Nederland. Bij elke
                bestelling ontvang je de certificaten en ESRS E2-5-documentatie
                voor je duurzaamheidsverslag.
              </p>
            </Card>
          </aside>

          {/* Contact / quote form */}
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
    </div>
  );
}
