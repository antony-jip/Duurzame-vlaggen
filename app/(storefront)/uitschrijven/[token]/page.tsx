import type { Metadata } from "next";
import styles from "./unsubscribe.module.css";
import { Button, Container } from "@/components/ui";
import { serverEnv } from "@/lib/env";
import { verifyEmailToken } from "@/lib/email/links";
import { confirmUnsubscribeAction } from "./actions";

/**
 * Human-facing unsubscribe page for the lifecycle e-mails. The token is a
 * signed (HMAC) e-mail address, so the page works without login or lookup and
 * cannot unsubscribe anyone else. Confirmation is an explicit button: link
 * scanners that prefetch the URL must not unsubscribe people by accident (the
 * RFC 8058 one-click POST endpoint handles mail clients).
 */

export const metadata: Metadata = {
  title: "Uitschrijven",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { token } = await params;
  const { done } = await searchParams;
  const email = verifyEmailToken(token, serverEnv.emailLinkSecret);

  if (!email) {
    return (
      <Container as="section" className={styles.page}>
        <h1>Deze link is niet geldig</h1>
        <p className="text-sm">
          Gebruik de uitschrijflink onderaan de e-mail, of mail ons via{" "}
          <a href="mailto:hello@duurzame-vlaggen.nl">hello@duurzame-vlaggen.nl</a>.
        </p>
      </Container>
    );
  }

  if (done) {
    return (
      <Container as="section" className={styles.page}>
        <h1>Je bent uitgeschreven.</h1>
        <p className="text-sm">
          {email} ontvangt geen vervangingsherinneringen meer van ons.
          Bevestigingen van bestellingen blijven gewoon komen.
        </p>
      </Container>
    );
  }

  return (
    <Container as="section" className={styles.page}>
      <h1>Geen herinneringen meer?</h1>
      <p className="text-sm">
        Klik op de knop en we sturen <strong>{email}</strong> geen
        vervangingsherinneringen meer. Bevestigingen van bestellingen blijven
        gewoon komen.
      </p>
      <form action={confirmUnsubscribeAction}>
        <input type="hidden" name="token" value={token} />
        <Button type="submit" size="lg">
          Bevestig uitschrijving
        </Button>
      </form>
    </Container>
  );
}
