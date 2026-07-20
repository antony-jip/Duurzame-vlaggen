"use client";

import { useId, useState } from "react";
import { Button, Field, ArrowRight } from "@/components/ui";
import styles from "./page.module.css";

export interface ContactFormProps {
  /** Optional product name (from ?product=) used to pre-fill the subject. */
  defaultProduct?: string;
}

const SUBJECTS = [
  { value: "offerte", label: "Offerte aanvragen" },
  { value: "csrd", label: "CSRD & compliance" },
  { value: "producten", label: "Producten & prijzen" },
  { value: "ontwerp", label: "Eigen ontwerp" },
  { value: "overig", label: "Overig" },
] as const;

export function ContactForm({ defaultProduct }: ContactFormProps) {
  // Prefix each field id so multiple forms on a page stay unique/accessible.
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;

  const [subject, setSubject] = useState<string>(
    defaultProduct ? "offerte" : "",
  );
  const [message, setMessage] = useState<string>(
    defaultProduct
      ? `Ik ontvang graag meer informatie over: ${defaultProduct}.\n\n`
      : "",
  );

  // "idle" → versturen → "ok" of een foutmelding. Stond hier eerder als
  // mailto:-stub: die opende de mailclient van de bezoeker, wat op mobiel en bij
  // webmail vaak niets doet. De lead was dan weg zonder dat iemand het merkte.
  const [status, setStatus] = useState<"idle" | "bezig" | "ok">("idle");
  const [fout, setFout] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "bezig") return;

    const form = event.currentTarget;
    // Native validatie eerst: het formulier staat op noValidate zodat we de
    // melding zelf plaatsen, maar de required-regels blijven gelden.
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    setStatus("bezig");
    setFout(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name") ?? "",
          email: data.get("email") ?? "",
          phone: data.get("phone") ?? "",
          company: data.get("company") ?? "",
          subject: data.get("subject") ?? "",
          message: data.get("message") ?? "",
          product: defaultProduct ?? "",
          website: data.get("website") ?? "",
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!res.ok || !json?.ok) {
        setFout(json?.error ?? "Versturen lukte niet. Probeer het zo nog eens.");
        setStatus("idle");
        return;
      }
      setStatus("ok");
    } catch {
      setFout(
        "We konden je bericht niet versturen. Controleer je verbinding en probeer het nog eens.",
      );
      setStatus("idle");
    }
  }

  if (status === "ok") {
    return (
      <div className={styles.formSucces} role="status">
        <p className={styles.formSuccesTitel}>Je bericht is verstuurd.</p>
        <p>Je hebt binnen 24 uur antwoord, meestal sneller.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.formRow}>
        <Field
          id={fid("name")}
          name="name"
          label="Naam"
          autoComplete="name"
          required
          placeholder="Voor- en achternaam"
        />
        <Field
          id={fid("email")}
          name="email"
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="naam@bedrijf.nl"
        />
      </div>

      <div className={styles.formRow}>
        <Field
          id={fid("phone")}
          name="phone"
          label="Telefoon"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
        />
        <Field
          id={fid("company")}
          name="company"
          label="Bedrijf"
          autoComplete="organization"
          placeholder="Bedrijfsnaam"
        />
      </div>

      <Field
        id={fid("subject")}
        name="subject"
        label="Onderwerp"
        as="select"
        required
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      >
        <option value="" disabled>
          Kies een onderwerp…
        </option>
        {SUBJECTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Field>

      <Field
        id={fid("message")}
        name="message"
        label="Bericht"
        as="textarea"
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Waar kunnen we je mee helpen?"
      />

      {/* Honeypot: onzichtbaar voor mensen, ingevuld door bots. Geen display:none
          — sommige bots slaan dat over; wegschuiven werkt beter. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={fid("website")}>Website (niet invullen)</label>
        <input
          id={fid("website")}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {fout && (
        <p className={styles.formFout} role="alert">
          {fout}
        </p>
      )}

      <div className={styles.formActions}>
        <Button
          type="submit"
          size="lg"
          icon={<ArrowRight />}
          disabled={status === "bezig"}
        >
          {status === "bezig" ? "Versturen…" : "Verstuur bericht"}
        </Button>
        <p className={styles.formNote}>
          We reageren binnen 24 uur, meestal sneller.
        </p>
      </div>
    </form>
  );
}
