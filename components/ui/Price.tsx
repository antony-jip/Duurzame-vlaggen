"use client";

/**
 * Prijsweergave die de globale btw-voorkeur (ex/incl) volgt.
 *
 * Prijzen worden overal ex btw doorgegeven (`amount`); dit component past het
 * NL-tarief toe wanneer de bezoeker "incl. btw" heeft gekozen en toont
 * optioneel het bijpassende label. Werkt zowel bij SSR als na hydratie: de
 * voorkeur staat standaard op ex btw, dus de server- en eerste client-render
 * komen overeen.
 */

import { useCart, VAT_RATE } from "@/components/cart/CartProvider";
import { formatCurrency } from "@/lib/i18n/formatting";

export interface PriceProps {
  /** Bedrag ex btw, in hele euro's/centen (major units). */
  amount: number;
  /** Class op het bedrag zelf. */
  className?: string;
  /** Toon " excl. btw" / " incl. btw" achter het bedrag. */
  suffix?: boolean;
  /** Class op het btw-label. */
  suffixClassName?: string;
}

export function Price({ amount, className, suffix = false, suffixClassName }: PriceProps) {
  const { catalog, inclVat } = useCart();
  const shown = inclVat ? amount * (1 + VAT_RATE) : amount;
  const label = inclVat ? "incl. btw" : "excl. btw";
  return (
    <>
      <span className={className}>{formatCurrency(shown, catalog)}</span>
      {suffix ? <span className={suffixClassName}>&nbsp;{label}</span> : null}
    </>
  );
}
