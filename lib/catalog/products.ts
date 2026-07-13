/**
 * Static product catalogue for the storefront (Fase 3).
 *
 * The legacy WordPress site keeps its catalogue in hardcoded Elementor pages,
 * not a database, so this file is the bridge: the five flag types with the
 * content/pricing pulled from the old site (see docs/CONTENT-MAP.md).
 *
 * `proboProductCode` / `proboOptionTemplate` are the seam to the Probo
 * integration (lib/probo). They are `null` until Antony confirms the exact
 * Probo product codes + option mapping per flag type — until then a product is
 * "quote-only" (no live configure/price/checkout). See docs/GO-LIVE.md.
 */

export type ProductCategory = "vlag" | "hardware";

export interface CatalogSize {
  label: string;
  /** width × height in cm, if applicable. */
  widthCm?: number;
  heightCm?: number;
}

export interface CatalogOption {
  /** Human label, e.g. "Mastzijde". */
  label: string;
  /** Choices, e.g. ["Links", "Rechts"]. */
  choices: string[];
}

export interface ProductImage {
  /** Absolute URL (Supabase Storage, migrated from WordPress). */
  src: string;
  /** Dutch alt text. */
  alt: string;
}

/** Base URL of the migrated WordPress media in Supabase Storage. */
const MEDIA_BASE =
  "https://hyvtseexvsdpdlrzwtgi.supabase.co/storage/v1/object/public/product-media/wp/";

/** Shorthand for building a product image from its storage filename. */
function img(file: string, alt: string): ProductImage {
  return { src: `${MEDIA_BASE}${file}`, alt };
}

/** Sfeer-/trustbeelden voor homepage en productpagina's. */
export const BRAND_IMAGES = {
  homeHero: img(
    "756-duurzame-vlaggen-home-1.webp",
    "Duurzame vlaggen wapperend aan vlaggenmasten",
  ),
  homeAlt: img(
    "764-duurzame-vlaggen-home-2.webp",
    "Duurzame bedrijfsvlaggen in de buitenlucht",
  ),
  fabricDetail: img(
    "592-duurzame-vlag-stof.webp",
    "Close-up van biologisch afbreekbaar vlaggendoek",
  ),
  shipping: img(
    "761-duurzame-vlaggen-verzenden.webp",
    "Duurzame vlaggen worden ingepakt voor verzending",
  ),
  finishing: img(
    "931-band-en-kunststof-ringen.webp",
    "Afwerking met band en kunststof ringen",
  ),
} as const;

export interface CatalogProduct {
  slug: string;
  name: string;
  category: ProductCategory;
  /** One-liner for cards. */
  tagline: string;
  /** Longer intro paragraph for the product page. */
  description: string;
  /** Indicative "from" price in EUR ex VAT. */
  priceFrom: number;
  /** Badge to highlight on the card, if any. */
  badge?: string;
  sizes: CatalogSize[];
  options: CatalogOption[];
  /** Main product photo, used on cards and as product-page hero. */
  heroImage: ProductImage;
  /** Extra photos for the product-page gallery (sfeer, maten, details). */
  gallery: ProductImage[];
  /** Visual accent — fallback gradient behind/instead of the photo. */
  accent: "forest" | "terracotta" | "sage-blue" | "sage-purple" | "copper-rust";
  /**
   * Probo linkage — null until confirmed. When set, the product becomes
   * orderable through lib/orders/orchestration (configure → price → checkout).
   */
  proboProductCode: string | null;
  /**
   * Fixed Probo option selections applied on top of the size/quantity the
   * customer picks. Null until the product code is confirmed.
   */
  proboOptionTemplate: Array<{ code: string; value?: string | number }> | null;
}

export const PRODUCTS: CatalogProduct[] = [
  {
    slug: "baniervlag",
    name: "Baniervlag",
    category: "vlag",
    tagline: "Verticale banier die opvalt — biologisch afbreekbaar.",
    description:
      "De baniervlag is onze meest gekozen vlag: een verticale banier die je merk laat wapperen bij de ingang, op beurzen of langs de weg. Geprint op Flag-CiCLO®-doek dat in 2–3 jaar biologisch afbreekt, zonder microplastics.",
    // priceFrom = echte goedkoopste config (Probo-inkoop kleinste maat × 1,5,
    // naar beneden afgerond op €0,50): Tunnelzoom/hem 250×100 = €25,46 × 1,5
    // = €38,19 → €38,00. Live geverifieerd 2026-07-13.
    priceFrom: 38,
    badge: "Populair",
    sizes: [
      { label: "250 × 100 cm", widthCm: 250, heightCm: 100 },
      { label: "300 × 100 cm", widthCm: 300, heightCm: 100 },
      { label: "400 × 100 cm", widthCm: 400, heightCm: 100 },
    ],
    options: [
      { label: "Afwerking", choices: ["Tunnelzoom", "Zoom met ringen"] },
      { label: "Bevestiging", choices: ["Karabijnhaken", "Spankoord"] },
    ],
    heroImage: img(
      "762-duurzame-baniervlag.webp",
      "Duurzame baniervlag aan een baniermast",
    ),
    gallery: [
      img(
        "772-baniervlaggen-duurzame-vlaggen.webp",
        "Meerdere duurzame baniervlaggen naast elkaar",
      ),
      img(
        "1018-baniervlaggen-maten-overzichten.webp",
        "Overzicht van beschikbare baniervlag-maten",
      ),
    ],
    accent: "forest",
    // ORDERABLE (2026-07-13). Probo code `flag-ciclo`; option tree verified live.
    // The base below (finishing-all-sides) is always sent; the size + finishing
    // chain is built per-selection in lib/catalog/probo-mapping.ts. The template
    // being non-null is what flips isOrderable() → online checkout.
    proboProductCode: "flag-ciclo",
    proboOptionTemplate: [{ code: "finishing-all-sides" }],
  },
  {
    slug: "mastvlag",
    name: "Mastvlag",
    category: "vlag",
    tagline: "Klassieke mastvlag voor aan de vlaggenmast.",
    description:
      "De mastvlag hijs je aan een vlaggenmast en is er in staand en liggend formaat. Duurzaam geprint op biologisch afbreekbaar doek, met een stevige band en koord voor jarenlang gebruik — en een schoon einde.",
    // priceFrom = echte goedkoopste config (inkoop × 1,5, floor €0,50):
    // band+koord Wit 100×150 = €16,02 × 1,5 = €24,03 → €24,00 (2026-07-13).
    priceFrom: 24,
    sizes: [
      { label: "100 × 150 cm", widthCm: 100, heightCm: 150 },
      { label: "150 × 225 cm", widthCm: 150, heightCm: 225 },
      { label: "225 × 350 cm", widthCm: 225, heightCm: 350 },
    ],
    options: [
      { label: "Band- en koordkleur", choices: ["Wit", "Zwart"] },
      { label: "Ontwerpservice", choices: ["Eigen ontwerp", "Laat ontwerpen"] },
    ],
    heroImage: img(
      "758-duurzame-mastvlag.webp",
      "Duurzame mastvlag aan een vlaggenmast",
    ),
    gallery: [
      img(
        "1303-mastvlag-in-de-lucht.webp",
        "Mastvlag wapperend hoog in de lucht",
      ),
      img("1027-mastvlaggen-maten.webp", "Overzicht van mastvlag-maten"),
    ],
    accent: "sage-blue",
    // ORDERABLE (2026-07-13). Same Flag-CiCLO® fabric as the baniervlag. Mast flags
    // finish with band-and-cord (colour + 200 cm cord), built per-selection in
    // lib/catalog/probo-mapping.ts. Non-null template flips isOrderable() → true.
    proboProductCode: "flag-ciclo",
    proboOptionTemplate: [{ code: "finishing-all-sides" }],
  },
  {
    slug: "beachvlag",
    name: "Beachvlag",
    category: "vlag",
    tagline: "Draagbare beachflag — binnen én buiten.",
    description:
      "De beachvlag (beachflag) is licht, draagbaar en pakt overal uit: evenementen, winkels, sportvelden. Verkrijgbaar als straight- en squareflag, geleverd inclusief stok en draagtas, met een duurzame doekprint die netjes afbreekt in plaats van als microplastic achter te blijven.",
    // priceFrom = echte goedkoopste config (inkoop × 1,5, floor €0,50):
    // Straightflag S 40×235 = €30,03 × 1,5 = €45,05 → €45,00 (2026-07-13).
    priceFrom: 45,
    // The model (Straight/Square) is encoded in the size: each size belongs to
    // exactly one Probo product (`beachflag-straight` / `beachflag-square`).
    // Sizes are Probo's own presets for the Flag-CiCLO® material, verified live.
    sizes: [
      { label: "Straight S — 40 × 235 cm", widthCm: 40, heightCm: 235 },
      { label: "Straight M — 65 × 315 cm", widthCm: 65, heightCm: 315 },
      { label: "Straight L — 90 × 430 cm", widthCm: 90, heightCm: 430 },
      { label: "Square S — 75 × 200 cm", widthCm: 75, heightCm: 200 },
      { label: "Square M — 75 × 300 cm", widthCm: 75, heightCm: 300 },
      { label: "Square L — 75 × 400 cm", widthCm: 75, heightCm: 400 },
    ],
    options: [
      { label: "Mastzijde", choices: ["Links", "Rechts"] },
      { label: "Voet", choices: ["Grondpin", "Kruisvoet", "Watertank"] },
    ],
    heroImage: img(
      "1400-duurzame-square-beachvlaggen.webp",
      "Duurzame square beachvlaggen buiten opgesteld",
    ),
    gallery: [
      img(
        "1403-squareflag-duurzame-vlaggen.webp",
        "Squareflag met duurzame doekprint",
      ),
      img(
        "1401-duurzame-squareflag-eerste-foto.webp",
        "Duurzame squareflag in gebruik",
      ),
    ],
    accent: "terracotta",
    // ORDERABLE (2026-07-13, owner-confirmed). Default code `beachflag-straight`;
    // square sizes override to `beachflag-square` in lib/catalog/probo-mapping.ts.
    // Chain: amount → flag-ciclo → size preset → flag-pole-side → composition
    // (vlag + stok + draagtas). Voet = cross-sell, stays on the order line only.
    // (Previous `pole-flag` code was wrong — that is Probo's "Mastvlag".)
    proboProductCode: "beachflag-straight",
    proboOptionTemplate: [{ code: "flag-ciclo" }],
  },
  {
    slug: "gevelvlag",
    name: "Gevelvlag",
    category: "vlag",
    tagline: "Gevelvlag die je merk aan de straatkant toont.",
    description:
      "De gevelvlag hangt aan een uithouder aan je gevel en trekt de aandacht van voorbijgangers. Afgewerkt met band, koord en lus, geprint op biologisch afbreekbaar doek — zichtbaar duurzaam, precies wat een CSRD-bewuste organisatie uitstraalt.",
    // priceFrom = echte goedkoopste config (inkoop × 1,5, floor €0,50):
    // 100×70 = €7,93 × 1,5 = €11,90 → €11,50 (2026-07-13).
    priceFrom: 11.5,
    // Sizes are Probo's own facade-flag presets for Flag-CiCLO®, verified live.
    sizes: [
      { label: "100 × 70 cm", widthCm: 100, heightCm: 70 },
      { label: "150 × 100 cm", widthCm: 150, heightCm: 100 },
      { label: "225 × 150 cm", widthCm: 225, heightCm: 150 },
    ],
    options: [
      // Probo's only facade-flag finishing is "band, koord en lus" (fixed in the
      // mapping); the customer choices are the pole side + our bracket cross-sell.
      { label: "Mastzijde", choices: ["Links", "Rechts"] },
      { label: "Uithouder", choices: ["Zonder", "Met uithouder"] },
    ],
    heroImage: img(
      "763-duurzame-gevelvlag.webp",
      "Duurzame gevelvlag aan een uithouder",
    ),
    gallery: [
      img(
        "771-gevelvlaggen-duurzame-vlaggen.webp",
        "Gevelvlaggen aan een bedrijfspand",
      ),
    ],
    accent: "sage-purple",
    // ORDERABLE (2026-07-13, owner-confirmed). Chain: amount → flag-ciclo → size
    // preset → flag-pole-side → landscape-strap-cord-loop (fixed finishing), see
    // lib/catalog/probo-mapping.ts. Uithouder = cross-sell, order line only.
    proboProductCode: "facade-flag",
    proboOptionTemplate: [{ code: "flag-ciclo" }],
  },
  {
    slug: "vlaggenmast",
    name: "Vlaggenmast",
    category: "hardware",
    tagline: "Aluminium Easylift-vlaggenmast in 4 kleuren.",
    description:
      "Een stevige aluminium vlaggenmast (Easylift) als duurzame basis voor je mastvlag. Hoogwaardig aluminium dat jaren meegaat, inclusief montagebeugels, met 10+ jaar garantie. Online tot 8 meter, hogere masten op aanvraag.",
    priceFrom: 637,
    badge: "Hardware",
    sizes: [{ label: "6 meter" }, { label: "8 meter" }],
    options: [
      { label: "Kleur", choices: ["Wit", "Aluminium", "Zwart", "Antraciet"] },
    ],
    heroImage: img(
      "1705-vlaggenmasten.webp",
      "Aluminium Easylift-vlaggenmasten in verschillende kleuren",
    ),
    gallery: [],
    accent: "copper-rust",
    // NOT a Probo product — own hardware, priced from duurzame-vlaggen.nl/bestel-vlaggenmast/
    // (Easylift 6m WIT = €637 excl. btw). Stays quote/own-price, never routes to Probo.
    proboProductCode: null,
    proboOptionTemplate: null,
  },
];

export function getAllProducts(): CatalogProduct[] {
  return PRODUCTS;
}

export function getProduct(slug: string): CatalogProduct | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function isOrderable(p: CatalogProduct): boolean {
  return p.proboProductCode !== null && p.proboOptionTemplate !== null;
}
