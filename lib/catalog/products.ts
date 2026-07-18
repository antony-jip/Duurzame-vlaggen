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
  // Klantcase in het echt — ook de fotoband boven de footer (ProcesStappen).
  banieren: img(
    "baniervlaggen-westcord-hotels.webp",
    "Baniervlaggen van WestCord Hotels en ss Rotterdam tegen een blauwe lucht",
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
  /**
   * Breed maten-overzicht (render met alle formaten naast elkaar) — getoond
   * als fotoband boven de footer op de eigen productpagina.
   */
  sizesImage?: ProductImage;
  /**
   * Verdiepende productinformatie (werking, materiaal, garantie) — getoond
   * als eigen sectie onder de configurator op de productpagina.
   */
  details?: Array<{ title: string; body: string }>;
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
    tagline: "Valt op. Valt daarna volledig uiteen. Zonder één stukje plastic.",
    description:
      "Onze bestseller. De verticale banier die je merk laat knallen bij de ingang, op beurzen en langs de weg. Gedrukt op Flag-CiCLO® doek dat na afdanking in 2 tot 3 jaar biologisch afbreekt. Geen microplastics. Geen compromis.",
    // priceFrom = goedkoopste maat (100×250 = €32,50) uit de configurator.
    priceFrom: 32.5,
    badge: "Populair",
    sizes: [
      // Baniervlag = verticale banier (label breedte × hoogte). Custom-size, dus
      // elke maat kan. Prijzen: 100/120-breed uit de configurator; de grote maten
      // (120×400, 150×450, 150×500) door Antony bevestigd; 150×550/600 area-
      // geschaald op €13/m². Mastadvies in de comment.
      { label: "100 × 250 cm", widthCm: 100, heightCm: 250 }, // 5 m mast
      { label: "100 × 300 cm", widthCm: 100, heightCm: 300, popular: true }, // 6 m mast
      { label: "100 × 350 cm", widthCm: 100, heightCm: 350 }, // 7 m mast
      { label: "100 × 400 cm", widthCm: 100, heightCm: 400 }, // 8 m mast
      { label: "120 × 300 cm", widthCm: 120, heightCm: 300 }, // 6 m mast
      { label: "120 × 350 cm", widthCm: 120, heightCm: 350 }, // 7 m mast
      { label: "120 × 400 cm", widthCm: 120, heightCm: 400 }, // 8 m mast
      { label: "150 × 450 cm", widthCm: 150, heightCm: 450 }, // 8-9 m mast
      { label: "150 × 500 cm", widthCm: 150, heightCm: 500 }, // 9 m mast
      { label: "150 × 550 cm", widthCm: 150, heightCm: 550 }, // 10 m mast
      { label: "150 × 600 cm", widthCm: 150, heightCm: 600 }, // 11 m mast
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
      // 772-baniervlaggen is dezelfde opname als de hero (762) — eruit gehaald
      // zodat de galerij geen dubbele foto toont.
      BRAND_IMAGES.banieren,
      // Eigen praktijkfoto's van geleverd klantwerk (lokaal in
      // public/baniervlag, bijgesneden en verkleind uit de originelen).
      {
        src: "/baniervlag/banieren-straatbeeld.webp",
        alt: "Twee baniervlaggen in eigen huisstijl in een dorpsstraat",
      },
      {
        src: "/baniervlag/banieren-velddag.webp",
        alt: "Drie doorgedrukte baniervlaggen met bladmotief op een velddag",
      },
      {
        src: "/baniervlag/banieren-oranje-rij.webp",
        alt: "Drie oranje baniervlaggen op rij langs de weg",
      },
      img(
        "1018-baniervlaggen-maten-overzichten.webp",
        "Overzicht van beschikbare baniervlag-maten",
      ),
    ],
    sizesImage: img(
      "baniervlaggen-maten-masthoogtes-hd.jpg",
      "Alle baniervlag-maten naast elkaar, van 100 × 300 cm (masthoogte 6 m) tot 150 × 500 cm (masthoogte 9 m)",
    ),
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
    tagline: "De klassieker aan je mast. Nu zonder plastic nalatenschap.",
    description:
      "Hijs 'm aan je mast, staand of liggend. Gedrukt op biologisch afbreekbaar doek, afgewerkt met een stevige band en koord die jaren meegaan. En als het einde komt, blijft er niets achter. Geen microplastic, geen rommel in de natuur.",
    // priceFrom = kleinste maat uit het lokale retailmodel (150×100).
    // Herprijsd op € 15,20/m² (2026-07-15); zie lib/pricing/local-catalog.
    priceFrom: 23,
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
    sizesImage: img(
      "mastvlaggen-maten-masthoogtes-hd.jpg",
      "Alle mastvlag-maten naast elkaar, van 100 × 150 cm (mast 2/3 m) tot 225 × 350 cm (mast 10 m)",
    ),
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
    tagline: "Overal opgezet. Nergens plastic achtergelaten.",
    description:
      "Licht, draagbaar, overal inzetbaar. Op evenementen, in de winkel, langs het sportveld. Kies straightflag of squareflag, geleverd met stok en draagtas. De doekprint breekt netjes af in plaats van als microplastic in de natuur te belanden.",
    // priceFrom = goedkoopste maat (Straight S, 80×220 = €35) met samenstelling
    // "Alleen vlag" (€0). De configurator opent op "Vlag + stok" (+€15), dus de
    // openingsprijs ligt hoger dan deze vanafprijs.
    priceFrom: 35,
    // The model (Straight/Square) is encoded in the size: each size belongs to
    // exactly one Probo product (`beachflag-straight` / `beachflag-square`).
    // Sizes are Probo's own presets for the Flag-CiCLO® material, verified live.
    sizes: [
      // Straight = de echte oude-site-maten. Alle maten zijn online bestelbaar:
      // bestellen bij Probo gaat toch handmatig, dus een onbevestigde preset is
      // geen reden meer voor "op aanvraag" (de oude quoteOnly-vlaggen zijn weg).
      { label: "Straight Small — 80 × 220 cm", widthCm: 80, heightCm: 220 },
      { label: "Straight Medium S — 65 × 315 cm", widthCm: 65, heightCm: 315, popular: true },
      { label: "Straight Medium L — 80 × 315 cm", widthCm: 80, heightCm: 315 },
      { label: "Straight Large — 90 × 430 cm", widthCm: 90, heightCm: 430 },
      // Square = Probo's geverifieerde square-presets (alle online bestelbaar).
      { label: "Square Small — 75 × 200 cm", widthCm: 75, heightCm: 200 },
      { label: "Square Medium — 75 × 300 cm", widthCm: 75, heightCm: 300 },
      { label: "Square Large — 75 × 400 cm", widthCm: 75, heightCm: 400 },
    ],
    options: [
      { label: "Mastzijde", choices: ["Links", "Rechts"] },
      // Afwerking van de tunnelzoom (oude-site-stap 4): meegeprint doek of een
      // elastische band in wit/zwart. Geen Probo-optiecode bekend → reist als
      // "zelf regelen" mee op de orderregel voor de handmatige bestelling.
      // TODO: prijs verifiëren — oude site noemt de band "voordeliger", maar
      // zonder bedragen; tot die tijd geen meerprijs.
      {
        label: "Gewenste afwerking",
        choices: [
          "Gepersonaliseerde tunnel",
          "Witte elastische band",
          "Zwarte elastische band",
        ],
      },
      // Wat zit erbij: alleen het doek, met stok, of compleet met stok + draagtas.
      // "Vlag + stok + tas" is de geverifieerde standaard-samenstelling (flag-stick-
      // bag-deluxe). Zie probo-mapping voor de open Probo-/prijs-verificatie.
      // Default = "Vlag + stok" (eerste keuze): een nieuwe koper heeft nog geen
      // frame en mag geen los doek als voorselectie krijgen. "Alleen vlag" (€0)
      // blijft kiesbaar voor wie al een stok heeft; stok +€15, stok + tas +€22,50
      // (zie OPTION_SURCHARGES).
      {
        label: "Samenstelling",
        choices: ["Vlag + stok", "Vlag + stok + tas", "Alleen vlag"],
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
      // Vier straightflags naast elkaar: laat in één beeld zien wat de maten in
      // het echt schelen. Staat vooraan in de galerij, want "hoe groot is dat
      // dan?" is de eerste vraag bij een preset-maat.
      {
        src: "/beachvlag/straightflag-maten.webp",
        alt: "De vier straightflag-maten naast elkaar op het strand, van Small tot Large",
      },
      {
        src: "/beachvlag/squareflag-strand.webp",
        alt: "Duurzame squareflag beachvlag op het strand",
      },
      img(
        "1400-duurzame-square-beachvlaggen.webp",
        "Duurzame square beachvlaggen buiten opgesteld",
      ),
      // Eigen praktijkfoto van geleverd klantwerk (lokaal in public/beachvlag).
      {
        src: "/beachvlag/beachvlag-straatbeeld.webp",
        alt: "Paarse beachvlag met eigen ontwerp langs de straat",
      },
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
    tagline: "Je merk aan de straat. Zonder een spoor na te laten.",
    description:
      "Hangt aan een uithouder aan je gevel en pakt elke voorbijganger. Afgewerkt met band, koord en lus, gedrukt op biologisch afbreekbaar doek. Zichtbaar duurzaam. Precies wat een organisatie die CSRD serieus neemt wil uitstralen.",
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
      // band-/koordkleur, en koopt gevelstokken en houders als accessoire bij.
      { label: "Mastzijde", choices: ["Links", "Rechts"] },
      // Vaste afwerking (band, koord en lus) — één keuze, puur ter illustratie.
      { label: "Afwerking", choices: ["Koord/Lus"] },
      // Kleur van band, koord en lus (zie render-beelden), niet van het doek.
      { label: "Kleur", choices: ["Wit", "Zwart"] },
      // Losse artikelen met eigen aantal (zie OPTION_SURCHARGES voor prijzen).
      {
        label: "Accessoires",
        choices: [
          "Gevelstok Wit",
          "Gevelstok Blauw",
          "Gevelstok Oranje",
          "Gevelstok Zwart",
          "Gevelstokhouder",
          "Gevelstokhouder Zwart",
          "Handystick",
        ],
      },
    ],
    heroImage: img(
      "763-duurzame-gevelvlag.webp",
      "Duurzame gevelvlag aan een uithouder",
    ),
    // 771-gevelvlaggen is dezelfde opname als de hero (763) — eruit gehaald
    // zodat de galerij geen dubbele foto toont.
    gallery: [],
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
    tagline: "De aluminium Easylift. Vier kleuren. Jaren stevig.",
    description:
      "De stevige aluminium basis onder je mastvlag. Hoogwaardig aluminium dat jaren meegaat, inclusief montagebeugels en meer dan 10 jaar garantie. Online tot 8 meter, hogere masten op aanvraag.",
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
    // Verdieping over het Easylift-systeem, onder eigen noemer geschreven
    // (leverancier blijft ongenoemd op de site).
    details: [
      {
        title: "Banier wisselen zonder kantelen",
        body: "De banierhouder beweegt omhoog en omlaag met een lier met slinger. Je wisselt een banier veilig op werkhoogte, zonder de mast te kantelen en zonder speciale vaardigheden. Simpel, snel en veilig.",
      },
      {
        title: "Degelijk gebouwd",
        body: "Dikwandige cilindervormige mast van hoogwaardig aluminium, met slijtvaste geleidingsringen van POM-kunststof, een hijslijn met stalen kern en een soepel lopende bandlier met zwengel. De afwerking is extra dik gepoedercoat of geanodiseerd, in vier kleuren.",
      },
      {
        title: "Compleet geleverd",
        body: "Inclusief thermisch verzinkt kantelanker, contragewicht met rubberring, aluminium uithouder, flexibele banierringen en een mastknop naar keuze.",
      },
      {
        title: "Eenvoudig te plaatsen",
        body: "Dankzij het kantelanker plaats je de mast eenvoudig zelf. Het grondanker is nastelbaar, zodat de mast altijd strak in het lood staat.",
      },
      {
        title: "Garantie waar je op kunt bouwen",
        body: "Drie jaar garantie op alle bewegende delen en tien jaar op het mastprofiel.",
      },
      {
        title: "Kies de juiste hoogte",
        body: "Vuistregel: kies de mast minstens één meter hoger dan je gebouw. Zo vangt de vlag vrije wind en komt hij het beste tot zijn recht.",
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
