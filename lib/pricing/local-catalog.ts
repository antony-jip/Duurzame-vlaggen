/**
 * Lokaal prijsmodel — losgekoppeld van de live Probo-API.
 *
 * Isomorf (geen `server-only`/`use client`): zowel de configurator (client) als
 * de checkout (`buildLocalQuote`, server) rekenen hiermee, zodat de klantflow
 * geen Probo-call meer nodig heeft.
 *
 * Model:
 *  - ECHTE retailprijzen per maat in `RETAIL_PRICES` (uit de live site / refs).
 *    Waar een maat geen bekende prijs heeft, valt de berekening terug op
 *    lineaire oppervlak-schaling (m²) vanaf de catalogus-`priceFrom`.
 *  - Hardware zonder afmetingen (vlaggenmast) via `HARDWARE_PRICES` per label.
 *  - Optie-toeslagen (ex btw) via `OPTION_SURCHARGES` (bv. mastkleur, beach-voet).
 *  - Staffelkorting via `staffelDiscount(qty)` — verwerkt in de regelprijs.
 *  - Ontwerpservice: vast bedrag (`DESIGN_SERVICE_PRICE`), losse toevoeging.
 *  - Verzending: eigen vaste regel, gratis boven een drempel.
 *
 * Alle bedragen zijn EX btw en op 2 decimalen (via hele centen).
 */

import type { CatalogProduct, CatalogSize } from "@/lib/catalog/products";

/** Rond af op 2 decimalen via hele centen (dodge floating-point drift). */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Oppervlak in m² van een maat, of null als er geen afmetingen zijn. */
export function sizeAreaM2(size: Pick<CatalogSize, "widthCm" | "heightCm">): number | null {
  if (size.widthCm == null || size.heightCm == null) return null;
  return (size.widthCm / 100) * (size.heightCm / 100);
}

/**
 * ECHTE retailprijzen (ex btw, per stuk) per productslug → maatlabel.
 *
 * Legenda per waarde:
 *  - "ECHT" = 1-op-1 uit de live site / referentiedoc.
 *  - "TODO: prijs verifiëren" = geschat (area-scaling of dichtstbijzijnde
 *    ref-maat) omdat er geen exacte prijs bekend is — met Antony afstemmen.
 */
const RETAIL_PRICES: Record<string, Record<string, number>> = {
  gevelvlag: {
    "100 × 70 cm": 17.5, // ECHT (ref)
    "150 × 100 cm": 29.5, // ECHT (ref)
    "225 × 150 cm": 59.5, // ECHT (ref, "Grote Gevelvlag")
  },
  beachvlag: {
    // Straight S 40×235 heeft geen exacte ref-maat; dichtstbijzijnde straight-ref
    // is de kleinste (80×220 = €35). Breedte wijkt sterk af (40 vs 80).
    "Straight S — 40 × 235 cm": 35, // TODO: prijs verifiëren (ref-maat 80×220 = €35)
    "Straight M — 65 × 315 cm": 45, // ECHT (ref 65×315)
    "Straight L — 90 × 430 cm": 65, // ECHT (ref 90×430)
    "Square S — 75 × 200 cm": 45, // ECHT (ref 75×200)
    "Square M — 75 × 300 cm": 55, // ECHT (ref 75×300)
    "Square L — 75 × 400 cm": 65, // ECHT (ref 75×400)
  },
  baniervlag: {
    // TODO: prijs verifiëren — geen exacte ref-prijzen bekend. Area-scaling
    // geankerd op de kleinste maat (100×250 = €38 ≈ €15,20/m²), floor op €0,50.
    "100 × 250 cm": 38, // anker (= priceFrom)
    "100 × 300 cm": 45.5, // TODO: prijs verifiëren (≈ €45,60 area-scaled)
    "100 × 400 cm": 60.5, // TODO: prijs verifiëren (≈ €60,80 area-scaled)
  },
  mastvlag: {
    // TODO: prijs verifiëren — enige bekende punt: 150×225 ≈ €44,50 (live site).
    // Area-scaling geankerd daarop (≈ €13,19/m²), floor op €0,50.
    "100 × 150 cm": 19.5, // TODO: prijs verifiëren (≈ €19,78 area-scaled)
    "150 × 225 cm": 44.5, // ~ECHT (live site, band+koord)
    "225 × 350 cm": 103.5, // TODO: prijs verifiëren (≈ €103,83 area-scaled)
  },
};

/**
 * Expliciete prijs (ex btw) per maatlabel voor niet-schaalbare hardware.
 *
 * TODO: prijs verifiëren met Antony — de catalogus stond op €637 (Easylift 6m
 * wit), maar de live-config-referentie geeft €520/€552,50/€578,50 voor 6/7/8 m.
 * Hier zijn de ref-prijzen aangehouden.
 */
const HARDWARE_PRICES: Record<string, Record<string, number>> = {
  vlaggenmast: {
    "6 meter": 520, // ref (was €637 in catalogus)
    "7 meter": 552.5, // ref
    "8 meter": 578.5, // ref (was €799 in catalogus)
  },
};

/**
 * Optie-toeslagen (ex btw) per productslug → optielabel → keuze → bedrag.
 * Toeslag geldt PER STUK (× aantal in de regelprijs). Leeg = geen toeslag.
 */
const OPTION_SURCHARGES: Record<
  string,
  Record<string, Record<string, number>>
> = {
  vlaggenmast: {
    // Coating-meerprijs t.o.v. wit/aluminium (ref).
    Kleur: { Wit: 0, Aluminium: 0, Zwart: 71.5, Antraciet: 71.5 },
  },
  beachvlag: {
    // Losse voet als cross-sell per vlag (ref-accessoireprijzen).
    Voet: { Grondpin: 11, Kruisvoet: 27, Watertank: 7 },
  },
  // TODO: prijs verifiëren — gevelvlag "Met uithouder" heeft nog geen bekende
  // meerprijs; nu €0 tot Antony de uithouder-prijs bevestigt.
};

/**
 * Staffelkorting: hoe meer stuks, hoe hoger het kortingspercentage.
 * Tiers 1/5/10/25/50 → 0/5/10/15/20% (10 stuks = "Meest gekozen").
 */
export interface StaffelTier {
  /** Vanaf-aantal waarop deze korting geldt. */
  qty: number;
  /** Kortingsfractie (0–1). */
  discount: number;
  /** Highlight als de populairste keuze. */
  popular?: boolean;
}

export const STAFFEL_TIERS: readonly StaffelTier[] = [
  { qty: 1, discount: 0 },
  { qty: 5, discount: 0.05 },
  { qty: 10, discount: 0.1, popular: true },
  { qty: 25, discount: 0.15 },
  { qty: 50, discount: 0.2 },
];

/** Kortingsfractie (0–1) voor een aantal — hoogste tier waarvan `qty` ≥ tier.qty. */
export function staffelDiscount(qty: number): number {
  let discount = 0;
  for (const tier of STAFFEL_TIERS) {
    if (qty >= tier.qty) discount = tier.discount;
  }
  return discount;
}

/** Vaste prijs (ex btw) van de optionele ontwerpservice. */
export const DESIGN_SERVICE_PRICE = 85;

/** Kosten (ex btw) van de ontwerpservice: het vaste bedrag als aangevinkt, anders 0. */
export function designServiceCost(enabled: boolean): number {
  return enabled ? DESIGN_SERVICE_PRICE : 0;
}

/** Zoek een maat op zijn label binnen een product. */
export function getSize(
  product: CatalogProduct,
  sizeLabel: string,
): CatalogSize | undefined {
  return product.sizes.find((s) => s.label === sizeLabel);
}

/**
 * Ex-btw stukprijs voor een product bij een gekozen maat.
 *
 * Volgorde: (1) echte retailprijs uit `RETAIL_PRICES`, (2) hardware-tabel,
 * (3) lineaire oppervlak-schaling vanaf de goedkoopste maat, (4) `priceFrom`.
 */
export function localUnitPrice(product: CatalogProduct, size?: CatalogSize): number {
  // 1) Echte retailprijs op maatlabel.
  const retail = RETAIL_PRICES[product.slug];
  if (size && retail && retail[size.label] != null) {
    return round2(retail[size.label]);
  }

  // 2) Hardware / niet-schaalbaar: expliciete tabel op maatlabel.
  const hw = HARDWARE_PRICES[product.slug];
  if (hw) {
    if (size && hw[size.label] != null) return round2(hw[size.label]);
    return round2(product.priceFrom);
  }

  // 3) Oppervlak-schaling vanaf de kleinste (goedkoopste) maat.
  const area = size ? sizeAreaM2(size) : null;
  if (area == null) return round2(product.priceFrom);

  const areas = product.sizes
    .map((s) => sizeAreaM2(s))
    .filter((a): a is number => a != null);
  if (areas.length === 0) return round2(product.priceFrom);
  const minArea = Math.min(...areas);
  if (minArea <= 0) return round2(product.priceFrom);

  const pricePerM2 = product.priceFrom / minArea;
  return round2(pricePerM2 * area);
}

/** Toeslag (ex btw, per stuk) voor de gekozen opties. */
export function localOptionsSurcharge(
  product: CatalogProduct,
  selections: Record<string, string> = {},
): number {
  const table = OPTION_SURCHARGES[product.slug];
  if (!table) return 0;
  let total = 0;
  for (const [label, value] of Object.entries(selections)) {
    const add = table[label]?.[value];
    if (add) total += add;
  }
  return round2(total);
}

/**
 * Ex-btw stukprijs incl. de gekozen optie-toeslagen — de basis waarop de
 * staffelkorting rekent. Dit is wat als `unitPriceEstimate` in de mand komt.
 */
export function localUnitPriceWithOptions(
  product: CatalogProduct,
  size?: CatalogSize,
  selections?: Record<string, string>,
): number {
  return round2(localUnitPrice(product, size) + localOptionsSurcharge(product, selections));
}

/**
 * Ex-btw regelprijs = (stukprijs + optie-toeslagen) × aantal × (1 − staffel).
 * De staffelkorting hoort bij het aantal en wordt hier verwerkt.
 */
export function localLinePrice(input: {
  product: CatalogProduct;
  size?: CatalogSize;
  amount: number;
  selections?: Record<string, string>;
}): number {
  const { product, size, amount, selections } = input;
  const qty = Math.max(1, amount);
  const unit = localUnitPriceWithOptions(product, size, selections);
  return round2(unit * qty * (1 - staffelDiscount(qty)));
}

/**
 * Ex-btw regeltotaal voor de winkelmand/checkout-WEERGAVE, gerekend vanaf de
 * opgeslagen stukprijs (`unitPriceEstimate`) × aantal × (1 − staffel). Zo tonen
 * mand en afrekenen dezelfde staffel-korting als de definitieve `buildLocalQuote`.
 */
export function localCartLineTotal(unitPriceEx: number, amount: number): number {
  const qty = Math.max(1, amount);
  return round2(unitPriceEx * qty * (1 - staffelDiscount(qty)));
}

/** Eigen verzendregel (ex btw). */
export const SHIPPING_FLAT = 7.5;
export const FREE_SHIPPING_THRESHOLD = 150;

/** Verzendkosten ex btw op basis van het subtotaal ex btw. */
export function localShipping(subtotalExVat: number): number {
  return subtotalExVat >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
}
