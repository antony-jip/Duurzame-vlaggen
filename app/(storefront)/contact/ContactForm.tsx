"use client";

import { useId, useState } from "react";
import { Button, Field, ArrowRight } from "@/components/ui";
import styles from "./page.module.css";

export interface ContactFormProps {
  /** Optional product name (from ?product=) used to pre-fill the subject. */
  defaultProduct?: string;
}

// Recipient for the placeholder mailto: submit. A real POST handler with
// server-side validation / spam protection lands in Fase 4.
const CONTACT_EMAIL = "info@duurzame-vlaggen.nl";

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

  // Placeholder submit — opens the visitor's mail client with a pre-filled
  // message. No backend is wired up yet (Fase 4). We keep the native form
  // semantics so required-field validation still runs before we build the URL.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subjectLabel =
      SUBJECTS.find((s) => s.value === data.get("subject"))?.label ??
      "Contactaanvraag";
    const productSuffix = defaultProduct ? `: ${defaultProduct}` : "";
    const body = [
      `Naam: ${data.get("name") ?? ""}`,
      `E-mail: ${data.get("email") ?? ""}`,
      `Telefoon: ${data.get("phone") ?? ""}`,
      `Bedrijf: ${data.get("company") ?? ""}`,
      "",
      String(data.get("message") ?? ""),
    ].join("\n");

    const mailto =
      `mailto:${CONTACT_EMAIL}` +
      `?subject=${encodeURIComponent(subjectLabel + productSuffix)}` +
      `&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
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

      <div className={styles.formActions}>
        <Button type="submit" size="lg" icon={<ArrowRight />}>
          Verstuur bericht
        </Button>
        <p className={styles.formNote}>
          We reageren binnen 24 uur, meestal sneller.
        </p>
      </div>
    </form>
  );
}
