"use client";

import { useState, useTransition } from "react";
import { markeerKans } from "./actions";
import styles from "./analytics.module.css";

/**
 * De twee knoppen achter elke kans: prompt kopiëren en stand omzetten.
 *
 * Client-component omdat allebei browser-only zijn (clipboard, optimistische
 * staat). De prompt-tekst wordt server-side gebouwd (lib/analytics/prompts.ts)
 * en als prop meegegeven — de bouwlogica hoort niet in de browser-bundle.
 */

/** Clipboard met fallback: navigator.clipboard vereist een secure context. */
async function kopieer(tekst: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(tekst);
    return true;
  } catch {
    // Oudere/niet-secure contexten: verborgen textarea + execCommand.
    try {
      const ta = document.createElement("textarea");
      ta.value = tekst;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function PromptKnop({ prompt, label = "Prompt" }: { prompt: string; label?: string }) {
  const [stand, setStand] = useState<"rust" | "ok" | "mis">("rust");

  return (
    <button
      type="button"
      className={styles.actieKnop}
      onClick={async () => {
        const ok = await kopieer(prompt);
        setStand(ok ? "ok" : "mis");
        setTimeout(() => setStand("rust"), 2000);
      }}
      title="Kopieer een opdracht voor Claude Code"
    >
      {stand === "ok" ? "Gekopieerd" : stand === "mis" ? "Mislukt" : label}
    </button>
  );
}

export function BenutToggle({
  sleutel,
  bron,
  positie,
  impressies,
  benut,
}: {
  sleutel: string;
  bron: "doel" | "kans";
  positie: number | null;
  impressies: number;
  benut: boolean;
}) {
  const [bezig, start] = useTransition();
  // Optimistisch: de server action doet een round-trip + revalidate, en zonder
  // dit voelt de toggle traag terwijl de uitkomst vrijwel zeker is.
  const [optimistisch, setOptimistisch] = useState<boolean | null>(null);
  const aan = optimistisch ?? benut;

  return (
    <button
      type="button"
      disabled={bezig}
      aria-pressed={aan}
      className={`${styles.toggle} ${aan ? styles.toggleAan : ""}`}
      title={aan ? "Weer als openstaand markeren" : "Markeer als benut"}
      onClick={() => {
        const nieuw = !aan;
        setOptimistisch(nieuw);
        const fd = new FormData();
        fd.set("sleutel", sleutel);
        fd.set("bron", bron);
        fd.set("status", nieuw ? "benut" : "opgepakt");
        if (positie !== null) fd.set("positie", String(positie));
        fd.set("impressies", String(impressies));
        start(async () => {
          try {
            await markeerKans(fd);
          } catch {
            setOptimistisch(!nieuw); // terugdraaien; de server won
          }
        });
      }}
    >
      <span className={styles.toggleDot} aria-hidden="true" />
      {aan ? "Benut" : "Open"}
    </button>
  );
}
