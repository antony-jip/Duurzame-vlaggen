"use client";

/**
 * Prijsweergave die de globale btw-voorkeur (ex/incl) volgt.
 *
 * Prijzen worden overal ex btw doorgegeven (`amount`); dit component past het
 * btw-tarief van de ACTIEVE MARKT toe wanneer de bezoeker "incl. btw" heeft
 * gekozen en toont optioneel het bijpassende label. Werkt zowel bij SSR als na
 * hydratie: de voorkeur staat standaard op ex btw, dus de server- en eerste
 * client-render komen overeen.
 */

import { useCart } from "@/components/cart/CartProvider";
import { useDict } from "@/components/i18n/DictProvider";
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
  const { catalog, inclVat, vatRate } = useCart();
  const dict = useDict();
  const shown = inclVat ? amount * (1 + vatRate) : amount;
  const label = inclVat ? dict.product.inclVat : dict.product.exclVat;
  return (
    <>
      <span className={className}>{formatCurrency(shown, catalog)}</span>
      {suffix ? <span className={suffixClassName}>&nbsp;{label}</span> : null}
    </>
  );
}
