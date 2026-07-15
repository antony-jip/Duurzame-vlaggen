"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./CartPaneel.module.css";
import { Button, ArrowRight, Leaf, Price } from "@/components/ui";
import { useCart } from "./CartProvider";
import { WinkelmandRegel } from "./WinkelmandRegel";
import { localShipping, FREE_SHIPPING_THRESHOLD } from "@/lib/pricing/local-catalog";

/**
 * Het winkelmand-paneel: schuift open zodra er iets in de mand gaat.
 *
 * Dit paneel *is* de winkelmand. De aparte /winkelwagen-pagina is opgeheven
 * (die toonde vrijwel hetzelfde als het afrekenoverzicht), dus dit neemt haar
 * rol over: bevestigen dat het gelukt is, laten zien wat erin zit, en in één
 * klik door naar de kassa.
 *
 * Een <dialog> zou een modaal blok opleveren; dit is bewust een zij-paneel dat
 * je kunt negeren om verder te winkelen.
 */
export function CartPaneel() {
  const { items, subtotal, paneelOpen, setPaneelOpen, hydrated } = useCart();
  const sluitRef = useRef<HTMLButtonElement>(null);

  const verzending = localShipping(subtotal);
  const tekort = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const voortgang = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const aantal = items.reduce((n, it) => n + it.amount, 0);

  // Escape sluit; focus naar de sluitknop zodat toetsenbord en schermlezer
  // meteen ín het paneel zitten in plaats van erachter.
  useEffect(() => {
    if (!paneelOpen) return;
    sluitRef.current?.focus();
    function opToets(e: KeyboardEvent) {
      if (e.key === "Escape") setPaneelOpen(false);
    }
    document.addEventListener("keydown", opToets);
    return () => document.removeEventListener("keydown", opToets);
  }, [paneelOpen, setPaneelOpen]);

  // Leeggeraakt terwijl het paneel openstond → niets meer te tonen.
  useEffect(() => {
    if (paneelOpen && hydrated && items.length === 0) setPaneelOpen(false);
  }, [paneelOpen, hydrated, items.length, setPaneelOpen]);

  if (!paneelOpen || items.length === 0) return null;

  return (
    <>
      <div
        className={styles.waas}
        onClick={() => setPaneelOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={styles.paneel}
        role="dialog"
        aria-modal="false"
        aria-label="Je winkelmand"
      >
        <header className={styles.kop}>
          <span className={styles.kopTitel}>
            Je winkelmand: {aantal} {aantal === 1 ? "product" : "producten"}
          </span>
          <button
            ref={sluitRef}
            type="button"
            className={styles.sluit}
            onClick={() => setPaneelOpen(false)}
            aria-label="Sluiten"
          >
            ✕
          </button>
        </header>

        <p className={styles.bevestiging}>
          <span className={styles.vink} aria-hidden="true">
            ✓
          </span>
          Toegevoegd aan je winkelmand.
        </p>

        <div className={styles.regels}>
          {items.map((item) => (
            <WinkelmandRegel key={item.id} item={item} compact />
          ))}
        </div>

        <div className={styles.voet}>
          <div className={styles.rij}>
            <span>Subtotaal</span>
            <span>
              <Price amount={subtotal} />
            </span>
          </div>
          <div className={styles.rij}>
            <span>Verzendkosten</span>
            <span>
              {verzending === 0 ? (
                <span className={styles.gratis}>Gratis</span>
              ) : (
                <Price amount={verzending} />
              )}
            </span>
          </div>
          <div className={styles.totaalRij}>
            <span>Totaal</span>
            <strong>
              <Price amount={subtotal + verzending} />
            </strong>
          </div>

          {verzending > 0 ? (
            <div className={styles.nudge}>
              <span>
                Nog <Price amount={tekort} /> en je verzending is gratis
              </span>
              <span
                className={styles.balk}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(voortgang)}
                aria-label="Voortgang naar gratis verzending"
              >
                <span className={styles.balkVulling} style={{ width: `${voortgang}%` }} />
              </span>
            </div>
          ) : (
            <p className={styles.gratisGehaald}>
              <Leaf size={15} aria-hidden="true" /> Je verzending is gratis.
            </p>
          )}

          <Button
            as="a"
            href="/afrekenen"
            size="lg"
            fullWidth
            icon={<ArrowRight />}
            onClick={() => setPaneelOpen(false)}
          >
            Ga naar de kassa
          </Button>
          <Link
            href="/collectie"
            className={styles.verder}
            onClick={() => setPaneelOpen(false)}
          >
            Verder winkelen
          </Link>
        </div>
      </aside>
    </>
  );
}
