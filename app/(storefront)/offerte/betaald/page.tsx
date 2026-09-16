import type { Metadata } from "next";
import { Button, Container } from "@/components/ui";
import { BEDRIJF } from "@/lib/bedrijf";
import styles from "../offerte.module.css";

/**
 * Landingspagina na de Mollie-betaallink van een offerte. Mollie stuurt hier
 * iedereen heen, ook bij een afgebroken betaling, en we hebben geen order om de
 * status in op te zoeken. Dus geen "betaald!"-claim: de webhook meldt de echte
 * betaling aan Antony.
 */

export const metadata: Metadata = {
  title: "Bedankt",
  robots: { index: false, follow: false },
};

export default async function OfferteBetaaldPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>;
}) {
  const { n } = await searchParams;
  const nummer = n && /^OF-\d{6}-[A-Z2-9]{4}$/.test(n) ? n : null;

  return (
    <Container as="section" className={styles.page}>
      <h1>Bedankt</h1>
      <p className={styles.lead}>
        Is je betaling{nummer ? ` voor offerte ${nummer}` : ""} gelukt, dan gaan we voor je aan de
        slag en nemen we contact met je op over het ontwerp. Afgebroken? Gebruik dan de betaallink
        in je mail opnieuw, of bel ons op {BEDRIJF.telefoon}.
      </p>
      <Button as="a" href="/collectie" variant="secondary">
        Terug naar de collectie
      </Button>
    </Container>
  );
}
