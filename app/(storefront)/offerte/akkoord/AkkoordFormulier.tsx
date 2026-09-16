"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Field, ArrowRight } from "@/components/ui";
import styles from "../offerte.module.css";

export function AkkoordFormulier({
  token,
  naam,
  email,
  handwerk,
}: {
  token: string;
  naam: string;
  email: string;
  /** Offerte met "prijs volgt"-regels: betaallink komt later. */
  handwerk: boolean;
}) {
  const uid = useId();
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [klaar, setKlaar] = useState<{ betaalUrl: string | null; email: string } | null>(null);

  async function versturen(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (bezig) return;
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const gegevens = {
      naam: String(data.get("naam") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
    };
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch("/api/offerte/akkoord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token, ...gegevens }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; betaalUrl?: string | null; error?: string }
        | null;
      if (!res.ok || !json?.ok) {
        setFout(json?.error ?? "Versturen lukte niet. Probeer het zo nog eens.");
        return;
      }
      setKlaar({ betaalUrl: json.betaalUrl ?? null, email: gegevens.email });
    } catch {
      setFout("We konden je akkoord niet versturen. Controleer je verbinding en probeer het nog eens.");
    } finally {
      setBezig(false);
    }
  }

  if (klaar) {
    return (
      <div className={styles.gelukt} role="status">
        <p className={styles.lead}>
          {klaar.betaalUrl
            ? `Bedankt voor je akkoord. De betaallink staat in je mail (${klaar.email}). Je kunt ook meteen betalen.`
            : "Bedankt voor je akkoord. We sturen je de betaallink binnen één werkdag."}
        </p>
        {klaar.betaalUrl && (
          <Button as="a" href={klaar.betaalUrl} size="lg" icon={<ArrowRight />}>
            Nu betalen
          </Button>
        )}
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={versturen} noValidate>
      <Field
        id={`${uid}-naam`}
        name="naam"
        label="Naam"
        autoComplete="name"
        required
        minLength={2}
        maxLength={120}
        defaultValue={naam}
      />
      <Field
        id={`${uid}-email`}
        name="email"
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        maxLength={200}
        defaultValue={email}
        helperText="Hierheen sturen we de betaallink."
      />
      {fout && (
        <p className={styles.fout} role="alert">
          {fout}
        </p>
      )}
      <Button type="submit" size="lg" loading={bezig} icon={<ArrowRight />}>
        {handwerk ? "Offerte accepteren" : "Accepteren en betaallink ontvangen"}
      </Button>
      <p className={styles.noot}>
        Met je akkoord ga je akkoord met de{" "}
        <Link href="/algemene-voorwaarden">algemene voorwaarden</Link>.
      </p>
    </form>
  );
}
