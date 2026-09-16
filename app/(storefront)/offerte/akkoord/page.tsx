import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { BEDRIJF } from "@/lib/bedrijf";
import { serverEnv } from "@/lib/env";
import { offerteVerlopen, verifyOfferteToken } from "@/lib/offerte/token";
import styles from "../offerte.module.css";
import { AkkoordFormulier } from "./AkkoordFormulier";

/**
 * Offerte accepteren. De klant komt hier via de knop in de offertemail; het
 * ondertekende token draagt nummer, bedrag en geldigheid. Bevestigen is een
 * expliciete knop: linkscanners die de URL vooraf openen, accepteren zo niets.
 */

export const metadata: Metadata = {
  title: "Offerte accepteren",
  robots: { index: false, follow: false },
};

const euro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const datumNL = (iso: string) =>
  new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

export default async function OfferteAkkoordPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const offerte = t ? verifyOfferteToken(t, serverEnv.emailLinkSecret) : null;

  if (!t || !offerte) {
    return (
      <Container as="section" className={styles.page}>
        <h1>Deze link werkt niet</h1>
        <p className={styles.lead}>
          Gebruik de knop in de mail bij je offerte, of bel ons op {BEDRIJF.telefoon}.
        </p>
      </Container>
    );
  }

  if (offerteVerlopen(offerte)) {
    return (
      <Container as="section" className={styles.page}>
        <h1>Deze offerte is verlopen</h1>
        <p className={styles.lead}>
          Offerte {offerte.n} was geldig tot en met {datumNL(offerte.g)}. Stel je vlag opnieuw
          samen op de site voor een actuele offerte, of bel ons op {BEDRIJF.telefoon}.
        </p>
      </Container>
    );
  }

  return (
    <Container as="section" className={styles.page}>
      <h1>Offerte accepteren</h1>
      <p className={styles.lead}>
        Bevestig je naam en e-mailadres. Je krijgt direct een betaallink in je mail.
      </p>

      <dl className={styles.samenvatting}>
        <dt>Offerte</dt>
        <dd>{offerte.n}</dd>
        <dt>Voor</dt>
        <dd>{offerte.o}</dd>
        <dt>Product</dt>
        <dd>{offerte.s}</dd>
        <dt>Totaal</dt>
        <dd>{euro(offerte.t)} incl. btw</dd>
        <dt>Geldig tot</dt>
        <dd>{datumNL(offerte.g)}</dd>
      </dl>

      <AkkoordFormulier token={t} naam={offerte.nm} email={offerte.e} handwerk={Boolean(offerte.h)} />
    </Container>
  );
}
