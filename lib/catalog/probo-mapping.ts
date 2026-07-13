/**
 * Storefront-choice → Probo options mapping for orderable products.
 *
 * The configurator and cart store a customer's choices as Dutch labels
 * (e.g. Afwerking = "Zoom met ringen"). Probo's configure/price/order API wants
 * option *codes* (e.g. `band-and-plastic-rings`). This module is the single
 * translation layer, used by the live-price server action and by checkout when
 * building the order — so a valid Probo options array is produced in exactly one
 * place.
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

/** A Probo option selection (code + optional value). Mirrors `ProboOptionInput`. */
export interface ProboOption {
  code: string;
  value?: string | number;
}

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
      // flag-ciclo has NO tunnel/sleeve ("Tunnelzoom") finish (verified: none of
      // the 7 finishing types is a tunnel). The nearest orderable finish is a
      // plain hem; "Zoom met ringen" maps to band + plastic rings in every corner.
      // The customer's original label is also kept on the order line.
      Afwerking: {
        Tunnelzoom: [{ code: "hem" }],
        "Zoom met ringen": [
          { code: "band-and-plastic-rings" },
          { code: "every-corner" },
        ],
      },
      // Mounting hardware (Karabijnhaken / Spankoord) exists only as optional
      // cross-sell accessories with non-matching names → not sent to Probo.
      Bevestiging: null,
    },
  },
  mastvlag: {
    productCode: "flag-ciclo",
    mode: "custom-size",
    base: [{ code: "finishing-all-sides" }],
    options: {
      // Mast flags finish with band + cord; the band/cord colour maps to Probo's
      // colour code (white/black). Cord length is fixed at 200 cm (confirmed).
      "Band- en koordkleur": {
        Wit: [{ code: "band-and-cord" }, { code: "white" }, { code: "200cm" }],
        Zwart: [{ code: "band-and-cord" }, { code: "black" }, { code: "200cm" }],
      },
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
      "40x235": { code: "40x235cm" },
      "65x315": { code: "65x315cm" },
      "90x430": { code: "90x430cm" },
      "75x200": { code: "75x200cm", productCode: "beachflag-square" },
      "75x300": { code: "75x300cm", productCode: "beachflag-square" },
      "75x400": { code: "75x400cm", productCode: "beachflag-square" },
    },
    options: {
      Mastzijde: MASTZIJDE,
      // Feet (Grondpin/Kruisvoet/Watertank) are cross-sell accessories with
      // separate Probo codes → out of scope for now, recorded on the order line.
      Voet: null,
    },
    tail: [{ code: "flag-stick-bag-deluxe" }], // vlag, stok en draagtas
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

  options.push(...(mapping.tail ?? []));

  return { productCode, options, unmapped };
}
