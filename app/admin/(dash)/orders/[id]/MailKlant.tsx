"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui";
import { stuurKlantMailAction, type MailState } from "./actions";
import styles from "../../admin.module.css";

/**
 * "Mail de klant" — de drie snelknoppen uit de kunstdoekje-admin.
 *
 * Client-component om twee redenen: de gekozen soort stuurt de UI (alleen
 * "Vraag" heeft een berichtveld), en we willen de uitkomst tonen zonder
 * navigatie. De mail-HTML zelf wordt server-side gebouwd
 * (lib/email/templates.ts) — die hoort niet in de browser-bundle.
 */

const SOORTEN = [
  { key: "in_productie", label: "In productie" },
  { key: "verzonden", label: "Verzonden" },
  { key: "vraag", label: "Vraag" },
] as const;

type Soort = (typeof SOORTEN)[number]["key"];

const initieel: MailState = {};

export function MailKlant({
  orderId,
  email,
  mailIngesteld,
}: {
  orderId: string;
  email: string;
  mailIngesteld: boolean;
}) {
  const [soort, setSoort] = useState<Soort>("in_productie");
  const [state, formAction, bezig] = useActionState(stuurKlantMailAction, initieel);

  return (
    <form action={formAction} className={styles.mailBlok}>
      <div className={styles.mailKop}>
        <h2 className={styles.sectionTitle}>Mail de klant</h2>
        <span className={styles.muted}>naar {email}</span>
      </div>

      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="soort" value={soort} />

      <div className={styles.mailKeuzes}>
        {SOORTEN.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={soort === s.key}
            className={`${styles.mailKeuze} ${soort === s.key ? styles.mailKeuzeAan : ""}`}
            onClick={() => setSoort(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {soort === "vraag" ? (
        <textarea
          name="bericht"
          rows={5}
          className={styles.mailTekst}
          placeholder="Je bericht aan de klant…"
        />
      ) : (
        // De andere twee schrijven zichzelf uit de order: geen tekstveld, want
        // dan zou je denken dat je iets moet invullen.
        <p className={styles.mailUitleg}>
          {soort === "in_productie"
            ? "Laat weten dat de bestelling in productie staat. Staat er een track & trace-link op de order, dan krijgt de klant meteen een volgknop."
            : "Laat weten dat het pakket onderweg is, met de track & trace-link als die er is."}
        </p>
      )}

      {!mailIngesteld && (
        <p className={styles.mailFout}>
          E-mail staat nog niet aan: RESEND_API_KEY ontbreekt. Versturen lukt pas zodra die
          is ingesteld.
        </p>
      )}
      {state.fout && <p className={styles.mailFout}>{state.fout}</p>}
      {state.ok && <p className={styles.mailOk}>Mail verstuurd.</p>}

      <div className={styles.mailActies}>
        <Button type="submit" size="sm" loading={bezig} disabled={!mailIngesteld}>
          Verstuur e-mail
        </Button>
        <a
          href={`/api/admin/mail-voorbeeld/${orderId}?soort=${soort}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mailVoorbeeld}
        >
          Bekijk voorbeeld
        </a>
      </div>
    </form>
  );
}
