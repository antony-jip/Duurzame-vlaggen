"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";

const OPGERUIMD_KEY = "dv-mand-geleegd-v1";

/**
 * Leegt de winkelmand zodra de klant op de bestelbevestiging landt.
 *
 * Waarom hier en niet in de checkout: bij een gewone betaling doet de
 * server-action `redirect(checkoutUrl)` naar Mollie. De checkout-component
 * unmount daardoor en krijgt nooit een succes-state terug, dus de `clear()`
 * die daar staat draait alleen bij een offerte-aanvraag. Gevolg was dat een
 * klant na het betalen zijn mand nog vol zag staan en dezelfde regels een
 * tweede keer kon afrekenen.
 *
 * Waarom niet onvoorwaardelijk: bij een mislukte betaling wijst de
 * retry-knop op deze pagina naar /afrekenen, en die pagina leest uit de
 * mand. Legen bij een probleem-status zou de klant dus op een lege checkout
 * zetten en de bestelling alsnog kosten. Vandaar dat de aanroeper bepaalt of
 * er geleegd mag worden.
 *
 * Waarom per order onthouden: deze pagina is een gewone URL die in de mail
 * staat en dus later opnieuw geopend wordt. Zonder geheugen zou zo'n bezoek
 * een mand wissen die de klant inmiddels voor een vólgende bestelling heeft
 * gevuld. We leegen daarom één keer per order-id.
 */
export function MandLegen({
  orderId,
  actief,
}: {
  orderId: string;
  actief: boolean;
}) {
  const { clear, hydrated } = useCart();

  useEffect(() => {
    // Pas na hydratie: daarvoor is de mand nog leeg en zou `clear()` de uit
    // storage geladen regels overschrijven vóór ze er zijn.
    if (!actief || !hydrated) return;

    let gedaan: string[] = [];
    try {
      const ruw = localStorage.getItem(OPGERUIMD_KEY);
      if (ruw) gedaan = JSON.parse(ruw) as string[];
    } catch {
      // Onleesbare of geblokkeerde storage: dan maar één keer te vaak legen.
      gedaan = [];
    }
    if (gedaan.includes(orderId)) return;

    clear();

    try {
      // Alleen de laatste paar bewaren; dit is een dedupe-lijstje, geen archief.
      const bijgewerkt = [...gedaan, orderId].slice(-20);
      localStorage.setItem(OPGERUIMD_KEY, JSON.stringify(bijgewerkt));
    } catch {
      // Niet kunnen onthouden is niet erg: de mand is nu leeg, en een tweede
      // leging van een al lege mand doet niets.
    }
  }, [orderId, actief, hydrated, clear]);

  return null;
}
