import { toMollieAmount } from "@/lib/mollie/client";
import type { MollieAddress, MolliePaymentLine } from "@/lib/mollie/payments";
import type { ProboAddress } from "@/lib/catalog/probo-mapping";
import type { Quote } from "./orchestration";

/**
 * Betalen op factuur (B2B) via Mollie's Billie-methode.
 *
 * Billie eist twee dingen die een gewone iDEAL-betaling niet nodig heeft: een
 * volledig factuuradres mét `organizationName`, en `lines` (orderregels incl.
 * btw) die exact optellen tot het betaalbedrag. Deze module bouwt beide uit de
 * bestaande quote, zodat `placeOrder` er alleen om hoeft te vragen wanneer de
 * klant voor factuur kiest.
 */

/**
 * Landen waar Billie in euro's werkt (bron: Mollie-methodedocumentatie).
 * België valt er bewust buiten; de UI en de server-validatie delen deze lijst.
 */
export const BILLIE_LANDEN = ["NL", "DE", "AT", "FR"] as const;

export function billieBeschikbaarVoorLand(country: string | undefined): boolean {
  return (BILLIE_LANDEN as readonly string[]).includes(
    (country ?? "").toUpperCase(),
  );
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** ProboAddress → MollieAddress, met de bedrijfsnaam als organizationName. */
export function naarMollieAdres(
  adres: ProboAddress,
  email: string,
): MollieAddress {
  const straat = [adres.street, adres.house_number, adres.addition]
    .map((deel) => (deel ?? "").trim())
    .filter(Boolean)
    .join(" ");
  return {
    ...(adres.company_name ? { organizationName: adres.company_name } : {}),
    givenName: adres.first_name ?? "",
    familyName: adres.last_name ?? "",
    email,
    streetAndNumber: straat,
    postalCode: adres.postal_code ?? "",
    city: adres.city ?? "",
    country: (adres.country ?? "NL").toUpperCase(),
  };
}

/**
 * Bouw Mollie-`lines` uit de quote: één regel per orderregel (aantal in de
 * omschrijving, quantity 1 zodat `unitPrice × quantity == totalAmount` altijd
 * klopt), plus ontwerpservice en verzending. Afrondingsverschillen tussen
 * per-regel-btw en de ordertotalen worden op de laatste regel bijgeplust,
 * zodat de som EXACT gelijk is aan `totals.total` — anders weigert Mollie de
 * betaling.
 */
export function billieRegels(quote: Quote): MolliePaymentLine[] {
  const cur = quote.currency;
  const rate = quote.vat.rate;
  const vatRate = rate.toFixed(2);

  const basis: Array<{ omschrijving: string; exVat: number }> = quote.lines.map(
    (l) => {
      const d = l.draft;
      const naam = d.productName ?? d.productType;
      const maat = d.sizeLabel ? ` (${d.sizeLabel})` : "";
      return {
        omschrijving: `${d.amount}× ${naam}${maat}`,
        exVat: l.linePrice,
      };
    },
  );
  if (quote.designService > 0) {
    basis.push({ omschrijving: "Ontwerpservice", exVat: quote.designService });
  }
  if (quote.totals.shippingCost > 0) {
    basis.push({
      omschrijving: "Verzendkosten",
      exVat: quote.totals.shippingCost,
    });
  }

  const regels: MolliePaymentLine[] = basis.map((r) => {
    const incl = round2(r.exVat * (1 + rate / 100));
    const vat = round2((incl * rate) / (100 + rate));
    return {
      description: r.omschrijving,
      quantity: 1,
      unitPrice: toMollieAmount(incl, cur),
      totalAmount: toMollieAmount(incl, cur),
      vatRate,
      vatAmount: toMollieAmount(vat, cur),
    };
  });

  // Sluitpost: centverschillen door per-regel-afronding op de laatste regel.
  const somIncl = round2(
    regels.reduce((sum, r) => sum + Number(r.totalAmount.value), 0),
  );
  const somVat = round2(
    regels.reduce((sum, r) => sum + Number(r.vatAmount.value), 0),
  );
  const verschilIncl = round2(quote.totals.total - somIncl);
  const verschilVat = round2(quote.totals.vatAmount - somVat);
  const laatste = regels[regels.length - 1];
  if (verschilIncl !== 0) {
    const incl = round2(Number(laatste.totalAmount.value) + verschilIncl);
    laatste.totalAmount = toMollieAmount(incl, cur);
    laatste.unitPrice = toMollieAmount(incl, cur);
  }
  if (verschilVat !== 0) {
    laatste.vatAmount = toMollieAmount(
      round2(Number(laatste.vatAmount.value) + verschilVat),
      cur,
    );
  }

  return regels;
}
