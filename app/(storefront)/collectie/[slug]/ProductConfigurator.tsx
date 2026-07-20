"use client";

/**
 * Product-configurator — rustige, stapsgewijze flow met een INSTANT prijs.
 *
 * Herontwerp (2026-07): weg met de lompe grote foto-optiekaarten en het
 * dominante 5-kaarts staffelblok. In de plaats:
 *  - genummerde stappen (formaat → afwerking → aantal) met lichte hiërarchie,
 *  - een scanbare formaatlijst met mini-vormvoorbeeld + "Meest gekozen",
 *  - compacte segmented controls met kleine SVG-glyphs voor de opties,
 *  - een rustige aantal-stepper met bulkkorting als subtiele, uitklapbare strip.
 *
 * De prijs komt onveranderd uit het EIGEN lokale prijsmodel
 * (`@/lib/pricing/local-catalog`): geen debounce, geen netwerk-call.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./product.module.css";
import {
  Badge,
  Button,
  Check,
  ArrowRight,
  Leaf,
  Truck,
  ShieldCheck,
} from "@/components/ui";
import { useCart, VAT_RATE } from "@/components/cart/CartProvider";
import { formatCurrency } from "@/lib/i18n/formatting";
import type { UiCatalog } from "@/config/domains";
import type { CatalogProduct, CatalogSize } from "@/lib/catalog/products";
import {
  STAFFEL_TIERS,
  staffelDiscount,
  designServiceCost,
  DESIGN_SERVICE_PRICE,
  localOptionsSurcharge,
  localAccessoiresTotal,
  localUnitPriceWithOptions,
  localCartLineTotal,
  localCustomSizePrice,
} from "@/lib/pricing/local-catalog";
import { supportsCustomSize } from "@/lib/catalog/probo-mapping";
import { sjabloonUrl } from "@/lib/catalog/sjablonen";
import {
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";

/** Percentage in Nederlandse notatie (94.2 → "94,2"). */

/** Redelijke grenzen (cm) voor een eigen maat. */
const CUSTOM_MIN_CM = 20;
const CUSTOM_MAX_CM = 600;

/**
 * Multi-opties: hier mag je meerdere keuzes tegelijk aanvinken (of geen).
 * Ze reizen als één " · "-lijst mee in prijs en orderregel (zie
 * `localOptionsSurcharge`).
 */
const MULTI_OPTIONS = new Set(["Accessoires"]);

/**
 * Aantal masten in de "Zet je rij neer"-strook. Twaalf: genoeg om de
 * −5%- en −10%-mijlpalen ín de rij te laten vallen, en meer voelt als een
 * hek in plaats van een rij. Grotere aantallen tonen als "+N" naast de rij.
 */
const RIJ_MAX = 12;

/**
 * Korte uitleg per keuzegroep — wat betekent deze keuze voor de klant?
 * Generiek per optielabel, met product-specifieke overrides waar de optie
 * iets anders betekent (bv. mastvlag-afwerking = bevestiging).
 */
const OPTION_HINTS: Record<string, string> = {
  Mastzijde:
    "Aan welke kant van het doek de mast zit. Sta met je rug in de wind: mast links? Kies links.",
  Afwerking:
    "Met tunnel schuift het doek als een koker om de mast. Dit is de standaard voor baniermasten.",
  Bandkleur:
    "Kleur van de band en het garen, niet van het doek. Kies wat past bij je ontwerp.",
  Kleur:
    "Kleur van band, koord en garen, niet van het doek. Kies wat past bij je ontwerp.",
  "Band- en koordkleur":
    "Kleur van band, koord en garen, niet van het doek. Kies wat past bij je ontwerp.",
};
const PRODUCT_OPTION_HINTS: Record<string, Record<string, string>> = {
  mastvlag: {
    Afwerking:
      "Hoe de vlag aan de mast komt: haken klikken op de mastlijn, koord/lus knoop je vast.",
  },
  gevelvlag: {
    Mastzijde:
      "Aan welke kant van het doek de gevelstok komt. Kies de kant die past bij de plek aan je gevel.",
    Afwerking:
      "Vaste afwerking met band, koord en lus. Daarmee knoop je de vlag stevig aan de gevelstok.",
    Kleur:
      "Kleur van band, koord en lus, niet van het doek. Kies wat past bij je ontwerp.",
  },
};

/**
 * Mini-mast voor de rij-strook, in twee vormen: de staande banier (doek met
 * golvende onderrand langs de mast) en de liggende mastvlag (doek bovenin,
 * wapperend naar rechts). Geplant = gevuld forest doek; ongeplant =
 * gestippelde omtrek die wacht op een klik.
 */
function MastGlyph({
  planted,
  vorm = "banier",
}: {
  planted: boolean;
  vorm?: "banier" | "mastvlag";
}) {
  return (
    <svg
      viewBox="0 0 24 64"
      className={styles.rijMastSvg}
      data-planted={planted || undefined}
      aria-hidden="true"
    >
      {vorm === "mastvlag" ? (
        <>
          <line x1="4.5" y1="3" x2="4.5" y2="61" />
          {/* Liggende rechthoekige vlag (breder dan hoog) met een lichte
              wapper aan de vrije rand. */}
          <path d="M6 5 H20.5 C22.6 6.8 22.6 8.5 20.5 10.3 C18.4 12.1 22.6 13.9 20.5 16 H6 Z" />
        </>
      ) : (
        <>
          <line x1="19.5" y1="3" x2="19.5" y2="61" />
          <path d="M4 5 H17 V42 C14.8 44.6 12.7 44.6 10.5 42 C8.3 39.4 6.2 39.4 4 42 Z" />
        </>
      )}
    </svg>
  );
}

export interface ConfiguratorLabels {
  size: string;
  quantity: string;
  priceLabel: string;
  priceNote: string;
  exclVat: string;
  addToCart: string;
  requestQuote: string;
  added: string;
  viewCart: string;
  noticeQuoteOnly: string;
  /** Small hint shown while a live price is being fetched. */
  priceLoading: string;
}

/** Kleur-swatches voor kleur-keuzes zonder eigen beeld (bv. Aluminium). */
const COLOR_SWATCHES: Record<string, string> = {
  Wit: "#f4f4f2",
  Zwart: "#1c1c1c",
  Aluminium: "linear-gradient(135deg, #dcdfe1 0%, #a9adb0 100%)",
  Antraciet: "#3a3d40",
};

/**
 * Generiek beeld per (optielabel → keuze), gedeeld tussen producten. Waar geen
 * beeld bestaat, valt de kaart terug op een kleur-swatch of tekstkaart.
 * Bestanden staan in `public/configurator/`.
 */
const OPTION_IMAGES: Record<string, Record<string, string>> = {
  Mastzijde: {
    Links: "/configurator/mastzijde/links.webp",
    Rechts: "/configurator/mastzijde/rechts.webp",
  },
  Kleur: {
    Wit: "/configurator/kleur/wit.png",
    Zwart: "/configurator/kleur/zwart.png",
  },
  "Band- en koordkleur": {
    Wit: "/configurator/kleur/wit.png",
    Zwart: "/configurator/kleur/zwart.png",
  },
};

/**
 * Product-specifieke beeld-overrides (winnen van de generieke map): per
 * productslug → optielabel → keuze. Zo krijgt de baniervlag zijn eigen
 * mastzijde-/afwerking-/bandkleur-beelden.
 */
const PRODUCT_OPTION_IMAGES: Record<
  string,
  Record<string, Record<string, string>>
> = {
  mastvlag: {
    Mastzijde: {
      // Eigen mastvlag-renders (doek links/rechts van de mast) van Antony.
      Links: "/configurator/mastzijde/mastvlag-links.webp",
      Rechts: "/configurator/mastzijde/mastvlag-rechts.webp",
    },
    Afwerking: {
      "Haken (Clips)": "/configurator/afwerking/mastvlag-haken.jpeg",
      "Koord/Lus": "/configurator/afwerking/mastvlag-koord-lus.jpeg",
    },
    Kleur: {
      Wit: "/configurator/kleur/mastvlag-wit.jpeg",
      Zwart: "/configurator/kleur/mastvlag-zwart.jpeg",
    },
  },
  gevelvlag: {
    Mastzijde: {
      // TODO: Links-render van Antony opnieuw inladen — de geplakte afbeelding is
      // in de paste-cache overschreven; tijdelijk de generieke mast-links-render.
      Links: "/configurator/mastzijde/links.webp",
      Rechts: "/configurator/mastzijde/gevelvlag-rechts.png",
    },
    Afwerking: {
      "Koord/Lus": "/configurator/afwerking/gevelvlag-koord-lus.png",
    },
    Kleur: {
      Wit: "/configurator/kleur/gevelvlag-wit.png",
      Zwart: "/configurator/kleur/gevelvlag-zwart.png",
    },
    Accessoires: {
      // Gevelstokken en houders (leveranciersbeelden, verkleind naar 800px).
      // Blauw heeft nog geen beeld → tekstkaart-fallback.
      "Gevelstok Wit": "/configurator/gevel/gevelstok-wit.jpg",
      "Gevelstok Oranje": "/configurator/gevel/gevelstok-oranje.jpg",
      "Gevelstok Zwart": "/configurator/gevel/gevelstok-zwart.jpg",
      Gevelstokhouder: "/configurator/gevel/gevelstokhouder.jpg",
      "Gevelstokhouder Zwart": "/configurator/gevel/gevelstokhouder-zwart.jpg",
      Handystick: "/configurator/gevel/handystick.jpg",
    },
  },
  baniervlag: {
    Mastzijde: {
      // Echte staande-banier-renders (mast links/rechts) van Antony.
      Links: "/configurator/mastzijde/banier-links.jpg",
      Rechts: "/configurator/mastzijde/banier-rechts.jpg",
    },
    Afwerking: {
      Tunnel: "/configurator/afwerking/tunnel.webp",
      Geen: "/configurator/afwerking/geen.webp",
    },
    Bandkleur: {
      Wit: "/configurator/kleur/band-wit.webp",
      Zwart: "/configurator/kleur/band-zwart.webp",
    },
  },
  beachvlag: {
    // Originele beelden van de oude site (wp-content, jan 2026).
    Mastzijde: {
      Links: "/configurator/beach/mastzijde-links.webp",
      Rechts: "/configurator/beach/mastzijde-rechts.webp",
    },
    // Afwerking van de tunnelzoom — close-ups van Antony (2026-07-16):
    // meegeprinte tunnel in doekkleur vs. witte/zwarte elastische band.
    "Gewenste afwerking": {
      "Gepersonaliseerde tunnel":
        "/configurator/beach/afwerking-gepersonaliseerde-tunnel.webp",
      "Witte elastische band": "/configurator/beach/afwerking-witte-band.webp",
      "Zwarte elastische band":
        "/configurator/beach/afwerking-zwarte-band.webp",
    },
    Accessoires: {
      Grondpen: "/configurator/beach/voet-grondpen.jpg",
      Grondplug: "/configurator/beach/acc-grondplug.jpg",
      Kruisvoet: "/configurator/beach/voet-kruisvoet.jpg",
      "Metalen Standaard": "/configurator/beach/acc-metalen-standaard.jpg",
      "Voetplaat 5 kg": "/configurator/beach/voet-voetplaat-5kg.jpg",
      "Voetplaat 15 kg": "/configurator/beach/voet-voetplaat-15kg.jpg",
      "Parasolvoet Zwart": "/configurator/beach/acc-parasolvoet-zwart.jpg",
      "Parasolvoet Wit": "/configurator/beach/acc-parasolvoet-wit.jpg",
      "Waterzak Grijs": "/configurator/beach/voet-waterzak.jpg",
      "Waterzak Zwart": "/configurator/beach/acc-waterzak-zwart.jpg",
      "Rotator Parasol": "/configurator/beach/acc-rotator-parasol.jpg",
      "Rotator Voetplaat": "/configurator/beach/acc-rotator-voetplaat.jpg",
      // "Zonder" valt bewust terug op de huisstijl-glyph.
    },
  },
};

/**
 * "Soort"-kaarten: producten waarvan het model in het maatlabel zit
 * ("Straight S — …"/"Square S — …") krijgen een keuzestap vóór het formaat, zodat
 * je eerst de soort kiest en daarna alleen de maten van dát model ziet. Sleutel =
 * modelnaam (eerste woord van het label); beelden staan in `public/configurator/`.
 */
const SOORT_CARDS: Record<
  string,
  Record<string, { title: string; blurb: string; img: string }>
> = {
  beachvlag: {
    Straight: {
      title: "Straightflag",
      blurb: "Gebogen sail — strak, hoog silhouet",
      img: "/configurator/beach/soort-straight.png",
    },
    Square: {
      title: "Squareflag",
      blurb: "Rechthoekig — maximaal printvlak",
      img: "/configurator/beach/soort-square.png",
    },
  },
};

/** Modelnaam van een maat ("Straight S — …" → "Straight"), of null. */
function sizeModel(size: CatalogSize): string | null {
  return splitSizeLabel(size.label).name?.split(" ")[0] ?? null;
}

/**
 * Silhouet-beelden per maat (persoon van 1,80 m naast de vlag), getoond op de
 * formaat-kaart. Sleutel = productslug → exact maatlabel. Bestanden in
 * `public/configurator/beach/formaat/`.
 */
/**
 * Beachvlag-mastzijde-renders per model + zijde. De toggle-slider toont de
 * juiste kant (mast links/rechts) van het gekozen model (straight/square).
 */
const BEACH_MASTZIJDE: Record<string, Record<string, string>> = {
  Straight: {
    Links: "/configurator/beach/mastzijde-straight-links.webp",
    Rechts: "/configurator/beach/mastzijde-straight-rechts.webp",
  },
  Square: {
    Links: "/configurator/beach/mastzijde-square-links.webp",
    Rechts: "/configurator/beach/mastzijde-square-rechts.webp",
  },
};

/** Beachvlag-samenstelling per model + keuze (alleen doek / + stok / + stok + tas). */
const BEACH_SAMENSTELLING: Record<string, Record<string, string>> = {
  Straight: {
    "Vlag + stok + tas":
      "/configurator/beach/samenstelling/straight-stok-tas.webp",
    "Vlag + stok": "/configurator/beach/samenstelling/straight-stok.webp",
    "Alleen vlag": "/configurator/beach/samenstelling/straight-alleen.webp",
  },
  Square: {
    "Vlag + stok + tas":
      "/configurator/beach/samenstelling/square-stok-tas.webp",
    "Vlag + stok": "/configurator/beach/samenstelling/square-stok.webp",
    "Alleen vlag": "/configurator/beach/samenstelling/square-alleen.webp",
  },
};

const SIZE_SILHOUETTES: Record<string, Record<string, string>> = {
  beachvlag: {
    "Straight Small — 80 × 220 cm":
      "/configurator/beach/formaat/straight-small.webp",
    "Straight Medium S — 65 × 315 cm":
      "/configurator/beach/formaat/straight-medium-s.webp",
    "Straight Medium L — 80 × 315 cm":
      "/configurator/beach/formaat/straight-medium-l.webp",
    "Straight Large — 90 × 430 cm":
      "/configurator/beach/formaat/straight-large.webp",
    "Square Small — 75 × 200 cm":
      "/configurator/beach/formaat/square-small.webp",
    "Square Medium — 75 × 300 cm":
      "/configurator/beach/formaat/square-medium.webp",
    "Square Large — 75 × 400 cm":
      "/configurator/beach/formaat/square-large.webp",
  },
};

/**
 * Line-art placeholder (huisstijl, naar de illustraties van de oude site) voor
 * optie-keuzes zonder passende foto. Wint van het GENERIEKE beeld (dat toont
 * een rechte banier en klopt niet voor beach-/gevelvlag), maar verliest van een
 * product-specifieke foto in `PRODUCT_OPTION_IMAGES`.
 */
function optionGlyph(
  slug: string,
  label: string,
  choice: string,
): React.ReactNode {
  const svg = (children: React.ReactNode) => (
    <svg
      viewBox="0 0 80 60"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );

  if (slug === "beachvlag" && label === "Accessoires") {
    if (choice === "Grondpen") {
      return svg(
        <>
          <line x1={40} y1={6} x2={40} y2={38} />
          <path d="M36 38 L40 52 L44 38 Z" fill="currentColor" stroke="none" />
          <line x1={20} y1={44} x2={32} y2={44} strokeDasharray="4 5" />
          <line x1={48} y1={44} x2={60} y2={44} strokeDasharray="4 5" />
        </>,
      );
    }
    if (choice === "Kruisvoet") {
      return svg(
        <>
          <line x1={40} y1={6} x2={40} y2={42} />
          <path d="M22 50 L58 40" />
          <path d="M22 40 L58 50" />
        </>,
      );
    }
    if (choice.startsWith("Voetplaat")) {
      return svg(
        <>
          <line x1={40} y1={6} x2={40} y2={36} />
          <path d="M18 46 L40 38 L62 46 L40 53 Z" strokeWidth={2.2} />
        </>,
      );
    }
    if (choice.startsWith("Waterzak")) {
      return svg(
        <>
          <line x1={40} y1={6} x2={40} y2={31} />
          <circle cx={40} cy={44} r={13} strokeWidth={2.2} />
          <circle cx={40} cy={44} r={4.5} strokeWidth={2.2} />
        </>,
      );
    }
  }

  if (slug === "gevelvlag" && label === "Uithouder") {
    if (choice === "Met uithouder") {
      return svg(
        <>
          <line x1={18} y1={6} x2={18} y2={54} />
          <line x1={18} y1={14} x2={60} y2={14} />
          <line x1={18} y1={32} x2={44} y2={14} strokeWidth={2.2} />
          <rect x={32} y={17} width={24} height={17} rx={2} strokeWidth={2.2} />
        </>,
      );
    }
    return svg(
      <>
        <line x1={22} y1={12} x2={62} y2={12} />
        <circle cx={30} cy={12} r={3} strokeWidth={2.2} />
        <circle cx={54} cy={12} r={3} strokeWidth={2.2} />
        <rect x={26} y={16} width={32} height={22} rx={2} strokeWidth={2.2} />
      </>,
    );
  }

  if (slug === "beachvlag" && label === "Mastzijde") {
    // Gebogen beachflag-silhouet; pijlen wijzen naar de mastzijde.
    const flag = (poleX: number, dir: 1 | -1) => (
      <>
        <line x1={poleX} y1={4} x2={poleX} y2={56} />
        <path
          d={`M${poleX} 8 C${poleX + 16 * dir} 8 ${poleX + 19 * dir} 22 ${poleX + 17 * dir} 46 L${poleX} 46 Z`}
          strokeWidth={2.2}
        />
      </>
    );
    if (choice === "Links") {
      return svg(
        <>
          {flag(44, 1)}
          <path d="M30 22 H16 M21 17 l-5 5 5 5" strokeWidth={2.4} />
          <path d="M30 40 H16 M21 35 l-5 5 5 5" strokeWidth={2.4} />
        </>,
      );
    }
    return svg(
      <>
        {flag(36, -1)}
        <path d="M50 22 H64 M59 17 l5 5 -5 5" strokeWidth={2.4} />
        <path d="M50 40 H64 M59 35 l5 5 -5 5" strokeWidth={2.4} />
      </>,
    );
  }

  if (slug === "gevelvlag" && label === "Mastzijde") {
    // Hangend gevelvlagje; de dikke rand + pijl markeren de stokzijde.
    const rand = choice === "Links" ? 30 : 50;
    const pijl =
      choice === "Links" ? (
        <path d="M22 50 H12 M16 45 l-4 5 4 5" strokeWidth={2.4} />
      ) : (
        <path d="M58 50 H68 M64 45 l4 5 -4 5" strokeWidth={2.4} />
      );
    return svg(
      <>
        <line x1={22} y1={10} x2={58} y2={10} />
        <rect x={30} y={13} width={20} height={28} rx={2} strokeWidth={2.2} />
        <line x1={rand} y1={13} x2={rand} y2={41} strokeWidth={4} />
        {pijl}
      </>,
    );
  }

  return null;
}

export function ProductConfigurator({
  product,
  orderable,
  catalog,
  labels,
}: {
  product: CatalogProduct;
  orderable: boolean;
  catalog: UiCatalog;
  labels: ConfiguratorLabels;
}) {
  const { addItem, inclVat } = useCart();

  // Standaard-formaat = de "Meest gekozen" maat als die bestaat, anders de eerste.
  const defaultSizeIndex = Math.max(
    0,
    product.sizes.findIndex((s) => s.popular),
  );

  const [sizeIndex, setSizeIndex] = useState(defaultSizeIndex);

  // "Soort"-stap: producten met een model in het maatlabel (beachvlag:
  // Straight/Square) kiezen eerst de soort en zien daarna alleen die maten.
  const soortMeta = SOORT_CARDS[product.slug];
  const soortModels = soortMeta
    ? [...new Set(product.sizes.map(sizeModel).filter((m): m is string => !!m))]
    : [];
  const hasSoort = soortModels.length > 1;
  const [selectedModel, setSelectedModel] = useState<string | null>(
    () => sizeModel(product.sizes[defaultSizeIndex]) ?? soortModels[0] ?? null,
  );

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      product.options
        .filter((opt) => !MULTI_OPTIONS.has(opt.label))
        .map((opt) => [opt.label, opt.choices[0]]),
    ),
  );
  // Multi-opties (accessoires): 0, 1 of meer keuzes per label.
  const [multiChoices, setMultiChoices] = useState<Record<string, string[]>>(
    {},
  );
  // Eigen aantal per aangevinkt accessoire, sleutel "label:keuze" (default 1).
  const [multiQty, setMultiQty] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [designService, setDesignService] = useState(false);
  const [added, setAdded] = useState(false);

  // Eigen-maat-modus: vrije breedte × hoogte in cm.
  const [customMode, setCustomMode] = useState(false);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");

  const presetSize = product.sizes[sizeIndex];

  // Eigen maat valideren: positieve getallen binnen redelijke grenzen.
  const wNum = Number(customW);
  const hNum = Number(customH);
  const customValid =
    customW.trim() !== "" &&
    customH.trim() !== "" &&
    Number.isFinite(wNum) &&
    Number.isFinite(hNum) &&
    wNum >= CUSTOM_MIN_CM &&
    wNum <= CUSTOM_MAX_CM &&
    hNum >= CUSTOM_MIN_CM &&
    hNum <= CUSTOM_MAX_CM;
  const usingCustom = customMode && customValid;

  // Effectieve maat = eigen maat (indien geldig) of de gekozen preset.
  const size = usingCustom
    ? {
        label: `Eigen: ${wNum} × ${hNum} cm`,
        widthCm: wNum,
        heightCm: hNum,
      }
    : presetSize;

  // In eigen-maat-modus zonder geldige invoer: geen prijs, geen add-to-cart.
  const priceReady = !customMode || customValid;

  // Op-aanvraag-maat (geen Probo-preset): niet online bestelbaar → offerte-CTA.
  const sizeQuoteOnly = !usingCustom && !!presetSize?.quoteOnly;

  // Eigen maat alleen aanbieden waar dat echt besteld kan worden (custom-size
  // producten of offerte-flow) — preset-producten stranden bij het afrekenen.
  const customAllowed = supportsCustomSize(product.slug);

  // Schaal-preview voor alle vlagproducten met echte afmetingen.
  const showPreview =
    product.category === "vlag" &&
    // Beachvlag toont de schaal al via de silhouet-formaatkaarten → geen los
    // preview-paneel (en dus ook geen preview-animatie).
    product.slug !== "beachvlag" &&
    size.widthCm != null &&
    size.heightCm != null;
  const mastInfo =
    product.slug === "mastvlag"
      ? !usingCustom && presetSize.mastCm
        ? { mastCm: presetSize.mastCm, advies: presetSize.mastAdvies }
        : mastvlagMastInfo(size.widthCm ?? 0)
      : undefined;

  // Alle keuzes samengevoegd: multi-opties als " · "-lijst (prijs-/orderconventie).
  // Accessoires met een eigen aantal > 1 krijgen een "N× "-prefix in de waarde
  // ("2× Kruisvoet · Waterzak Zwart") — leesbaar op de orderregel én parseerbaar
  // door het prijsmodel (localAccessoiresTotal).
  const mergedSelections: Record<string, string> = { ...selectedOptions };
  for (const [label, values] of Object.entries(multiChoices)) {
    if (values.length > 0) {
      mergedSelections[label] = values
        .map((v) => {
          const n = multiQty[`${label}:${v}`] ?? 1;
          return n > 1 ? `${n}× ${v}` : v;
        })
        .join(" · ");
    }
  }

  // Aanleversjabloon voor precies deze configuratie (maat, mastzijde en
  // afwerking) — volgt live mee met de keuzes. Alleen voor preset-maten.
  const sjabloon = usingCustom
    ? null
    : sjabloonUrl({
        slug: product.slug,
        widthCm: size.widthCm,
        heightCm: size.heightCm,
        selections: mergedSelections,
      });

  // Instant, netwerk-loze berekening uit het eigen lokale prijsmodel.
  // Accessoires zitten NIET in de stukprijs: het zijn losse artikelen met een
  // eigen aantal, dus een vast bedrag op de regel buiten aantal en staffel.
  const optionsSurcharge = localOptionsSurcharge(product, mergedSelections);
  const unitBasis = usingCustom
    ? Math.round(
        (localCustomSizePrice(product, wNum, hNum) + optionsSurcharge) * 100,
      ) / 100
    : localUnitPriceWithOptions(product, presetSize, mergedSelections);
  const accessoiresExVat = localAccessoiresTotal(product, mergedSelections);
  const discount = staffelDiscount(quantity);
  const lineExVat = localCartLineTotal(unitBasis, quantity);
  const designExVat = designServiceCost(designService);
  const totalExVat =
    Math.round((lineExVat + accessoiresExVat + designExVat) * 100) / 100;
  const savings = Math.round((unitBasis * quantity - lineExVat) * 100) / 100;

  /** Toon een ex-btw bedrag volgens de globale btw-voorkeur. */
  const show = (amount: number) => (inclVat ? amount * (1 + VAT_RATE) : amount);
  const fmt = (amount: number) => formatCurrency(show(amount), catalog);

  function handleAdd() {
    if (!priceReady || sizeQuoteOnly) return;
    const baseOptions = [
      { code: "Formaat", value: size.label },
      // Niet-gekozen optionele opties (accessoires) blijven van de regel af.
      ...product.options.flatMap((opt) => {
        const value = mergedSelections[opt.label];
        return value ? [{ code: opt.label, value }] : [];
      }),
    ];
    addItem({
      slug: product.slug,
      name: product.name,
      proboProductCode: product.proboProductCode,
      sizeLabel: size.label,
      widthCm: size.widthCm,
      heightCm: size.heightCm,
      // Ex-btw stukprijs incl. gekozen opties = de staffel-basis.
      unitPriceEstimate: unitBasis,
      amount: quantity,
      options: designService
        ? [
            ...baseOptions,
            {
              code: "Ontwerpservice",
              value: `Ja (+${formatCurrency(DESIGN_SERVICE_PRICE, catalog)})`,
            },
          ]
        : baseOptions,
    });
    setAdded(true);
  }

  // Actieve staffel-tier = hoogste tier waarvan het aantal ≥ tier.qty.
  const activeTierQty = STAFFEL_TIERS.reduce(
    (acc, t) => (quantity >= t.qty ? t.qty : acc),
    STAFFEL_TIERS[0].qty,
  );
  const nextTier = STAFFEL_TIERS.find((t) => t.qty > quantity);

  // Soort kiezen → spring naar de eerste maat van dat model.
  function pickModel(model: string) {
    const firstIdx = product.sizes.findIndex((s) => sizeModel(s) === model);
    setSelectedModel(model);
    if (firstIdx >= 0) setSizeIndex(firstIdx);
    setCustomMode(false);
    setAdded(false);
  }

  // "Gewenste afwerking" (beachvlag) is belangrijk genoeg voor een eigen stap
  // direct na de soort; de overige opties blijven samen in "Uitvoering".
  const afwerkingOpt = product.options.find(
    (o) => o.label === "Gewenste afwerking",
  );
  const uitvoeringOpts = product.options.filter((o) => o !== afwerkingOpt);

  // Stapnummering schuift op wanneer er een Soort- en/of afwerking-stap vóór
  // het formaat staat.
  const afwerkingStepNo = (hasSoort ? 1 : 0) + 1;
  const sizeStepNo = (hasSoort ? 1 : 0) + (afwerkingOpt ? 1 : 0) + 1;
  const optionsStepNo = sizeStepNo + 1;
  const quantityStepNo = sizeStepNo + (uitvoeringOpts.length > 0 ? 1 : 0) + 1;

  /**
   * Eén optieblok (rijlabel + kaarten of mastzijde-toggle). Gedeeld door de
   * verzamelstap Uitvoering en de losse Gewenste afwerking-stap (hideLabel:
   * daar staat de naam al in de stapkop).
   */
  function renderOption(
    opt: CatalogProduct["options"][number],
    hideLabel = false,
  ) {
    const isMulti = MULTI_OPTIONS.has(opt.label);
    // Beachvlag-mastzijde = productfoto + Links⇄Rechts toggle-slider
    // (functioneel: stuurt de live preview), i.p.v. twee losse kaarten.
    const isBeachMast =
      product.slug === "beachvlag" && opt.label === "Mastzijde";
    const picked = isMulti
      ? (multiChoices[opt.label] ?? []).join(" · ")
      : selectedOptions[opt.label];

    // Compacte keuzerij — één regel per eigenschap: mini-voorbeeld van de
    // gekozen keuze + segmented control. De grote fotokaarten maakten van elke
    // binaire keuze (Links/Rechts, Tunnel/Geen, Wit/Zwart) een schreeuwend
    // blok; het voorbeeld wisselt nu gewoon mee met je keuze. De beachvlag
    // houdt zijn fotokaarten: daar verschilt het beeld écht per samenstelling.
    const compact =
      !isMulti &&
      !isBeachMast &&
      product.slug !== "beachvlag" &&
      opt.choices.length <= 3;
    if (compact) {
      const imgFor = (choice: string) =>
        PRODUCT_OPTION_IMAGES[product.slug]?.[opt.label]?.[choice] ??
        OPTION_IMAGES[opt.label]?.[choice];
      const hint =
        PRODUCT_OPTION_HINTS[product.slug]?.[opt.label] ??
        OPTION_HINTS[opt.label];
      return (
        <div key={opt.label} className={styles.optRij}>
          {/* Kop (label + uitleg) in een eigen subgrid-rij, zodat de kaarten
              van alle groepen op dezelfde lijn beginnen, hoeveel regels de
              uitleg ook telt. */}
          <span className={styles.optRijKop}>
            <span className={styles.optRijLabel}>{opt.label}</span>
            {hint && <span className={styles.optRijHint}>{hint}</span>}
          </span>
          <div
            className={styles.optChips}
            role="radiogroup"
            aria-label={opt.label}
          >
            {opt.choices.map((choice) => {
              const selected = selectedOptions[opt.label] === choice;
              const img = imgFor(choice);
              const swatch = img ? undefined : COLOR_SWATCHES[choice];
              const glyph =
                !img && !swatch
                  ? optionGlyph(product.slug, opt.label, choice)
                  : null;
              const surcharge = localOptionsSurcharge(product, {
                [opt.label]: choice,
              });
              return (
                <button
                  key={choice}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-on={selected || undefined}
                  className={styles.optChip}
                  onClick={() => {
                    setSelectedOptions((prev) => ({
                      ...prev,
                      [opt.label]: choice,
                    }));
                    setAdded(false);
                  }}
                >
                  <span className={styles.optChipMedia}>
                    {img ? (
                      <Image
                        src={img}
                        alt=""
                        fill
                        sizes="150px"
                        className={styles.optionCardImg}
                      />
                    ) : swatch ? (
                      <span
                        className={styles.optRijSwatch}
                        style={{ background: swatch }}
                      />
                    ) : (
                      <span className={styles.optRijGlyph}>{glyph}</span>
                    )}
                    <span className={styles.optChipCheck} aria-hidden="true">
                      <Check size={12} />
                    </span>
                  </span>
                  <span className={styles.optChipName}>
                    {choice}
                    {surcharge > 0 && (
                      <span className={styles.segSur}> +{fmt(surcharge)}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div key={opt.label} className={styles.optionRow}>
        {!hideLabel && (
          <span className={styles.optionRowLabel}>
            {opt.label}
            <span className={styles.optionRowPick}>{picked || "Geen"}</span>
          </span>
        )}
        {isBeachMast ? (
          <div className={styles.mastToggle}>
            <span className={styles.mastToggleMedia}>
              <Image
                src={
                  BEACH_MASTZIJDE[selectedModel ?? "Straight"]?.[
                    selectedOptions[opt.label] ?? "Links"
                  ] ||
                  (selectedModel && soortMeta?.[selectedModel]?.img) ||
                  product.heroImage.src
                }
                alt={`Beachvlag ${selectedModel ?? ""} — mast ${selectedOptions[opt.label]?.toLowerCase() ?? "links"}`}
                fill
                sizes="(max-width: 860px) 60vw, 240px"
                className={styles.optionCardImg}
              />
            </span>
            <div
              className={styles.segControl}
              role="radiogroup"
              aria-label={opt.label}
            >
              {opt.choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  role="radio"
                  aria-checked={selectedOptions[opt.label] === choice}
                  className={styles.segOption}
                  data-on={selectedOptions[opt.label] === choice}
                  onClick={() => {
                    setSelectedOptions((prev) => ({
                      ...prev,
                      [opt.label]: choice,
                    }));
                    setAdded(false);
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            className={styles.optionGrid}
            data-dense={opt.choices.length > 4}
            data-cols={
              opt.label === "Samenstelling" ||
              opt.label === "Gewenste afwerking"
                ? "3"
                : undefined
            }
            role={isMulti ? "group" : "radiogroup"}
            aria-label={opt.label}
          >
            {opt.choices.map((choice) => {
              const selected = isMulti
                ? (multiChoices[opt.label] ?? []).includes(choice)
                : selectedOptions[opt.label] === choice;
              // Beeld-volgorde: model-specifieke beach-samenstelling →
              // productfoto → huisstijl-glyph → generiek beeld.
              const productImg =
                (product.slug === "beachvlag" &&
                opt.label === "Samenstelling" &&
                selectedModel
                  ? BEACH_SAMENSTELLING[selectedModel]?.[choice]
                  : undefined) ??
                PRODUCT_OPTION_IMAGES[product.slug]?.[opt.label]?.[choice];
              const glyph = productImg
                ? null
                : optionGlyph(product.slug, opt.label, choice);
              const imgSrc =
                productImg ??
                (glyph ? undefined : OPTION_IMAGES[opt.label]?.[choice]);
              const swatch = COLOR_SWATCHES[choice];
              // Meerprijs van deze ene keuze: als stukprijs-toeslag óf
              // als los artikel (accessoire) — één van beide is > 0.
              const surcharge =
                localOptionsSurcharge(product, { [opt.label]: choice }) +
                localAccessoiresTotal(product, { [opt.label]: choice });
              const qtyKey = `${opt.label}:${choice}`;
              return (
                <label
                  key={choice}
                  className={styles.optionCard}
                  data-selected={selected}
                >
                  <input
                    type={isMulti ? "checkbox" : "radio"}
                    name={opt.label}
                    checked={selected}
                    onChange={() => {
                      if (isMulti) {
                        // Aanvinken/uitvinken; meerdere tegelijk mag.
                        setMultiChoices((prev) => {
                          const current = prev[opt.label] ?? [];
                          const next = selected
                            ? current.filter((c) => c !== choice)
                            : [...current, choice];
                          return { ...prev, [opt.label]: next };
                        });
                        // Uitvinken = aantal terug naar af.
                        if (selected) {
                          setMultiQty((prev) => {
                            const next = { ...prev };
                            delete next[qtyKey];
                            return next;
                          });
                        }
                      } else {
                        setSelectedOptions((prev) => ({
                          ...prev,
                          [opt.label]: choice,
                        }));
                      }
                      setAdded(false);
                    }}
                  />
                  <span
                    className={styles.optionCardMedia}
                    data-square={
                      product.slug === "beachvlag" ? "true" : undefined
                    }
                  >
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={`${opt.label}: ${choice}`}
                        fill
                        sizes="(max-width: 860px) 45vw, 180px"
                        className={styles.optionCardImg}
                      />
                    ) : glyph ? (
                      <span className={styles.optionCardGlyph}>{glyph}</span>
                    ) : swatch ? (
                      <span
                        className={styles.optionCardSwatch}
                        style={{ background: swatch }}
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className={styles.optionCardFallback}
                        aria-hidden="true"
                      >
                        {choice}
                      </span>
                    )}
                    <span className={styles.optionCardCheck} aria-hidden="true">
                      <Check size={14} />
                    </span>
                  </span>
                  <span className={styles.optionCardFoot}>
                    <span className={styles.optionCardName}>{choice}</span>
                    {surcharge > 0 && (
                      <span className={styles.optionCardSurcharge}>
                        +{fmt(surcharge)}
                      </span>
                    )}
                  </span>
                  {/* Eigen aantal per aangevinkt accessoire: losse
                              artikelen, dus niet gekoppeld aan het
                              vlaggenaantal. preventDefault houdt de kaart
                              aangevinkt terwijl je klikt. */}
                  {isMulti && selected && (
                    <span
                      className={styles.accQty}
                      role="group"
                      aria-label={`Aantal ${choice}`}
                      onClick={(e) => e.preventDefault()}
                    >
                      <button
                        type="button"
                        className={styles.accQtyBtn}
                        disabled={(multiQty[qtyKey] ?? 1) <= 1}
                        aria-label={`Minder ${choice}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMultiQty((prev) => ({
                            ...prev,
                            [qtyKey]: Math.max(1, (prev[qtyKey] ?? 1) - 1),
                          }));
                          setAdded(false);
                        }}
                      >
                        −
                      </button>
                      <span className={styles.accQtyValue}>
                        {multiQty[qtyKey] ?? 1}
                      </span>
                      <button
                        type="button"
                        className={styles.accQtyBtn}
                        aria-label={`Meer ${choice}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMultiQty((prev) => ({
                            ...prev,
                            [qtyKey]: (prev[qtyKey] ?? 1) + 1,
                          }));
                          setAdded(false);
                        }}
                      >
                        +
                      </button>
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.configurator} data-accent={product.accent}>
      {!orderable && (
        <p className={styles.notice}>
          <span className={styles.noticeIcon} aria-hidden="true">
            <Leaf size={18} />
          </span>
          {labels.noticeQuoteOnly}
        </p>
      )}

      <div className={styles.steps}>
        {/* Soort-stap — kies eerst het model (Straight/Square), dan pas de maat. */}
        {hasSoort && (
          <section className={styles.step}>
            <header className={styles.stepHead}>
              <span className={styles.stepDot}>1</span>
              <span className={styles.stepTitle}>Soort</span>
              <span className={styles.stepPick}>
                {soortMeta?.[selectedModel ?? ""]?.title ?? selectedModel}
              </span>
            </header>
            <div
              className={styles.optionGrid}
              role="radiogroup"
              aria-label="Soort beachvlag"
            >
              {soortModels.map((model) => {
                const meta = soortMeta?.[model];
                const selected = selectedModel === model;
                return (
                  <label
                    key={model}
                    className={styles.optionCard}
                    data-selected={selected}
                  >
                    <input
                      type="radio"
                      name="soort"
                      checked={selected}
                      onChange={() => pickModel(model)}
                    />
                    <span className={styles.optionCardMedia} data-square="true">
                      {meta?.img ? (
                        <Image
                          src={meta.img}
                          alt={`Soort: ${meta.title}`}
                          fill
                          sizes="(max-width: 860px) 45vw, 220px"
                          className={styles.optionCardImg}
                        />
                      ) : (
                        <span
                          className={styles.optionCardFallback}
                          aria-hidden="true"
                        >
                          {model}
                        </span>
                      )}
                      <span
                        className={styles.optionCardCheck}
                        aria-hidden="true"
                      >
                        <Check size={14} />
                      </span>
                    </span>
                    <span className={styles.optionCardFoot} data-stack="true">
                      <span className={styles.optionCardName}>
                        {meta?.title ?? model}
                      </span>
                      {meta?.blurb && (
                        <span className={styles.optionCardSub}>
                          {meta.blurb}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* Gewenste afwerking — eigen stap direct na de soort. */}
        {afwerkingOpt && (
          <section className={styles.step}>
            <header className={styles.stepHead}>
              <span className={styles.stepDot}>{afwerkingStepNo}</span>
              <span className={styles.stepTitle}>Gewenste afwerking</span>
              <span className={styles.stepPick}>
                {selectedOptions[afwerkingOpt.label]}
              </span>
            </header>
            <div className={styles.optionList}>
              {renderOption(afwerkingOpt, true)}
            </div>
          </section>
        )}

        {/* Stap — Formaat, met een live schaal-preview (vlag + mast/gevel/stok
            + mens van 1,80 m) ernaast. */}
        <div className={showPreview ? styles.withPreview : undefined}>
          {showPreview && (
            <FlagPreview
              slug={product.slug}
              widthCm={size.widthCm!}
              heightCm={size.heightCm!}
              mastzijde={selectedOptions["Mastzijde"] ?? "Links"}
              bandkleur={
                selectedOptions["Bandkleur"] ??
                selectedOptions["Band- en koordkleur"] ??
                selectedOptions["Kleur"] ??
                null
              }
              sizeLabel={usingCustom ? `${wNum} × ${hNum} cm` : size.label}
              mastInfo={mastInfo}
            />
          )}
          <section className={styles.step}>
            <header className={styles.stepHead}>
              <span className={styles.stepDot}>{sizeStepNo}</span>
              <span className={styles.stepTitle}>{labels.size}</span>
              <span className={styles.stepPick}>
                {usingCustom
                  ? size.label
                  : customMode
                    ? "Eigen afmeting"
                    : presetSize.label}
              </span>
            </header>

            <div
              className={styles.sizeList}
              role="radiogroup"
              aria-label={labels.size}
            >
              {groupSizes(product.sizes)
                .filter((group) => !hasSoort || group.key === selectedModel)
                .map((group) => (
                  <div key={group.key} className={styles.sizeGroup}>
                    {group.title && !hasSoort && (
                      <span className={styles.sizeGroupLabel}>
                        {group.title}
                      </span>
                    )}
                    <div className={styles.sizeGrid}>
                      {group.items.map(({ size: s, index: i }) => {
                        const unit = localUnitPriceWithOptions(
                          product,
                          s,
                          mergedSelections,
                        );
                        const selected = !customMode && sizeIndex === i;
                        const { name, dims } = splitSizeLabel(s.label);
                        // Binnen een gekozen soort is de modelnaam overbodig: "Straight
                        // Medium S" → "Medium S".
                        const shortName =
                          hasSoort && name
                            ? name.split(" ").slice(1).join(" ")
                            : name;
                        const sil = SIZE_SILHOUETTES[product.slug]?.[s.label];
                        const pickSize = () => {
                          setSizeIndex(i);
                          setCustomMode(false);
                          setAdded(false);
                        };
                        if (sil) {
                          // Formaat-kaart met silhouet (persoon van 1,80 m naast de vlag).
                          return (
                            <label
                              key={s.label}
                              className={styles.sizeCard}
                              data-selected={selected}
                              data-quote={s.quoteOnly || undefined}
                            >
                              <input
                                type="radio"
                                name="size"
                                checked={selected}
                                onChange={pickSize}
                              />
                              <span className={styles.sizeCardMedia}>
                                <Image
                                  src={sil}
                                  alt={`Formaat ${shortName ?? dims}`}
                                  fill
                                  sizes="(max-width: 860px) 45vw, 200px"
                                  className={styles.sizeCardImg}
                                />
                                <span
                                  className={styles.optionCardCheck}
                                  aria-hidden="true"
                                >
                                  <Check size={14} />
                                </span>
                              </span>
                              <span className={styles.sizeCardName}>
                                {shortName ?? dims}
                              </span>
                              <span className={styles.sizeCardDims}>
                                {dims}
                              </span>
                              <span
                                className={styles.sizeCardPrice}
                                data-quote={s.quoteOnly || undefined}
                              >
                                {s.quoteOnly ? "Op aanvraag" : fmt(unit)}
                              </span>
                            </label>
                          );
                        }
                        return (
                          <label
                            key={s.label}
                            className={styles.sizeRow}
                            data-selected={selected}
                          >
                            <input
                              type="radio"
                              name="size"
                              checked={selected}
                              onChange={pickSize}
                            />
                            <span className={styles.sizeLabelText}>
                              {name ?? dims}
                            </span>
                            {(name || s.mastAdvies) && (
                              <span className={styles.sizeSub}>
                                {name ? dims : s.mastAdvies}
                              </span>
                            )}
                            <span className={styles.sizePrice}>
                              {fmt(unit)}
                            </span>
                            {s.popular && (
                              <span className={styles.sizePopular}>
                                Meest gekozen
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>

            {/* Eigen afmeting — vrije breedte × hoogte (alleen custom-size producten) */}
            {customAllowed && (
              <>
                <button
                  type="button"
                  className={styles.customToggle}
                  data-on={customMode}
                  aria-expanded={customMode}
                  onClick={() => {
                    setCustomMode((v) => !v);
                    setAdded(false);
                  }}
                >
                  <span className={styles.customToggleIcon} aria-hidden="true">
                    {customMode ? "−" : "+"}
                  </span>
                  <span>Eigen afmeting invoeren</span>
                </button>

                {customMode && (
                  <div className={styles.customPanel}>
                    <p className={styles.customHint}>
                      Vul je gewenste breedte en hoogte in centimeters in. We
                      rekenen de prijs per m² en bevestigen de definitieve
                      maatvoering bij je order.
                    </p>
                    <div className={styles.customFields}>
                      <label className={styles.customField}>
                        <span className={styles.customFieldLabel}>
                          Breedte (cm)
                        </span>
                        <input
                          type="number"
                          inputMode="numeric"
                          className={styles.customInput}
                          min={CUSTOM_MIN_CM}
                          max={CUSTOM_MAX_CM}
                          value={customW}
                          placeholder="bv. 100"
                          onChange={(e) => {
                            setCustomW(e.target.value);
                            setAdded(false);
                          }}
                        />
                      </label>
                      <span className={styles.customTimes} aria-hidden="true">
                        ×
                      </span>
                      <label className={styles.customField}>
                        <span className={styles.customFieldLabel}>
                          Hoogte (cm)
                        </span>
                        <input
                          type="number"
                          inputMode="numeric"
                          className={styles.customInput}
                          min={CUSTOM_MIN_CM}
                          max={CUSTOM_MAX_CM}
                          value={customH}
                          placeholder="bv. 250"
                          onChange={(e) => {
                            setCustomH(e.target.value);
                            setAdded(false);
                          }}
                        />
                      </label>
                    </div>
                    {!customValid &&
                      (customW.trim() !== "" || customH.trim() !== "") && (
                        <p className={styles.customError} role="alert">
                          Vul een breedte en hoogte tussen {CUSTOM_MIN_CM} en{" "}
                          {CUSTOM_MAX_CM} cm in.
                        </p>
                      )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {/* Stap 2 — Uitvoering (mastzijde, afwerking, kleur, voet, …) */}
        {uitvoeringOpts.length > 0 && (
          <section className={styles.step}>
            <header className={styles.stepHead}>
              <span className={styles.stepDot}>{optionsStepNo}</span>
              <span className={styles.stepTitle}>Uitvoering</span>
            </header>

            <div className={styles.optionList}>
              {uitvoeringOpts.map((opt) => renderOption(opt))}
            </div>
          </section>
        )}

        {/* Stap 3 — Aantal: "Zet je rij neer". Eén baniervlag is zelden het
            plan; ze staan in rijen bij entrees, op beursterreinen en langs de
            weg. Het aantal kies je hier letterlijk door masten te planten:
            elke vlag erbij laat de stukprijs zichtbaar zakken en de mijlpalen
            onder de grondlijn markeren de staffelkorting. */}
        <section className={styles.step}>
          <header className={styles.stepHead}>
            <span className={styles.stepDot}>{quantityStepNo}</span>
            <span className={styles.stepTitle}>Zet je rij neer</span>
            <span className={styles.stepPick}>
              {quantity} {quantity === 1 ? "vlag" : "vlaggen"}
              {discount > 0 && ` · −${Math.round(discount * 100)}%`}
            </span>
          </header>

          <div className={styles.rij}>
            <div
              className={styles.rijStrook}
              role="group"
              aria-label="Kies het aantal vlaggen door op een mast te klikken"
            >
              {Array.from({ length: RIJ_MAX }, (_, i) => {
                const n = i + 1;
                const planted = n <= quantity;
                const milestone = STAFFEL_TIERS.find(
                  (t) => t.qty === n && t.discount > 0,
                );
                return (
                  <span key={n} className={styles.rijSlot}>
                    <button
                      type="button"
                      className={styles.rijMast}
                      aria-label={`${n} ${n === 1 ? "vlag" : "vlaggen"}`}
                      aria-pressed={quantity === n}
                      onClick={() => {
                        setQuantity(n);
                        setAdded(false);
                      }}
                    >
                      <MastGlyph
                        planted={planted}
                        vorm={
                          product.slug === "mastvlag" ? "mastvlag" : "banier"
                        }
                      />
                    </button>
                    {milestone && (
                      <span
                        className={styles.rijMijlpaal}
                        data-on={quantity >= n || undefined}
                        aria-hidden="true"
                      >
                        −{Math.round(milestone.discount * 100)}%
                      </span>
                    )}
                  </span>
                );
              })}
              {quantity > RIJ_MAX && (
                <span className={styles.rijMeer} aria-hidden="true">
                  +{quantity - RIJ_MAX}
                </span>
              )}
            </div>

            <div className={styles.rijVoet}>
              <span className={styles.rijPrijs}>
                {fmt(Math.round(unitBasis * (1 - discount) * 100) / 100)}
                <span className={styles.rijPrijsSub}> per vlag</span>
                {savings > 0 && (
                  <span className={styles.savings}>
                    Je bespaart {fmt(savings)}
                  </span>
                )}
              </span>
              {nextTier && (
                <button
                  type="button"
                  className={styles.staffelNudge}
                  onClick={() => {
                    setQuantity(nextTier.qty);
                    setAdded(false);
                  }}
                >
                  Nog {nextTier.qty - quantity} erbij voor −
                  {Math.round(nextTier.discount * 100)}%
                </button>
              )}
            </div>

            <div className={styles.rijKeuzes}>
              {STAFFEL_TIERS.map((tier) => (
                <button
                  key={tier.qty}
                  type="button"
                  className={styles.rijChip}
                  data-on={activeTierQty === tier.qty || undefined}
                  aria-pressed={activeTierQty === tier.qty}
                  onClick={() => {
                    setQuantity(tier.qty);
                    setAdded(false);
                  }}
                >
                  {tier.qty}
                  {tier.discount > 0 && (
                    <span className={styles.rijChipKorting}>
                      −{Math.round(tier.discount * 100)}%
                    </span>
                  )}
                </button>
              ))}

              <div className={styles.quantity}>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => {
                    setQuantity((q) => Math.max(1, q - 1));
                    setAdded(false);
                  }}
                  disabled={quantity <= 1}
                  aria-label="Aantal verlagen"
                >
                  −
                </button>
                <input
                  type="number"
                  className={styles.qtyInput}
                  min={1}
                  value={quantity}
                  aria-label={labels.quantity}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setQuantity(
                      Number.isFinite(next) && next >= 1 ? Math.floor(next) : 1,
                    );
                    setAdded(false);
                  }}
                />
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => {
                    setQuantity((q) => q + 1);
                    setAdded(false);
                  }}
                  aria-label="Aantal verhogen"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Ontwerpservice — lichte add-on */}
        <button
          type="button"
          className={styles.addon}
          role="switch"
          aria-checked={designService}
          data-on={designService}
          onClick={() => {
            setDesignService((v) => !v);
            setAdded(false);
          }}
        >
          <span className={styles.addonText}>
            <span className={styles.addonTitle}>
              Laat je vlag door ons ontwerpen
            </span>
            <span className={styles.addonSub}>
              Vast bedrag · {fmt(DESIGN_SERVICE_PRICE)} · eenmalig per order
            </span>
          </span>
          <span className={styles.addonSwitch} aria-hidden="true">
            <span className={styles.addonKnob} />
          </span>
        </button>

        {/* Zelf opmaken? Het sjabloon hoort bij de gekozen maat + afwerking. */}
        {sjabloon && (
          <a
            className={styles.sjabloonDl}
            href={sjabloon}
            target="_blank"
            rel="noopener noreferrer"
          >
            ⬇ Download het aanleversjabloon voor deze maat en afwerking (PDF)
          </a>
        )}
      </div>

      {/* Geruststelling vlak boven de CTA — de sterkste conversie-drivers. */}
      <ul className={styles.reassure}>
        <li>
          <Leaf size={15} aria-hidden="true" /> Biologisch afbreekbaar doek:{" "}
          {pctNl(HOOFDTEST.afbraakPct)}% afgebroken in zeewater in{" "}
          {HOOFDTEST.duur} ({HOOFDTEST.norm}).{" "}
          <Link href={ONDERBOUWING_PAD}>{ONDERBOUWING_LINK_TEKST}</Link>
        </li>
        <li>
          <Truck size={15} aria-hidden="true" /> Levering in ± 5 werkdagen
        </li>
        <li>
          <ShieldCheck size={15} aria-hidden="true" /> Veilig betalen via iDEAL
        </li>
      </ul>

      {/* Sticky buy bar — live price + CTA's */}
      <div className={styles.buyBar}>
        <div className={styles.priceBlock}>
          <span className={styles.priceLabel}>{labels.priceLabel}</span>
          <span className={styles.priceValue}>
            {sizeQuoteOnly ? "Op aanvraag" : priceReady ? fmt(totalExVat) : "—"}
          </span>
          <span className={styles.priceNote}>
            {sizeQuoteOnly
              ? "Deze maat bestel je op aanvraag (niet online)"
              : priceReady
                ? `${quantity} ${quantity === 1 ? "stuk" : "stuks"} · ${
                    inclVat ? "incl. btw" : "excl. btw"
                  }${designService ? " · incl. ontwerpservice" : ""}${
                    usingCustom ? " · eigen maat" : ""
                  }`
                : "Vul eerst een geldige eigen afmeting in"}
          </span>
        </div>

        {/* Aantal direct in de koopbalk aanpasbaar — je hoeft niet terug naar
            de aantal-stap om te zien of te sturen wat je afrekent. */}
        {!sizeQuoteOnly && (
          <div
            className={styles.buyQty}
            role="group"
            aria-label="Aantal aanpassen"
          >
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={() => {
                setQuantity((q) => Math.max(1, q - 1));
                setAdded(false);
              }}
              disabled={quantity <= 1}
              aria-label="Aantal verlagen"
            >
              −
            </button>
            <span className={styles.buyQtyValue} aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={() => {
                setQuantity((q) => q + 1);
                setAdded(false);
              }}
              aria-label="Aantal verhogen"
            >
              +
            </button>
          </div>
        )}

        <div className={styles.actions}>
          {sizeQuoteOnly ? (
            <Button
              as="a"
              href={`/contact?product=${product.slug}&maat=${encodeURIComponent(presetSize.label)}`}
              size="lg"
              icon={<ArrowRight />}
            >
              {labels.requestQuote}
            </Button>
          ) : orderable ? (
            <Button
              variant="cart"
              size="lg"
              onClick={handleAdd}
              icon={<ArrowRight />}
              disabled={!priceReady}
            >
              {labels.addToCart}
            </Button>
          ) : (
            <>
              <Button
                as="a"
                href={`/contact?product=${product.slug}`}
                size="lg"
                icon={<ArrowRight />}
              >
                {labels.requestQuote}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleAdd}
                disabled={!priceReady}
              >
                {labels.addToCart}
              </Button>
            </>
          )}
        </div>
      </div>

      {added && (
        <p className={styles.added} role="status">
          <Badge variant="success" icon={<Check size={14} />}>
            {labels.added}
          </Badge>
          <Link href="/winkelwagen">{labels.viewCart}</Link>
        </p>
      )}
    </div>
  );
}

/**
 * Groepeer maten voor een rustige formaatlijst:
 *  - modelnamen in het label ("Straight S — …") → groep per model (Straight/Square),
 *  - meerdere doekbreedtes (banier 100/125 cm) → groep per breedte,
 *  - anders één vlakke lijst zonder kopjes.
 * De index verwijst naar de positie in `product.sizes` (voor de selectie-state).
 */
function groupSizes(sizes: CatalogSize[]): Array<{
  key: string;
  title: string | null;
  items: Array<{ size: CatalogSize; index: number }>;
}> {
  const entries = sizes.map((size, index) => ({ size, index }));

  if (sizes.every((s) => s.label.includes("—"))) {
    const byModel = new Map<string, typeof entries>();
    for (const e of entries) {
      const model =
        splitSizeLabel(e.size.label).name?.split(" ")[0] ?? "Overig";
      byModel.set(model, [...(byModel.get(model) ?? []), e]);
    }
    return [...byModel].map(([key, items]) => ({
      key,
      title: `${key}flag`,
      items,
    }));
  }

  const widths = new Set(sizes.map((s) => s.widthCm));
  if (
    widths.size > 1 &&
    widths.size < sizes.length &&
    sizes.every((s) => s.widthCm != null)
  ) {
    const byWidth = new Map<number, typeof entries>();
    for (const e of entries) {
      const w = e.size.widthCm!;
      byWidth.set(w, [...(byWidth.get(w) ?? []), e]);
    }
    return [...byWidth].map(([w, items]) => ({
      key: String(w),
      title: `${w} cm breed`,
      items,
    }));
  }

  return [{ key: "alle", title: null, items: entries }];
}

/**
 * Splits een samengesteld maatlabel ("Straight S — 40 × 235 cm") in modelnaam +
 * afmeting, zodat de formaatlijst hem op twee rustige regels kan tonen. Labels
 * zonder modelnaam ("100 × 200 cm") blijven één regel.
 */
function splitSizeLabel(label: string): { name: string | null; dims: string } {
  const parts = label.split("—").map((p) => p.trim());
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { name: parts[0], dims: parts[1] };
  }
  return { name: null, dims: label };
}

/**
 * Mastvlag-vuistregel (uit de maten van de oude site): welke mast/stok hoort
 * bij een vlagbreedte. Voor eigen maten en als fallback zonder catalogus-advies.
 */
function mastvlagMastInfo(widthCm: number): { mastCm: number; advies: string } {
  if (widthCm <= 150) return { mastCm: 300, advies: "mast 2/3 m" };
  if (widthCm <= 180) return { mastCm: 450, advies: "vlaggenstok 4/5 m" };
  if (widthCm <= 225) return { mastCm: 650, advies: "mast 6/7 m" };
  if (widthCm <= 300) return { mastCm: 850, advies: "mast 8/9 m" };
  return { mastCm: 1000, advies: "mast 10 m" };
}

/**
 * Live schaal-preview per vlagproduct: doek + mast/stok/gevel + mens van
 * ± 1,80 m, proportioneel op de echte centimeters. Groeit mee met het gekozen
 * (of eigen) formaat, spiegelt de mastzijde en kleurt de band mee. Puur
 * decoratief (aria-hidden): alle informatie staat ook in de stappen zelf.
 */
function FlagPreview({
  slug,
  widthCm,
  heightCm,
  mastzijde,
  bandkleur,
  sizeLabel,
  mastInfo,
}: {
  slug: string;
  widthCm: number;
  heightCm: number;
  mastzijde: string;
  /** Band-/garenkleur (Wit/Zwart) of null wanneer het product geen band kent. */
  bandkleur: string | null;
  sizeLabel: string;
  /** Mastvlag: masthoogte + advies-tekst (uit catalogus of vuistregel). */
  mastInfo?: { mastCm: number; advies?: string };
}) {
  const AVAILABLE_PX = 232; // tekenhoogte boven de grondstrook
  const mastLinks = mastzijde !== "Rechts";

  // Variant-geometrie: hoogte van de constructie + caption + doekvorm.
  let poleCm: number;
  let caption: string;
  let vorm: "banier" | "mastvlag" | "straight" | "square" | "gevel" = "banier";
  let doekTopCm = 20; // afstand doek-top tot masttop

  if (slug === "mastvlag") {
    vorm = "mastvlag";
    poleCm = mastInfo?.mastCm ?? 650;
    caption = `${sizeLabel}${mastInfo?.advies ? ` · ${mastInfo.advies}` : ""}`;
    doekTopCm = 12;
  } else if (slug === "beachvlag") {
    const { name, dims } = splitSizeLabel(sizeLabel);
    vorm = name?.toLowerCase().startsWith("square") ? "square" : "straight";
    poleCm = heightCm + 20; // het doek volgt de stok tot vlak onder de top
    caption = name ? `${name} · ${dims}` : sizeLabel;
    doekTopCm = 10;
  } else if (slug === "gevelvlag") {
    vorm = "gevel";
    poleCm = 300; // uithouder op ± 3 m aan de gevel
    caption = `${sizeLabel} · aan de gevel`;
  } else {
    // Baniervlag: kleinste standaardmast (6/7/8 m) met ≥ 1,5 m vrije ruimte.
    poleCm = [600, 700, 800].find((m) => m - heightCm >= 150) ?? 800;
    caption = `${sizeLabel} · mast ${poleCm / 100} m`;
  }

  const scale = AVAILABLE_PX / Math.max(poleCm, 320);
  const poleH = poleCm * scale;
  const doekW = Math.max(10, widthCm * scale);
  const doekH = Math.max(8, heightCm * scale);
  const personH = 180 * scale;
  const leafSize = Math.round(
    Math.min(26, Math.max(12, Math.min(doekW, doekH) * 0.5)),
  );

  return (
    <div className={styles.banierPreview} aria-hidden="true">
      <span className={styles.banierCaption}>{caption}</span>
      <div className={styles.banierStage}>
        <div className={styles.banierScene}>
          {vorm === "gevel" ? (
            /* Gevelvlag: wandje + stok die 45 graden omhoog steekt; het doek
             hangt aan de stok en draait mee, zoals op de productfoto's. De
             KORTE kant van het doek zit aan de stok, de lange kant hangt af.
             De stok kantelt om zijn wand-bevestiging, dus het bevestigingspunt
             ligt precies zo veel lager als de tip stijgt. */
            <span
              className={styles.gevelUnit}
              style={{
                height: `${poleH}px`,
                width: `${Math.round(16 + (doekH + 24 + doekW) * 0.7071) + 8}px`,
              }}
            >
              <span className={styles.gevelWand} />
              <span
                className={styles.gevelStok}
                style={{
                  top: `${Math.round((doekH + 24) * 0.7071) + 6}px`,
                  width: `${doekH + 24}px`,
                }}
              >
                <span
                  className={styles.banierDoek}
                  data-vorm="gevel"
                  style={{ width: `${doekH}px`, height: `${doekW}px` }}
                >
                  <Leaf size={leafSize} />
                </span>
              </span>
            </span>
          ) : (
            <span
              className={styles.banierUnit}
              style={{
                height: `${poleH}px`,
                flexDirection: mastLinks ? "row" : "row-reverse",
              }}
            >
              <span className={styles.banierPole} />
              <span
                className={styles.banierDoek}
                data-vorm={vorm}
                data-mast={mastLinks ? "links" : "rechts"}
                style={{
                  width: `${doekW}px`,
                  height: `${doekH}px`,
                  marginTop: `${Math.round(doekTopCm * scale)}px`,
                }}
              >
                {bandkleur != null && (
                  <span
                    className={styles.banierBand}
                    data-kleur={bandkleur}
                    style={mastLinks ? { left: 0 } : { right: 0 }}
                  />
                )}
                <Leaf size={leafSize} />
              </span>
            </span>
          )}
          <span
            className={styles.banierPerson}
            style={{ height: `${personH}px` }}
          >
            <span className={styles.banierPersonHead} />
            <span className={styles.banierPersonBody} />
            <span className={styles.banierScaleTag}>± 1,80 m</span>
          </span>
        </div>
        <span className={styles.banierGround} />
      </div>
    </div>
  );
}
