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
  /** Highlight this size as the most-chosen option in the configurator. */
  popular?: boolean;
  /** Koopadvies bij de maat, bv. "mast 6/7 m" (oude site) — toont in de pill. */
  mastAdvies?: string;
  /** Indicatieve masthoogte (cm) voor de schaal-preview. */
  mastCm?: number;
  /**
   * Maat bestaat wél in ons assortiment maar heeft (nog) geen live-geverifieerde
   * Probo-preset → niet online bestelbaar, alleen op aanvraag/offerte. De prijs
   * blijft indicatief; de configurator blokkeert "In winkelmand" en toont contact.
   */
  quoteOnly?: boolean;
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
    // priceFrom = goedkoopste maat uit het lokale retailmodel (100×200), area-
    // geschaald op de anker-maat 100×250 = €38 (≈ €15,20/m²).
    // TODO: prijs verifiëren met Antony (alleen 100×250 is live geverifieerd).
    priceFrom: 30.5,
    badge: "Populair",
    sizes: [
      // Baniervlag = verticale banier (staand): label breedte × hoogte.
      { label: "100 × 200 cm", widthCm: 100, heightCm: 200 },
      { label: "100 × 250 cm", widthCm: 100, heightCm: 250 },
      { label: "100 × 300 cm", widthCm: 100, heightCm: 300, popular: true },
      { label: "100 × 350 cm", widthCm: 100, heightCm: 350 },
      { label: "100 × 400 cm", widthCm: 100, heightCm: 400 },
      // Brede banieren (125 cm) voor de grotere masten.
      { label: "125 × 300 cm", widthCm: 125, heightCm: 300 },
      { label: "125 × 350 cm", widthCm: 125, heightCm: 350 },
      { label: "125 × 400 cm", widthCm: 125, heightCm: 400 },
    ],
    options: [
      { label: "Mastzijde", choices: ["Links", "Rechts"] },
      { label: "Afwerking", choices: ["Tunnel", "Geen"] },
      // Kleur van band en garen (zie de render-beelden), niet van het doek.
      { label: "Bandkleur", choices: ["Wit", "Zwart"] },
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
    // priceFrom = kleinste maat uit het lokale retailmodel (100×150).
    // TODO: prijs verifiëren — mastvlag-prijzen zijn area-geschaald op het enige
    // bekende punt 150×225 ≈ €44,50 (live site); zie lib/pricing/local-catalog.
    priceFrom: 19.5,
    sizes: [
      // Mastvlag = hijsvlag (liggend). Labels zijn breedte × hoogte; het
      // mastadvies per maat komt 1-op-1 van de oude site.
      { label: "150 × 100 cm", widthCm: 150, heightCm: 100, mastAdvies: "mast 2/3 m", mastCm: 300 },
      { label: "180 × 120 cm", widthCm: 180, heightCm: 120, mastAdvies: "vlaggenstok 4/5 m", mastCm: 450 },
      { label: "225 × 150 cm", widthCm: 225, heightCm: 150, mastAdvies: "mast 6/7 m", mastCm: 650, popular: true },
      { label: "300 × 200 cm", widthCm: 300, heightCm: 200, mastAdvies: "mast 8/9 m", mastCm: 850 },
      { label: "350 × 225 cm", widthCm: 350, heightCm: 225, mastAdvies: "mast 10 m", mastCm: 1000 },
    ],
    options: [
      { label: "Mastzijde", choices: ["Links", "Rechts"] },
      // Bevestiging aan de mast: met haken/clips of met koord en lus.
      { label: "Afwerking", choices: ["Haken (Clips)", "Koord/Lus"] },
      // Kleur van band, koord en garen (zie render-beelden), niet van het doek.
      { label: "Kleur", choices: ["Wit", "Zwart"] },
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
    // priceFrom = goedkoopste maat uit het lokale retailmodel (Straight S = €35;
    // dichtstbijzijnde ref-maat 80×220). Zie lib/pricing/local-catalog.
    priceFrom: 35,
    // The model (Straight/Square) is encoded in the size: each size belongs to
    // exactly one Probo product (`beachflag-straight` / `beachflag-square`).
    // Sizes are Probo's own presets for the Flag-CiCLO® material, verified live.
    sizes: [
      // Straight = de echte oude-site-maten. 65×315 en 90×430 zijn live-geverifieerde
      // Probo-presets (online bestelbaar); 80×220 en 80×315 bestaan wél maar hebben
      // geen geverifieerde preset → quoteOnly (op aanvraag) tot Probo bevestigt.
      { label: "Straight Small — 80 × 220 cm", widthCm: 80, heightCm: 220, quoteOnly: true },
      { label: "Straight Medium S — 65 × 315 cm", widthCm: 65, heightCm: 315, popular: true },
      { label: "Straight Medium L — 80 × 315 cm", widthCm: 80, heightCm: 315, quoteOnly: true },
      { label: "Straight Large — 90 × 430 cm", widthCm: 90, heightCm: 430 },
      // Square = Probo's geverifieerde square-presets (alle online bestelbaar).
      { label: "Square Small — 75 × 200 cm", widthCm: 75, heightCm: 200 },
      { label: "Square Medium — 75 × 300 cm", widthCm: 75, heightCm: 300 },
      { label: "Square Large — 75 × 400 cm", widthCm: 75, heightCm: 400 },
    ],
    options: [
      { label: "Mastzijde", choices: ["Links", "Rechts"] },
      // Wat zit erbij: alleen het doek, met stok, of compleet met stok + draagtas.
      // "Vlag + stok + tas" is de geverifieerde standaard-samenstelling (flag-stick-
      // bag-deluxe). Zie probo-mapping voor de open Probo-/prijs-verificatie.
      {
        label: "Samenstelling",
        choices: ["Vlag + stok + tas", "Vlag + stok", "Alleen vlag"],
      },
      // Volledige accessoire-assortiment van de oude site (namen + prijzen ECHT).
      // Optionele keuze: in de configurator kun je hem ook weer uitzetten.
      {
        label: "Accessoires",
        choices: [
          "Grondpen",
          "Grondplug",
          "Kruisvoet",
          "Metalen Standaard",
          "Voetplaat 5 kg",
          "Voetplaat 15 kg",
          "Parasolvoet Zwart",
          "Parasolvoet Wit",
          "Waterzak Grijs",
          "Waterzak Zwart",
          "Rotator Parasol",
          "Rotator Voetplaat",
        ],
      },
    ],
    // Eigen merkfoto's van beide modellen op het strand (van de oude site).
    heroImage: {
      src: "/beachvlag/straightflag-strand.webp",
      alt: "Duurzame straightflag beachvlag op het strand",
    },
    gallery: [
      {
        src: "/beachvlag/squareflag-strand.webp",
        alt: "Duurzame squareflag beachvlag op het strand",
      },
      img(
        "1400-duurzame-square-beachvlaggen.webp",
        "Duurzame square beachvlaggen buiten opgesteld",
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
    // priceFrom = echte retailprijs kleinste maat (100×70 = €17,50, ref).
    priceFrom: 17.5,
    // Sizes are Probo's own facade-flag presets for Flag-CiCLO®, verified live.
    sizes: [
      { label: "100 × 70 cm", widthCm: 100, heightCm: 70 },
      { label: "150 × 100 cm", widthCm: 150, heightCm: 100 },
      { label: "225 × 150 cm", widthCm: 225, heightCm: 150 },
    ],
    options: [
      // Probo's only facade-flag finishing is "band, koord en lus" (fixed in the
      // mapping); de klant kiest de mastzijde, ziet de vaste afwerking + de
      // band-/koordkleur, en kan optioneel onze uithouder als cross-sell bijkopen.
      { label: "Mastzijde", choices: ["Links", "Rechts"] },
      // Vaste afwerking (band, koord en lus) — één keuze, puur ter illustratie.
      { label: "Afwerking", choices: ["Koord/Lus"] },
      // Kleur van band, koord en lus (zie render-beelden), niet van het doek.
      { label: "Kleur", choices: ["Wit", "Zwart"] },
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
    // TODO: prijs verifiëren met Antony — catalogus stond op €637, live-config-ref
    // geeft €520 (6 m). Ref-prijzen aangehouden; zie lib/pricing/local-catalog.
    priceFrom: 520,
    badge: "Hardware",
    sizes: [{ label: "6 meter" }, { label: "7 meter" }, { label: "8 meter" }],
    options: [
      { label: "Kleur", choices: ["Wit", "Aluminium", "Zwart", "Antraciet"] },
    ],
    heroImage: img(
      "1705-vlaggenmasten.webp",
      "Aluminium Easylift-vlaggenmasten in verschillende kleuren",
    ),
    // Eigen praktijkfoto's (lokaal in public/vlaggenmast), geen WordPress-migratie.
    gallery: [
      {
        src: "/vlaggenmast/masten-in-gebruik.jpg",
        alt: "Aluminium Easylift-vlaggenmasten in gebruik bij een bedrijfspand",
      },
      {
        src: "/vlaggenmast/grondankers.jpg",
        alt: "Grondankers voor de fundering van een vlaggenmast",
      },
      {
        src: "/vlaggenmast/grondplaat-montage.jpg",
        alt: "Montage van de grondplaat van een vlaggenmast",
      },
    ],
    accent: "copper-rust",
    // NOT a Probo product — own hardware (Easylift). Prices from the live-config
    // ref: 6m €520 / 7m €552,50 / 8m €578,50, coating Zwart/Antraciet +€71,50.
    // TODO: prijs verifiëren met Antony (catalogus stond eerder op €637/€799).
    // Stays quote/own-price, never routes to Probo.
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
