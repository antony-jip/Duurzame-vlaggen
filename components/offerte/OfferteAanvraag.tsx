"use client";

import { useId, useState, type FormEvent } from "react";
import styles from "./OfferteAanvraag.module.css";
import { Button, Document, Check } from "@/components/ui";
import type { CartOption } from "@/components/cart/types";

/**
 * "Ontvang een offerte in je mail": klein uitklapformulier onder configurator,
 * winkelmand en kassa.
 *
 * Gemeenten en instellingen bestellen niet direct: ze stellen samen, vragen
 * een offerte en laten die intern goedkeuren. We sturen alleen de keuzes naar
 * /api/offerte; de server rekent het bedrag opnieuw uit met het prijsmodel van
 * de checkout en mailt de PDF op het briefpapier.
 *
 * Gegevens worden per browser onthouden (localStorage), zodat een inkoper die
 * meerdere offertes opvraagt niet elke keer opnieuw typt.
 */

export interface OfferteRegelInvoer {
  slug: string;
  sizeLabel: string;
  widthCm?: number;
  heightCm?: number;
  amount: number;
  options: CartOption[];
}

const OPSLAG = "dv-offerte-gegevens-v1";
const VELDEN = ["organisatie", "naam", "email", "telefoon", "referentie"] as const;
type Gegevens = Partial<Record<(typeof VELDEN)[number], string>>;

function leesGegevens(): Gegevens {
  try {
    const raw = localStorage.getItem(OPSLAG);
    return raw ? (JSON.parse(raw) as Gegevens) : {};
  } catch {
    return {};
  }
}

function bewaarGegevens(g: Gegevens) {
  try {
    localStorage.setItem(OPSLAG, JSON.stringify(g));
  } catch {
    // Opslag geblokkeerd: dan typt de klant het de volgende keer opnieuw.
  }
}

export function OfferteAanvraag({
  regels,
  disabled = false,
  className,
}: {
  /** De samenstelling of de hele mand; wordt bij verzenden uitgelezen. */
  regels: () => OfferteRegelInvoer[];
  /** Bv. een eigen maat die nog niet geldig is ingevuld. */
  disabled?: boolean;
  className?: string;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [verstuurd, setVerstuurd] = useState<{ nummer: string; email: string } | null>(null);
  const [bewaard, setBewaard] = useState<Gegevens>({});

  function openen() {
    setBewaard(leesGegevens());
    setVerstuurd(null);
    setFout(null);
    setOpen(true);
  }

  async function versturen(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (bezig) return;
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const gegevens: Gegevens = Object.fromEntries(
      VELDEN.map((v) => [v, String(data.get(v) ?? "").trim()]),
    );

    setBezig(true);
    setFout(null);
    try {
      const res = await fetch("/api/offerte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...gegevens,
          opmerking: String(data.get("opmerking") ?? ""),
          website: String(data.get("website") ?? ""),
          regels: regels(),
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; nummer?: string; error?: string }
        | null;
      if (!res.ok || !json?.ok || !json.nummer) {
        setFout(json?.error ?? "Versturen lukte niet. Probeer het zo nog eens.");
        return;
      }
      bewaarGegevens(gegevens);
      setVerstuurd({ nummer: json.nummer, email: gegevens.email ?? "" });
      setOpen(false);
    } catch {
      setFout("We konden de offerte niet versturen. Controleer je verbinding en probeer het nog eens.");
    } finally {
      setBezig(false);
    }
  }

  const id = (naam: string) => `${uid}-${naam}`;

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      {verstuurd ? (
        <p className={styles.gelukt} role="status">
          <Check size={16} aria-hidden="true" />
          <span>
            Offerte <strong>{verstuurd.nummer}</strong> staat in je mail ({verstuurd.email}).{" "}
            <button type="button" className={styles.tekstKnop} onClick={openen}>
              Nog een offerte
            </button>
          </span>
        </p>
      ) : !open ? (
        <button
          type="button"
          className={styles.trigger}
          onClick={openen}
          disabled={disabled}
          aria-expanded={false}
        >
          <Document size={16} aria-hidden="true" />
          Ontvang een offerte in je mail
        </button>
      ) : null}

      {open && (
        <form className={styles.form} onSubmit={versturen} noValidate>
          <div className={styles.formKop}>
            <p className={styles.titel}>Offerte in je mail</p>
            <button type="button" className={styles.tekstKnop} onClick={() => setOpen(false)}>
              Annuleren
            </button>
          </div>
          <p className={styles.uitleg}>
            Met deze samenstelling en dit bedrag, als PDF. Handig voor inkoop en goedkeuring.
          </p>

          <div className={styles.velden}>
            <label className={styles.veld} htmlFor={id("organisatie")}>
              <span>Organisatie</span>
              <input
                id={id("organisatie")}
                name="organisatie"
                required
                minLength={2}
                maxLength={160}
                autoComplete="organization"
                defaultValue={bewaard.organisatie}
                placeholder="Bijv. Gemeente Hoorn"
              />
            </label>
            <label className={styles.veld} htmlFor={id("naam")}>
              <span>Naam</span>
              <input
                id={id("naam")}
                name="naam"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                defaultValue={bewaard.naam}
              />
            </label>
            <label className={styles.veld} htmlFor={id("email")}>
              <span>E-mail</span>
              <input
                id={id("email")}
                name="email"
                type="email"
                required
                maxLength={200}
                autoComplete="email"
                defaultValue={bewaard.email}
              />
            </label>
            <label className={styles.veld} htmlFor={id("referentie")}>
              <span>
                Referentie of inkoopnummer <em>(optioneel)</em>
              </span>
              <input
                id={id("referentie")}
                name="referentie"
                maxLength={60}
                defaultValue={bewaard.referentie}
              />
            </label>
            <label className={`${styles.veld} ${styles.breed}`} htmlFor={id("telefoon")}>
              <span>
                Telefoon <em>(optioneel)</em>
              </span>
              <input
                id={id("telefoon")}
                name="telefoon"
                type="tel"
                maxLength={40}
                autoComplete="tel"
                defaultValue={bewaard.telefoon}
              />
            </label>
            <label className={`${styles.veld} ${styles.breed}`} htmlFor={id("opmerking")}>
              <span>
                Opmerking <em>(optioneel)</em>
              </span>
              <textarea id={id("opmerking")} name="opmerking" rows={2} maxLength={1000} />
            </label>
            {/* Honeypot: onzichtbaar voor mensen. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className={styles.honeypot}
              aria-hidden="true"
            />
          </div>

          {fout && (
            <p className={styles.fout} role="alert">
              {fout}
            </p>
          )}

          <Button type="submit" variant="secondary" size="md" loading={bezig} fullWidth>
            Stuur de offerte naar mijn mail
          </Button>
        </form>
      )}
    </div>
  );
}
