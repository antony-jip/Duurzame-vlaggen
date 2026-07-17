"use client";

import { useId, useState } from "react";
import { Button, Field, ArrowRight } from "@/components/ui";
import styles from "./page.module.css";

export interface ContactFormProps {
  /** Optional product name (from ?product=) used to pre-fill the subject. */
  defaultProduct?: string;
}

// Support-adres, alleen nog als fallback in de foutmelding. De verzending loopt
// nu server-side via /api/contact (Resend), niet meer via een mailto:.
const CONTACT_EMAIL = "hello@duurzame-vlaggen.nl";

const SUBJECTS = [
  { value: "offerte", label: "Offerte aanvragen" },
  { value: "csrd", label: "CSRD & compliance" },
  { value: "producten", label: "Producten & prijzen" },
  { value: "ontwerp", label: "Eigen ontwerp" },
  { value: "overig", label: "Overig" },
] as const;

type Status = "idle" | "sending" | "sent" | "error";

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
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);

    const subjectLabel =
      SUBJECTS.find((s) => s.value === data.get("subject"))?.label ??
      "Contactaanvraag";
    const productSuffix = defaultProduct ? `: ${defaultProduct}` : "";

    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      company: String(data.get("company") ?? ""),
      subject: subjectLabel + productSuffix,
      message: String(data.get("message") ?? ""),
      website: String(data.get("website") ?? ""), // honeypot
    };

    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setErrorMsg(
          data?.error ??
            `Versturen mislukt. Mail ons gerust direct op ${CONTACT_EMAIL}.`,
        );
        setStatus("error");
        return;
      }
      form.reset();
      setStatus("sent");
    } catch {
      setErrorMsg(
        `Versturen mislukt. Controleer je verbinding of mail ons op ${CONTACT_EMAIL}.`,
      );
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className={styles.formSuccess} role="status">
        <h3>Bericht verstuurd</h3>
        <p>
          Bedankt voor je bericht. We reageren binnen 24 uur, meestal sneller.
        </p>
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

      {/* Honeypot — verborgen voor mensen, ingevuld door bots. Niet-tabbaar. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label htmlFor={fid("website")}>Laat dit veld leeg</label>
        <input
          id={fid("website")}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {status === "error" && (
        <p className={styles.formError} role="alert">
          {errorMsg}
        </p>
      )}

      <div className={styles.formActions}>
        <Button
          type="submit"
          size="lg"
          icon={<ArrowRight />}
          disabled={status === "sending"}
        >
          {status === "sending" ? "Versturen…" : "Verstuur bericht"}
        </Button>
        <p className={styles.formNote}>
          We reageren binnen 24 uur, meestal sneller.
        </p>
      </div>
    </form>
  );
}
