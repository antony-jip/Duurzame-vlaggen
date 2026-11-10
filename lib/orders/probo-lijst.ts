import { beschrijfProboOptie, type ProboOption } from "@/lib/catalog/probo-mapping";

/** "Samenstelling: vlag, stok en draagtas" → "samenstelling". */
function onderwerp(tekst: string): string {
  return tekst.split(":")[0].trim().toLowerCase();
}

/**
 * De Probo-opties op het inkooplijstje, zonder de opties waarvan het onderwerp
 * ook bij "Zelf regelen" staat.
 *
 * Oudere orders (vóór 10 nov 2026) kregen bij de beachvlag altijd de volledige
 * set mee (flag-stick-bag-deluxe), ook als de klant "Alleen vlag" koos; die
 * keuze stond dan los onder Zelf regelen. Twee antwoorden op dezelfde vraag:
 * de keuze van de klant wint, dus de Probo-optie valt weg.
 */
export function optiesZonderDubbel(
  opties: ProboOption[],
  zelfRegelen: Array<{ label: string }>,
): ProboOption[] {
  const zelf = new Set(zelfRegelen.map((s) => onderwerp(s.label)).filter(Boolean));
  if (zelf.size === 0) return opties;
  return opties.filter((o) => !zelf.has(onderwerp(beschrijfProboOptie(o))));
}
