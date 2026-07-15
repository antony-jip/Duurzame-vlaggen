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
// `supportsCustomSize` woont bij de mapping omdat dáár vastligt welke producten
// een vrije maat aankunnen (custom-size vs preset-size). Geen cyclus: dat is een
// plat data-module zonder imports.
import { supportsCustomSize } from "@/lib/catalog/probo-mapping";
import { SELLER_COUNTRY, VAT_RATES } from "@/lib/vat/rates";

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
 * Probo-inkoop Flag CiCLO (ex btw) — de basis onder onze marges.
 *
 * Staffeltarief per m², bepaald door de TOTALE m² van de order (niet per stuk):
 *
 *   0,1 m² → € 8,25/m²      50 m² → € 6,45/m²
 *    10 m² → € 7,98/m²     100 m² → € 5,90/m²
 *    25 m² → € 6,70/m²
 *
 * Daarbovenop: afwerking ± € 0,17/vlag (tunnel; band+koord is niet gemeten en
 * ligt hoger) en verpakking € 2,50/order, € 5,00 vanaf ± 40 stuks. Probo
 * verzendt gratis.
 *
 * Getoetst op vier echte portaal-offertes (baniervlag 100×300, tunnel, wit) van
 * 2026-07-15 — het model voorspelt ze binnen 1-2%:
 *   1 st → € 25,40 · 10 st → € 202,90 · 25 st → € 487,90 · 40 st → € 714,40
 *
 * Probo's eigen verkoopmarge staat op 0% (door Antony bevestigd), dus dit is
 * echte inkoop. Onze marge zit volledig in RETAIL_PRICES hieronder.
 *
 * NB: dit staat hier als documentatie, niet als rekenmodel. De actieve
 * checkout rekent met RETAIL_PRICES; er is geen live inkoopcalculatie.
 */

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
    "Straight Small — 80 × 220 cm": 35, // ECHT (ref 80×220)
    "Straight Medium S — 65 × 315 cm": 45, // ECHT (ref 65×315)
    "Straight Medium L — 80 × 315 cm": 55, // TODO: prijs verifiëren (tussen 65×315=€45 en 90×430=€65)
    "Straight Large — 90 × 430 cm": 65, // ECHT (ref 90×430)
    "Square Small — 75 × 200 cm": 45, // ECHT (ref 75×200)
    "Square Medium — 75 × 300 cm": 55, // ECHT (ref 75×300)
    "Square Large — 75 × 400 cm": 65, // ECHT (ref 75×400)
  },
  baniervlag: {
    // TODO: prijs verifiëren — geen exacte ref-prijzen bekend. Area-scaling
    // geankerd op 100×250 = €38 (≈ €15,20/m²), afgerond op €0,50.
    "100 × 200 cm": 30.5, // TODO: prijs verifiëren (≈ €30,40 area-scaled) = priceFrom
    "100 × 250 cm": 38, // anker
    "100 × 300 cm": 45.5, // TODO: prijs verifiëren (≈ €45,60 area-scaled)
    "100 × 350 cm": 53.5, // TODO: prijs verifiëren (≈ €53,20 area-scaled)
    "100 × 400 cm": 60.5, // TODO: prijs verifiëren (≈ €60,80 area-scaled)
    "125 × 300 cm": 57, // TODO: prijs verifiëren (= €57,00 area-scaled)
    "125 × 350 cm": 66.5, // TODO: prijs verifiëren (≈ €66,50 area-scaled)
    "125 × 400 cm": 76, // TODO: prijs verifiëren (= €76,00 area-scaled)
  },
  mastvlag: {
    // Herprijsd op € 15,20/m² (2026-07-15), afgerond op €0,50.
    //
    // Stond op ≈ €13,19/m², area-geschaald op het oude live-site-punt
    // 225×150 = €44,50. Dat was 13% ónder de baniervlag terwijl het hetzelfde
    // flag-ciclo-doek is en de afwerking (band + koord) duurder is dan een
    // tunnel — de mastvlag draaide daardoor 31-37% brutomarge waar de
    // baniervlag 44-50% doet. Zie de Probo-m²-staffel onder RETAIL_PRICES.
    //
    // Let op: band+koord is nog niet los ingekocht/gemeten. Zodra dat bekend is
    // hoort er een opslag bovenop dit tarief, niet erin.
    // Labels zijn breedte × hoogte.
    "150 × 100 cm": 23, // 1,50 m²
    "180 × 120 cm": 33, // 2,16 m²
    "225 × 150 cm": 51.5, // 3,38 m² — was €44,50 op de live site
    "300 × 200 cm": 91, // 6,00 m²
    "350 × 225 cm": 119.5, // 7,88 m²
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
    // Accessoire als cross-sell per vlag — prijzen ECHT (oude site, stap 7).
    Accessoires: {
      Grondpen: 11,
      Grondplug: 14,
      Kruisvoet: 27,
      "Metalen Standaard": 28,
      "Voetplaat 5 kg": 31,
      "Voetplaat 15 kg": 70,
      "Parasolvoet Zwart": 33,
      "Parasolvoet Wit": 40,
      "Waterzak Grijs": 7,
      "Waterzak Zwart": 8,
      "Rotator Parasol": 8,
      "Rotator Voetplaat": 8,
    },
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

/**
 * De eerstvolgende staffel boven `qty`, of null wanneer de hoogste al gehaald is.
 * Voor de winkelmand: die korting wordt al gerekend, maar zonder dit weet de
 * klant niet dat er twee stuks tussen hem en een lagere stukprijs staan.
 */
export function volgendeStaffel(
  qty: number,
): { qty: number; discount: number; erbij: number } | null {
  const huidig = staffelDiscount(qty);
  const next = STAFFEL_TIERS.find((t) => t.qty > qty && t.discount > huidig);
  return next ? { qty: next.qty, discount: next.discount, erbij: next.qty - qty } : null;
}

/** Vaste prijs (ex btw) van de optionele ontwerpservice. */
export const DESIGN_SERVICE_PRICE = 85;

/** Kosten (ex btw) van de ontwerpservice: het vaste bedrag als aangevinkt, anders 0. */
export function designServiceCost(enabled: boolean): number {
  return enabled ? DESIGN_SERVICE_PRICE : 0;
}

/**
 * Koos de klant de ontwerpservice op deze regel?
 *
 * De configurator zet hem als optie met een menselijke waarde
 * (`Ontwerpservice: "Ja (+€ 85,00)"`), want dat label reist mee naar de
 * orderregel. Hij zit bewust NIET in `unitPriceEstimate`: het is een eenmalig
 * bedrag per order, geen stukprijs. Daardoor verdween hij compleet — de
 * configurator toonde €85, de winkelmand niet, en gefactureerd werd hij nooit.
 */
export function heeftOntwerpservice(selections?: Record<string, string>): boolean {
  return /^ja\b/i.test(selections?.Ontwerpservice?.trim() ?? "");
}

/**
 * Eenmalige ontwerpservice (ex btw) voor een hele bestelling: het vaste bedrag
 * zodra één regel hem heeft. Eenmalig per order, niet per regel en niet per stuk
 * — zo staat het ook in de configurator ("eenmalig per order").
 */
export function ontwerpserviceVoorOrder(
  regels: Array<{ selections?: Record<string, string> }>,
): number {
  return regels.some((r) => heeftOntwerpservice(r.selections)) ? DESIGN_SERVICE_PRICE : 0;
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

/**
 * Ondergrens (ex btw, per stuk) voor een eigen maat — voorkomt onrealistisch
 * lage prijzen bij hele kleine vlaggen.
 * // TODO: tarief verifiëren met Antony.
 */
export const CUSTOM_SIZE_FLOOR = 20;

/**
 * €/m²-tarief voor een eigen maat, per product afgeleid uit de bekende
 * retailprijzen: de goedkoopste maat gedeeld door zijn oppervlak. Zo sluit een
 * eigen maat aan op de echte prijsstelling van dat product.
 * // TODO: tarief verifiëren — afgeleid, geen los bevestigd m²-tarief.
 */
export function customRatePerM2(product: CatalogProduct): number {
  let best: { price: number; area: number } | null = null;
  for (const s of product.sizes) {
    const area = sizeAreaM2(s);
    if (area == null || area <= 0) continue;
    const price = localUnitPrice(product, s);
    if (best == null || price < best.price) best = { price, area };
  }
  if (best == null) return 0;
  return best.price / best.area;
}

/**
 * Ex-btw stukprijs voor een EIGEN (vrije) maat in cm.
 * prijs = max(m² × €/m²-tarief, ondergrens).
 * // TODO: tarief verifiëren.
 */
export function localCustomSizePrice(
  product: CatalogProduct,
  widthCm: number,
  heightCm: number,
): number {
  const area = (widthCm / 100) * (heightCm / 100);
  if (!Number.isFinite(area) || area <= 0) return round2(CUSTOM_SIZE_FLOOR);
  const rate = customRatePerM2(product);
  return round2(Math.max(area * rate, CUSTOM_SIZE_FLOOR));
}

/**
 * Toeslag (ex btw, per stuk) voor de gekozen opties.
 *
 * Multi-keuzes (bv. meerdere beachvlag-accessoires) reizen als ÉÉN waarde met
 * " · " als scheider ("Grondpen · Waterzak Grijs") — dezelfde string staat ook
 * op de orderregel. Elke deelkeuze telt hier los mee in de toeslag.
 */
export function localOptionsSurcharge(
  product: CatalogProduct,
  selections: Record<string, string> = {},
): number {
  const table = OPTION_SURCHARGES[product.slug];
  if (!table) return 0;
  let total = 0;
  for (const [label, value] of Object.entries(selections)) {
    const choices = table[label];
    if (!choices) continue;
    for (const part of String(value).split(" · ")) {
      const add = choices[part];
      if (add) total += add;
    }
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
 * Ex-btw stukprijs voor een regel, of de maat nu uit de catalogus komt of vrij
 * is ingevuld.
 *
 * Dit sluit een lek. `getSize()` matcht op label, en een eigen maat heet
 * "Eigen: 245 × 130 cm" — dat staat nooit in `product.sizes`. `size` bleef dus
 * undefined en `localUnitPrice` viel door naar `priceFrom`: een mastvlag van
 * 400 × 200 cm werd afgerekend voor €23 in plaats van €122,67. De configurator
 * rekende het wél goed (via `localCustomSizePrice`), maar `buildLocalQuote`
 * riep die functie nooit aan, dus verloor elke bestelling met een eigen maat
 * geld — bij élke bestelling opnieuw.
 *
 * Vandaar de afmetingen als expliciete invoer: is er geen catalogusmaat maar
 * wél breedte/hoogte, dan rekenen we per m², precies zoals de configurator.
 */
export function localUnitPriceForLine(input: {
  product: CatalogProduct;
  size?: CatalogSize;
  widthCm?: number;
  heightCm?: number;
  selections?: Record<string, string>;
}): number {
  const { product, size, widthCm, heightCm, selections } = input;
  const surcharge = localOptionsSurcharge(product, selections);

  if (!size && widthCm && heightCm && supportsCustomSize(product.slug)) {
    return round2(localCustomSizePrice(product, widthCm, heightCm) + surcharge);
  }
  return round2(localUnitPrice(product, size) + surcharge);
}

/**
 * Ex-btw regelprijs = (stukprijs + optie-toeslagen) × aantal × (1 − staffel).
 * De staffelkorting hoort bij het aantal en wordt hier verwerkt.
 */
export function localLinePrice(input: {
  product: CatalogProduct;
  size?: CatalogSize;
  /** Vrije maat in cm — nodig zodra `size` ontbreekt (eigen maat). */
  widthCm?: number;
  heightCm?: number;
  amount: number;
  selections?: Record<string, string>;
}): number {
  const { product, size, widthCm, heightCm, amount, selections } = input;
  const qty = Math.max(1, amount);
  const unit = localUnitPriceForLine({ product, size, widthCm, heightCm, selections });
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

/** Gratis verzending vanaf dit bedrag INCLUSIEF btw — zo doen we de belofte. */
export const FREE_SHIPPING_THRESHOLD_INCL_VAT = 100;

/**
 * Dezelfde drempel, ex btw — want dit hele bestand rekent ex btw.
 *
 * Teruggerekend tegen het NL-standaardtarief (`VAT_RATES.NL`): dat is het
 * tarief waarin de belofte aan de klant is gedaan. Klanten met verlegde btw of
 * export krijgen bewust dezelfde ex-btw drempel; voor hen bestaat er geen
 * incl-bedrag om tegen af te zetten, en een hógere ex-drempel zou hen zonder
 * reden zwaarder belasten dan een Nederlandse klant.
 */
export const FREE_SHIPPING_THRESHOLD =
  FREE_SHIPPING_THRESHOLD_INCL_VAT / (1 + VAT_RATES[SELLER_COUNTRY] / 100);

/** Verzendkosten ex btw op basis van het subtotaal ex btw. */
export function localShipping(subtotalExVat: number): number {
  return subtotalExVat >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
}
