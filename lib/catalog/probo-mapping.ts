/**
 * Storefront-choice → Probo options mapping for orderable products.
 *
 * The configurator and cart store a customer's choices as Dutch labels
 * (e.g. Afwerking = "Zoom met ringen"). Probo wants option *codes* (e.g.
 * `band-and-plastic-rings`). This module is the single translation layer, used
 * door de checkout bij het opbouwen van de order.
 *
 * LET OP — dit is GEEN API-koppeling meer. De Probo-API-client is verwijderd
 * (2026-07-15): we bestellen handmatig via het Probo-portaal. Deze mapping
 * blijft bestaan omdat het resultaat op `order_items.configuration` wordt
 * opgeslagen, en dát is hoe je in de admin en op de pakbon ziet wát je moet
 * inkopen. De codes zijn dus documentatie voor een mens, geen payload meer.
 *
 * Two product shapes exist (both verified LIVE against the Probo TEST API,
 * 2026-07-13):
 *
 *  - "custom-size" (the `flag-ciclo` doek for baniervlag/mastvlag): numeric
 *    width/height in cm → amount → finishing chain.
 *  - "preset-size" (beachvlag/gevelvlag composed products): amount → material
 *    (`flag-ciclo`) → a size *preset* code (e.g. `65x315cm`) → flag-pole side →
 *    composition/finishing. For the beachvlag the Probo product code itself
 *    depends on the chosen model/size (`beachflag-straight` vs
 *    `beachflag-square`), so the mapping returns the effective `productCode`.
 *
 * Storefront choices that have NO Probo equivalent are returned in `unmapped`
 * so they can be stored on the order line for the admin; they are never sent
 * to Probo.
 *
 * Plain module (no `server-only`): only pure data + functions, safe to import
 * from server actions and — should it ever be needed — the client.
 */

/**
 * Bezorgadres, in de vorm die het Probo-portaal aanhoudt. Woonde eerst in
 * lib/probo/products.ts; die API-client is weg, maar deze vorm staat in
 * `orders.billing_address`/`shipping_address` (JSONB) en wordt door de
 * storefront, de admin en de pakbon gelezen. Verander de veldnamen dus niet
 * zonder migratie.
 */
export interface ProboAddress {
  company_name?: string;
  first_name?: string;
  last_name?: string;
  street?: string;
  house_number?: string;
  addition?: string;
  postal_code?: string;
  city?: string;
  country?: string;
}

/** Eén optiekeuze op een regel, als code + waarde. */
export interface ProboOption {
  code: string;
  /** Sommige opties zijn vlaggetjes en dragen geen waarde. */
  value?: string | number;
}

/** Oude naam uit lib/probo/products.ts, behouden voor de bestaande importeurs. */
export type ProboOptionInput = ProboOption;

export interface BuildProboOptionsInput {
  /** Flag width in cm → Probo `width` (custom-size) or preset lookup key. */
  widthCm: number;
  /** Flag height in cm → Probo `height` (custom-size) or preset lookup key. */
  heightCm: number;
  /** Quantity → Probo `amount`. */
  amount: number;
  /** Storefront selections keyed by option label, e.g. `{ Afwerking: "Tunnelzoom" }`. */
  selections: Record<string, string>;
}

export interface ProboOptionsResult {
  /**
   * Effective Probo product code for this configuration. Usually the catalogue
   * `proboProductCode`, but preset products may override it per size (e.g. a
   * Squareflag size selects `beachflag-square`).
   */
  productCode: string;
  /** A valid Probo options array for configure/price/order. */
  options: ProboOption[];
  /** Storefront choices with no Probo equivalent — kept for the order line only. */
  unmapped: Array<{ label: string; value: string }>;
}

/** Per-choice Probo codes for one storefront option. */
type ChoiceCodes = Record<string, ProboOption[]>;

interface ProductMapping {
  /** Default Probo product code (see `sizePresets` for per-size overrides). */
  productCode: string;
  /** How the size is expressed: numeric width/height vs a preset code. */
  mode: "custom-size" | "preset-size";
  /**
   * Fixed options in validated order. Custom-size: appended after
   * width/height/amount. Preset-size: appended after amount, before the size
   * preset (e.g. the `flag-ciclo` material choice).
   */
  base: ProboOption[];
  /**
   * Preset-size only: `${widthCm}x${heightCm}` → Probo size-preset code, with an
   * optional product-code override for that size.
   */
  sizePresets?: Record<string, { code: string; productCode?: string }>;
  /**
   * Storefront option label → its choice map, or `null` when the whole option
   * has no Probo equivalent (recorded in `unmapped`, never sent).
   */
  options: Record<string, ChoiceCodes | null>;
  /**
   * Fixed options appended AFTER the mapped storefront options — the validated
   * tail of the chain (composition/finishing for preset products).
   */
  tail?: ProboOption[];
}

/** Left/right mast-side choice, shared by beachvlag and gevelvlag. */
const MASTZIJDE: ChoiceCodes = {
  Links: [{ code: "left" }],
  Rechts: [{ code: "right" }],
};

/**
 * Confirmed mappings. Keyed by storefront product slug (see lib/catalog/products).
 * A product listed here is orderable online; anything else stays quote-only.
 */
const MAPPINGS: Record<string, ProductMapping> = {
  baniervlag: {
    productCode: "flag-ciclo",
    mode: "custom-size",
    base: [{ code: "finishing-all-sides" }],
    options: {
      // De configurator biedt Tunnel/Geen. flag-ciclo heeft GEEN echte
      // tunnel-/sleeve-finish (live geverifieerd: geen van de 7 finishing-types
      // is een tunnel); de dichtstbijzijnde bestelbare afwerking is een gewone
      // zoom ("hem"). Beide keuzes bestellen we daarom als zoom — de originele
      // klantkeuze staat óók op de orderregel, zodat de studio een tunnel
      // handmatig kan afhandelen.
      // TODO: met Antony verifiëren hoe de tunnel-afwerking bij Probo echt
      // besteld moet worden (evt. apart product of handmatige order).
      Afwerking: {
        Tunnel: [{ code: "hem" }],
        Geen: [{ code: "hem" }],
      },
      // Mastzijde en Bandkleur hebben (nog) geen live-geverifieerde
      // flag-ciclo-codes → nooit gokken richting Probo; ze reizen als
      // `unmapped` mee op de orderregel voor de studio.
      // TODO: verifiëren of flag-ciclo custom-size een pole-side/bandkleur kent.
      Mastzijde: null,
      Bandkleur: null,
    },
  },
  mastvlag: {
    productCode: "flag-ciclo",
    mode: "custom-size",
    base: [{ code: "finishing-all-sides" }],
    options: {
      // Mast flags finish with band + cord; the band/cord colour maps to Probo's
      // colour code (white/black). Cord length is fixed at 200 cm (confirmed).
      // De colour-optie draagt de live-geverifieerde band-and-cord-keten.
      Kleur: {
        Wit: [{ code: "band-and-cord" }, { code: "white" }, { code: "200cm" }],
        Zwart: [{ code: "band-and-cord" }, { code: "black" }, { code: "200cm" }],
      },
      // Mastzijde en Afwerking (Haken/Clips vs Koord/Lus) hebben (nog) geen
      // live-geverifieerde flag-ciclo-code. De band-and-cord-keten hierboven gaat
      // uit van koord/lus; bij "Haken (Clips)" reist de klantkeuze als `unmapped`
      // mee op de orderregel zodat de studio de haken-afwerking handmatig regelt.
      // TODO: met Antony/Probo verifiëren of flag-ciclo een haken-/pole-side-code kent.
      Mastzijde: null,
      Afwerking: null,
      // "Ontwerpservice" is our own design service — no Probo equivalent.
      Ontwerpservice: null,
    },
  },
  beachvlag: {
    // The model (Straightflag/Squareflag) is encoded in the size — each size
    // belongs to exactly one model — so straight sizes use `beachflag-straight`
    // and square sizes override to `beachflag-square`. Material is always the
    // sustainable Flag-CiCLO® doek; composition is fixed to vlag + stok +
    // draagtas (matches the storefront promise). Every size × side combination
    // validated live (can_order:true + /price), 2026-07-13.
    productCode: "beachflag-straight",
    mode: "preset-size",
    base: [{ code: "flag-ciclo" }],
    sizePresets: {
      // Alleen live-geverifieerde Probo-presets. 80×220 en 80×315 (oude-site-maten)
      // hebben géén preset → quoteOnly in de catalogus, komen hier bewust niet in.
      "65x315": { code: "65x315cm" },
      "90x430": { code: "90x430cm" },
      "75x200": { code: "75x200cm", productCode: "beachflag-square" },
      "75x300": { code: "75x300cm", productCode: "beachflag-square" },
      "75x400": { code: "75x400cm", productCode: "beachflag-square" },
    },
    options: {
      Mastzijde: MASTZIJDE,
      // Samenstelling: online sturen we altijd de geverifieerde volledige
      // samenstelling (flag-stick-bag-deluxe, zie tail). "Vlag + stok" en "Alleen
      // vlag" hebben nog geen geverifieerde Probo-code én geen aparte prijs → de
      // keuze reist als `unmapped` mee op de orderregel; de studio stemt af/factureert.
      // TODO: met Antony/Probo de composition-codes + prijzen per samenstelling verifiëren.
      Samenstelling: null,
      // Accessoires (grondpen/kruisvoet/voetplaat/waterzak/rotator/…) zijn
      // cross-sell met eigen Probo-codes → buiten scope, alleen op de orderregel.
      Accessoires: null,
    },
    tail: [{ code: "flag-stick-bag-deluxe" }], // vlag, stok en draagtas (standaard)
  },
  gevelvlag: {
    productCode: "facade-flag",
    mode: "preset-size",
    base: [{ code: "flag-ciclo" }],
    sizePresets: {
      "100x70": { code: "100x70cm" },
      "150x100": { code: "150x100cm" },
      "225x150": { code: "225x150cm" },
    },
    options: {
      Mastzijde: MASTZIJDE,
      // Afwerking is vast "band, koord en lus" (zit al in `tail`) → herkend maar
      // stuurt zelf niets, zodat het niet dubbel gaat of als unmapped verschijnt.
      Afwerking: { "Koord/Lus": [] },
      // Band-/koord-/luskleur: nog geen live-geverifieerde facade-strap-colour-code
      // → reist als `unmapped` mee op de orderregel (nooit gokken richting Probo).
      // TODO: met Antony/Probo verifiëren of landscape-strap-cord-loop een kleur kent.
      Kleur: null,
      // The wall bracket is cross-sell hardware (facade-pole-* accessories at
      // Probo, separate codes) → not sent, recorded on the order line.
      Uithouder: null,
    },
    // "Met band, koord en lus" — the only finishing facade-flag offers.
    tail: [{ code: "landscape-strap-cord-loop" }],
  },
};

/** Slugs with a confirmed Probo option mapping (i.e. orderable online). */
export const MAPPED_SLUGS: readonly string[] = Object.keys(MAPPINGS);

/** True when `slug` has a confirmed Probo option mapping. */
export function hasProboMapping(slug: string): boolean {
  return slug in MAPPINGS;
}

/**
 * True when het product een vrije eigen maat aankan: custom-size-producten
 * (numerieke width/height richting Probo) en quote-only-producten (offerte).
 * Preset-size-producten (beachvlag/gevelvlag) kunnen dat NIET — een onbekende
 * maat heeft geen preset-code en zou pas bij het afrekenen stranden.
 */
export function supportsCustomSize(slug: string): boolean {
  const mapping = MAPPINGS[slug];
  return !mapping || mapping.mode === "custom-size";
}

/**
 * Translate a configurator/cart selection into a valid Probo options array +
 * the effective product code. Returns `null` for products without a mapping
 * (they stay quote-only) and for unknown preset sizes (bad/stale cart data).
 *
 * The output `options` order is stable and matches what was validated live:
 *  - custom-size: width, height, amount, base, mapped options.
 *  - preset-size: amount, base (material), size preset, mapped options, tail.
 */
export function buildProboOptions(
  slug: string,
  input: BuildProboOptionsInput,
): ProboOptionsResult | null {
  const mapping = MAPPINGS[slug];
  if (!mapping) return null;

  let productCode = mapping.productCode;
  const options: ProboOption[] = [];

  if (mapping.mode === "custom-size") {
    options.push(
      { code: "width", value: String(input.widthCm) },
      { code: "height", value: String(input.heightCm) },
      { code: "amount", value: String(input.amount) },
      ...mapping.base,
    );
  } else {
    const preset = mapping.sizePresets?.[`${input.widthCm}x${input.heightCm}`];
    if (!preset) return null; // unknown size → never guess a preset code
    if (preset.productCode) productCode = preset.productCode;
    options.push(
      { code: "amount", value: String(input.amount) },
      ...mapping.base,
      { code: preset.code },
    );
  }

  const unmapped: Array<{ label: string; value: string }> = [];
  for (const [label, choiceCodes] of Object.entries(mapping.options)) {
    const chosen = input.selections[label];
    if (chosen === undefined) continue;
    if (choiceCodes === null || !(chosen in choiceCodes)) {
      unmapped.push({ label, value: chosen });
      continue;
    }
    options.push(...choiceCodes[chosen]);
  }
  // Vangnet: selecties waarvan het label helemaal niet (meer) in de mapping
  // staat — bv. na een catalogus-wijziging — mogen nooit stilletjes verdwijnen.
  // Ze reizen als `unmapped` mee op de orderregel voor de admin.
  for (const [label, chosen] of Object.entries(input.selections)) {
    if (!(label in mapping.options)) {
      unmapped.push({ label, value: chosen });
    }
  }

  options.push(...(mapping.tail ?? []));

  return { productCode, options, unmapped };
}
