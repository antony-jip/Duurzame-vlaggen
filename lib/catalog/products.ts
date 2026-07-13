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
  /** Visual accent for the gradient placeholder (no real photography yet). */
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
    priceFrom: 32.5,
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
    accent: "forest",
    proboProductCode: null,
    proboOptionTemplate: null,
  },
  {
    slug: "mastvlag",
    name: "Mastvlag",
    category: "vlag",
    tagline: "Klassieke mastvlag voor aan de vlaggenmast.",
    description:
      "De mastvlag hijs je aan een vlaggenmast en is er in staand en liggend formaat. Duurzaam geprint op biologisch afbreekbaar doek, met een stevige band en koord voor jarenlang gebruik — en een schoon einde.",
    priceFrom: 19.5,
    sizes: [
      { label: "100 × 150 cm", widthCm: 100, heightCm: 150 },
      { label: "150 × 225 cm", widthCm: 150, heightCm: 225 },
      { label: "225 × 350 cm", widthCm: 225, heightCm: 350 },
    ],
    options: [
      { label: "Band- en koordkleur", choices: ["Wit", "Zwart"] },
      { label: "Ontwerpservice", choices: ["Eigen ontwerp", "Laat ontwerpen"] },
    ],
    accent: "sage-blue",
    proboProductCode: null,
    proboOptionTemplate: null,
  },
  {
    slug: "beachvlag",
    name: "Beachvlag",
    category: "vlag",
    tagline: "Draagbare beachflag — binnen én buiten.",
    description:
      "De beachvlag (beachflag) is licht, draagbaar en pakt overal uit: evenementen, winkels, sportvelden. Verkrijgbaar als straight- en squareflag, met een duurzame doekprint die netjes afbreekt in plaats van als microplastic achter te blijven.",
    priceFrom: 35,
    sizes: [
      { label: "Straight — S", widthCm: 60, heightCm: 200 },
      { label: "Straight — M", widthCm: 70, heightCm: 260 },
      { label: "Square — M", widthCm: 70, heightCm: 230 },
    ],
    options: [
      { label: "Model", choices: ["Straightflag", "Squareflag"] },
      { label: "Voet", choices: ["Grondpin", "Kruisvoet", "Watertank"] },
    ],
    accent: "terracotta",
    proboProductCode: null,
    proboOptionTemplate: null,
  },
  {
    slug: "gevelvlag",
    name: "Gevelvlag",
    category: "vlag",
    tagline: "Gevelvlag die je merk aan de straatkant toont.",
    description:
      "De gevelvlag hangt aan een uithouder aan je gevel en trekt de aandacht van voorbijgangers. Geprint op biologisch afbreekbaar doek — zichtbaar duurzaam, precies wat een CSRD-bewuste organisatie uitstraalt.",
    priceFrom: 17.5,
    sizes: [
      { label: "100 × 70 cm", widthCm: 100, heightCm: 70 },
      { label: "150 × 100 cm", widthCm: 150, heightCm: 100 },
      { label: "225 × 150 cm", widthCm: 225, heightCm: 150 },
    ],
    options: [
      { label: "Afwerking", choices: ["Tunnelzoom boven", "Zoom met ringen"] },
      { label: "Uithouder", choices: ["Zonder", "Met uithouder"] },
    ],
    accent: "sage-purple",
    proboProductCode: null,
    proboOptionTemplate: null,
  },
  {
    slug: "vlaggenmast",
    name: "Vlaggenmast",
    category: "hardware",
    tagline: "Aluminium vlaggenmast — de duurzame basis.",
    description:
      "Een stevige aluminium vlaggenmast als duurzame basis voor je mastvlag. Onderhoudsarm, recyclebaar en gemaakt om jaren mee te gaan. Verkrijgbaar in meerdere hoogtes.",
    priceFrom: 520,
    badge: "Hardware",
    sizes: [
      { label: "6 meter" },
      { label: "8 meter" },
      { label: "10 meter" },
    ],
    options: [{ label: "Uitvoering", choices: ["Met vlaggenstok", "Met uithaalmechanisme"] }],
    accent: "copper-rust",
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
