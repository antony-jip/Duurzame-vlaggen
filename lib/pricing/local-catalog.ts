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

import {
  getProduct,
  type CatalogProduct,
  type CatalogSize,
} from "@/lib/catalog/products";
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
export function sizeAreaM2(
  size: Pick<CatalogSize, "widthCm" | "heightCm">,
): number | null {
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
 * Mastvlag-tarief per m² (ex btw) — STAP 2 van een gefaseerde verhoging.
 *
 *   stap 1 (2026-07-15): € 15,20/m²   ← eerder in de code ingesteld
 *   stap 2 (2026-07-20): € 18,50/m²   ← nu
 *
 * Waarom omhoog: de mediane concurrent vraagt € 24,33/m² voor een mastvlag en
 * de dichtstbijzijnde vergelijkbare aanbieder (Helloprint, rPET) € 16,95. Wij
 * stonden effectief op € 15,33/m² — een commodity-prijs onder een
 * premium-propositie. Stap 2 zet ons boven de rPET-aanbieder en nog ruim onder
 * de mediaan, zodat er een derde stap mogelijk blijft.
 *
 * Terugdraaien: zet deze constante terug en herbereken de vijf maten in
 * RETAIL_PRICES.mastvlag (m² × tarief, afgerond op € 0,50).
 */
export const MASTVLAG_PRIJS_PER_M2 = 18.5;

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
    // +15% t.o.v. de ref-prijzen (2026-07-20), afgerond op €0,50 — het rooster
    // waarop deze prijzen al stonden. Geen enkele concurrent voert een
    // afbreekbaar doek in dit segment, dus er is geen prijsanker om ons aan te
    // spiegelen. Was: 17,50 / 29,50 / 59,50.
    "100 × 70 cm": 20, // ECHT (ref) +14,3%
    "150 × 100 cm": 34, // ECHT (ref) +15,3%
    "225 × 150 cm": 68.5, // ECHT (ref, "Grote Gevelvlag") +15,1%
  },
  beachvlag: {
    // +15% t.o.v. de ref-prijzen (2026-07-20), afgerond op hele euro's — het
    // rooster waarop deze prijzen al stonden. Zelfde reden als de gevelvlag.
    // Was: 35 / 45 / 49 / 65 / 45 / 55 / 65.
    //
    // NB: alleen het doek gaat omhoog. De hardware-toeslagen in
    // OPTION_SURCHARGES (stok, draagtas, accessoires) blijven ongewijzigd; daar
    // zit geen Flag-CiCLO in en dus geen premium-argument.
    "Straight Small — 80 × 220 cm": 40, // ECHT (ref 80×220)
    "Straight Medium S — 65 × 315 cm": 52, // ECHT (ref 65×315)
    "Straight Medium L — 80 × 315 cm": 56, // ECHT (configurator 80×315)
    "Straight Large — 90 × 430 cm": 75, // ECHT (ref 90×430)
    "Square Small — 75 × 200 cm": 52, // ECHT (ref 75×200)
    "Square Medium — 75 × 300 cm": 63, // ECHT (ref 75×300)
    "Square Large — 75 × 400 cm": 75, // ECHT (ref 75×400)
  },
  baniervlag: {
    // ECHT — 100/120-brede maten uit de configurator, grote maten door Antony
    // bevestigd (2026-07-16).
    //
    // BEWUST NIET VERHOOGD in de ronde van 2026-07-20, als enige productgroep.
    // Better Flags (betterflags.eu, het merk zelf) vraagt € 34,95 ex btw voor
    // 100×300 waar wij € 38,00 vragen. Wij zitten daar al 8,7% boven. Pas
    // heroverwegen zodra duidelijk is of hun Nederlandse webshop er komt.
    "100 × 250 cm": 32.5,
    "100 × 300 cm": 38,
    "100 × 350 cm": 45,
    "100 × 400 cm": 52,
    "120 × 300 cm": 42,
    "120 × 350 cm": 49,
    "120 × 400 cm": 56,
    "150 × 450 cm": 88,
    "150 × 500 cm": 97.5,
    // Extra grote maten, area-geschaald op €13/m² (150×550 = 8,25 m²,
    // 150×600 = 9,00 m²). // TODO: prijs verifiëren met Antony.
    "150 × 550 cm": 107.5,
    "150 × 600 cm": 117,
  },
  mastvlag: {
    // Herprijsd op MASTVLAG_PRIJS_PER_M2 (2026-07-20), afgerond op €0,50.
    // Zie die constante voor de fasering en de marktvergelijking.
    //
    // Historie: stond op ≈ €13,19/m², area-geschaald op het oude live-site-punt
    // 225×150 = €44,50. Dat was 13% ónder de baniervlag terwijl het hetzelfde
    // flag-ciclo-doek is en de afwerking (band + koord) duurder is dan een
    // tunnel — de mastvlag draaide daardoor 31-37% brutomarge waar de
    // baniervlag 33-45% doet. Zie de Probo-m²-staffel onder RETAIL_PRICES.
    //
    // Let op: band+koord is nog niet los ingekocht/gemeten. Zodra dat bekend is
    // hoort er een opslag bovenop dit tarief, niet erin.
    // Labels zijn breedte × hoogte.
    "150 × 100 cm": 27.5, // 1,50 m² → 27,75 op tarief, 27,50 op het rooster
    "180 × 120 cm": 40, // 2,16 m² → 39,96
    "225 × 150 cm": 62.5, // 3,375 m² → 62,44
    "300 × 200 cm": 111, // 6,00 m² → 111,00
    "350 × 225 cm": 145.5, // 7,875 m² → 145,69
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
    // Samenstelling-toeslag t.o.v. het kale doek (configurator-prijzen):
    // stok +€15, stok + draagtas +€22,50.
    Samenstelling: {
      "Alleen vlag": 0,
      "Vlag + stok": 15,
      "Vlag + stok + tas": 22.5,
    },
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
  gevelvlag: {
    // Losse artikelen per stuk — inkoop + 65% marge, afgerond op €0,50 naar
    // boven (inkoop: stok wit/blauw/oranje €12,69, zwart €17,50, houder €5,50,
    // houder zwart €10,75, handystick €29,50).
    Accessoires: {
      "Gevelstok Wit": 21,
      "Gevelstok Blauw": 21,
      "Gevelstok Oranje": 21,
      "Gevelstok Zwart": 29,
      Gevelstokhouder: 9.5,
      "Gevelstokhouder Zwart": 18,
      Handystick: 49,
    },
  },
};

/**
 * Staffelkorting: hoe meer stuks, hoe hoger het kortingspercentage.
 * Tiers 1/5/10/25/50 → 0/5/10/12/20% (10 stuks = "Meest gekozen").
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
  // 25 stuks stond op 15% en veroorzaakte een MARGEKNIK: onze korting daalde
  // sneller dan Probo's inkoopstaffel, dus 25 stuks leverde minder marge op dan
  // 10 stuks. Nagerekend op de vier echte Probo-offertes (baniervlag 100×300,
  // retail € 38,00, 2026-07-15):
  //
  //   aantal   inkoop p.s.   retail na staffel   marge
  //        1        25,40              38,00     33,2%
  //       10        20,29              34,20     40,7%
  //       25        19,52              32,30     39,6%  ← de knik
  //       40        17,86              32,30     44,7%
  //
  // Op 12% wordt 25 stuks € 33,44 retail en 41,6% marge: de reeks loopt weer op.
  //
  // Bekende restdip: bij 50 stuks komt de marge op ± 40,9% uit, iets onder de
  // 41,6% van 25. Die berekening rust op een geëxtrapoleerd inkooptarief van
  // € 5,90/m² en niet op een echte offerte, dus de 50-trede blijft staan tot we
  // hem gemeten hebben.
  { qty: 25, discount: 0.12 },
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
  return next
    ? { qty: next.qty, discount: next.discount, erbij: next.qty - qty }
    : null;
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
export function heeftOntwerpservice(
  selections?: Record<string, string>,
): boolean {
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
  return regels.some((r) => heeftOntwerpservice(r.selections))
    ? DESIGN_SERVICE_PRICE
    : 0;
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
export function localUnitPrice(
  product: CatalogProduct,
  size?: CatalogSize,
): number {
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
 * Vaste eigen-maat-tarieven per product waar de configurator een expliciet
 * m²-tarief + ondergrens hanteert (i.p.v. het afgeleide tarief). Baniervlag:
 * € 14/m², minimaal € 25 — 1-op-1 uit de configurator.
 */
const CUSTOM_SIZE_RATES: Record<string, { perM2: number; floor: number }> = {
  baniervlag: { perM2: 14, floor: 25 },
  // Mastvlag expliciet, niet afgeleid. `customRatePerM2()` leidt het tarief af
  // uit de goedkoopste maat, en die staat op het €0,50-rooster (27,50 i.p.v.
  // 27,75). Zonder deze regel zou het eigen-maat-tarief daardoor op € 18,33/m²
  // landen in plaats van de bedoelde € 18,50 — een afrondingsbijproduct dat het
  // prijsbeleid stuurt. Nu bepaalt MASTVLAG_PRIJS_PER_M2 beide onafhankelijk.
  mastvlag: { perM2: MASTVLAG_PRIJS_PER_M2, floor: CUSTOM_SIZE_FLOOR },
};

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
  const override = CUSTOM_SIZE_RATES[product.slug];
  const floor = override?.floor ?? CUSTOM_SIZE_FLOOR;
  const area = (widthCm / 100) * (heightCm / 100);
  if (!Number.isFinite(area) || area <= 0) return round2(floor);
  const rate = override?.perM2 ?? customRatePerM2(product);
  return round2(Math.max(area * rate, floor));
}

/**
 * Optielabels die losse artikelen zijn (eigen aantal, los van het
 * vlaggenaantal) in plaats van een eigenschap van de vlag. Ze tellen NIET mee
 * in de stukprijs/staffel maar als vast bedrag op de regel — 2 vlaggen met
 * 1 kruisvoet = 1 kruisvoet, niet 2.
 */
const LOSSE_ARTIKEL_OPTIES = new Set(["Accessoires"]);

/**
 * Eén deelkeuze van een losse-artikelen-optie: optioneel aantal-prefix
 * ("2× Kruisvoet"), zonder prefix telt hij één keer.
 */
function parseArtikelDeel(part: string): { qty: number; name: string } {
  const m = /^(\d+)× (.+)$/.exec(part);
  return m ? { qty: Number(m[1]), name: m[2] } : { qty: 1, name: part };
}

/**
 * Toeslag (ex btw, per stuk) voor de gekozen opties.
 *
 * Multi-keuzes reizen als ÉÉN waarde met " · " als scheider — dezelfde string
 * staat ook op de orderregel. Losse artikelen (accessoires) tellen hier NIET
 * mee: die zijn geen stukprijs-eigenschap maar een vast regelbedrag, zie
 * `localAccessoiresTotal`.
 */
export function localOptionsSurcharge(
  product: CatalogProduct,
  selections: Record<string, string> = {},
): number {
  const table = OPTION_SURCHARGES[product.slug];
  if (!table) return 0;
  let total = 0;
  for (const [label, value] of Object.entries(selections)) {
    if (LOSSE_ARTIKEL_OPTIES.has(label)) continue;
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
 * Vast regelbedrag (ex btw) voor losse artikelen (accessoires): elke deelkeuze
 * × zijn eigen aantal ("2× Kruisvoet · Waterzak Zwart" = 2×27 + 1×8). Staat
 * bewust buiten stukprijs en staffelkorting.
 */
export function localAccessoiresTotal(
  product: CatalogProduct,
  selections: Record<string, string> = {},
): number {
  const table = OPTION_SURCHARGES[product.slug];
  if (!table) return 0;
  let total = 0;
  for (const [label, value] of Object.entries(selections)) {
    if (!LOSSE_ARTIKEL_OPTIES.has(label)) continue;
    const choices = table[label];
    if (!choices) continue;
    for (const part of String(value).split(" · ")) {
      const { qty, name } = parseArtikelDeel(part);
      const add = choices[name];
      if (add) total += qty * add;
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
  return round2(
    localUnitPrice(product, size) + localOptionsSurcharge(product, selections),
  );
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
  const unit = localUnitPriceForLine({
    product,
    size,
    widthCm,
    heightCm,
    selections,
  });
  // Losse artikelen (accessoires × eigen aantal) als vast bedrag erbovenop —
  // buiten aantal en staffel.
  const artikelen = localAccessoiresTotal(product, selections);
  return round2(unit * qty * (1 - staffelDiscount(qty)) + artikelen);
}

/**
 * Ex-btw regeltotaal voor de winkelmand/checkout-WEERGAVE, gerekend vanaf de
 * opgeslagen stukprijs (`unitPriceEstimate`) × aantal × (1 − staffel). Zo tonen
 * mand en afrekenen dezelfde staffel-korting als de definitieve `buildLocalQuote`.
 */
export function localCartLineTotal(
  unitPriceEx: number,
  amount: number,
): number {
  const qty = Math.max(1, amount);
  return round2(unitPriceEx * qty * (1 - staffelDiscount(qty)));
}

/**
 * Ex-btw regeltotaal voor een winkelmandregel INCLUSIEF losse accessoires.
 * Zelfde optelling als `localLinePrice`: (stukprijs × aantal × staffel) +
 * accessoires × eigen aantal. Mand en checkout-weergave gebruiken déze, zodat
 * ze niets anders tonen dan `buildLocalQuote` afrekent.
 */
export function cartRegelTotaal(item: {
  slug: string;
  unitPriceEstimate: number;
  amount: number;
  options: Array<{ code: string; value?: string | number | null }>;
}): number {
  const basis = localCartLineTotal(item.unitPriceEstimate, item.amount);
  const product = getProduct(item.slug);
  if (!product) return basis;
  const selections = Object.fromEntries(
    item.options.map((o) => [o.code, String(o.value ?? "")]),
  );
  return round2(basis + localAccessoiresTotal(product, selections));
}

/** Eigen verzendregel (ex btw). */
export const SHIPPING_FLAT = 7.5;

/**
 * Gratis verzending vanaf dit bedrag INCLUSIEF btw — zo doen we de belofte.
 *
 * Stond op € 100 zonder onderbouwing, terwijl twee referentiedocumenten van de
 * live site € 150 vastleggen (`docs/configurator-ref/beachflag-live-config.md`
 * en `gevelvlag-live-config.md`). De refs winnen: dat is de gemeten
 * werkelijkheid van de bestaande winkel.
 *
 * MARGE-EFFECT: boven de drempel dragen wíj de € 7,50 uit `SHIPPING_FLAT`. Op
 * een order van € 100 incl btw was dat ± 9% van de ex-btw-omzet, wat de
 * brutomarge op een enkelstuksbestelling grotendeels opat. Dat bedrag zit in
 * geen enkele margeberekening in dit bestand verwerkt; de marges in de
 * comments hierboven zijn dus vóór verzendbijdrage.
 */
export const FREE_SHIPPING_THRESHOLD_INCL_VAT = 150;

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
