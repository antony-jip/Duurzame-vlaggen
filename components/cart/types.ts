/**
 * Cart data shapes — a plain (non-client) module so both the client
 * `CartProvider` and the server-side checkout action can share the types
 * without pulling a `"use client"` boundary or a `server-only` module across
 * the divide.
 */

/** A single option selection on a cart line (label + chosen value). */
export interface CartOption {
  /** Human label, e.g. "Afwerking" (or a Probo option code once orderable). */
  code: string;
  /** Chosen value, e.g. "Tunnelzoom". Absent for flag-style options. */
  value?: string | number;
}

/**
 * Eén design-toewijzing op een winkelmandregel: een geüpload bestand (of een
 * "later aanleveren"-slot wanneer `fileUrl` null is) dat `quantity` vlaggen
 * van de regel dekt. Afrekenen vereist dat de toewijzingen van elke regel
 * exact optellen tot het aantal.
 */
export interface CartDesign {
  /** Stabiel client-gegenereerd id (keyt rijen, stuurt vervangen/verwijderen). */
  id: string;
  /** Hoeveel vlaggen van de regel dit ontwerp dekt. */
  quantity: number;
  /** Publieke URL in de order-artwork bucket; null = later aanleveren. */
  fileUrl: string | null;
  /** Oorspronkelijke bestandsnaam, voor weergave. */
  fileName: string | null;
  /** Storage-key (`${uuid}-${safeName}`), nodig om te wissen bij vervangen. */
  filePath: string | null;
  /** Niet-blokkerende kwaliteitswaarschuwingen uit de uploadcheck. */
  fileWarnings: string[];
  /**
   * Compacte raster-preview (data-URL, eerste PDF-pagina via pdf.js).
   * Display-only en NOOIT onderdeel van de checkout-payload.
   */
  previewUrl?: string | null;
}

/** One configured line in the cart. */
export interface CartItem {
  /** Stable client-generated line id (keys rows, drives remove/update). */
  id: string;
  slug: string;
  name: string;
  /**
   * Probo product code — `null` while the product is still quote-only (no
   * confirmed Probo mapping). Quote-only lines skip live checkout.
   */
  proboProductCode: string | null;
  options: CartOption[];
  /** Quantity. */
  amount: number;
  /** Indicative unit price ex VAT (from the catalogue `priceFrom`). */
  unitPriceEstimate: number;
  /** Human size label, e.g. "250 × 100 cm". */
  sizeLabel: string;
  /**
   * Flag dimensions in cm (from the catalogue `sizes[]`), used to check the
   * uploaded artwork's resolution/aspect ratio. Absent on hardware lines and on
   * carts persisted before this field existed (the winkelmand falls back to
   * parsing `sizeLabel`).
   */
  widthCm?: number;
  heightCm?: number;
  /**
   * Design-toewijzingen voor deze regel. Meerdere designs verdelen het aantal
   * ("2 van de 6 met ontwerp A"). Leeg = nog niets toegewezen.
   */
  designs?: CartDesign[];
  /**
   * @deprecated Enkelbestand-velden van manden van vóór de design-toewijzingen.
   * Bij hydrateren gemigreerd naar `designs` (zie {@link normalizeCartItem});
   * worden niet meer geschreven.
   */
  fileUrl?: string | null;
  /** @deprecated Zie {@link CartItem.fileUrl}. */
  fileName?: string | null;
  /** @deprecated Zie {@link CartItem.fileUrl}. */
  filePath?: string | null;
  /** @deprecated Zie {@link CartItem.fileUrl}. */
  fileWarnings?: string[];
  /** @deprecated Zie {@link CartItem.fileUrl}. */
  previewUrl?: string | null;
}

/** Stabiel client-id (werkt ook buiten secure contexts). */
export function clientId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Migreer een opgeslagen mandregel naar de design-toewijzingen: een legacy
 * enkel `fileUrl` wordt één design dat de hele quantity dekt. Idempotent.
 */
export function normalizeCartItem(item: CartItem): CartItem {
  if (item.designs) return item;
  const designs: CartDesign[] = item.fileUrl
    ? [
        {
          id: clientId(),
          quantity: item.amount,
          fileUrl: item.fileUrl,
          fileName: item.fileName ?? null,
          filePath: item.filePath ?? null,
          fileWarnings: item.fileWarnings ?? [],
          previewUrl: item.previewUrl ?? null,
        },
      ]
    : [];
  const {
    fileUrl: _u,
    fileName: _n,
    filePath: _p,
    fileWarnings: _w,
    previewUrl: _v,
    ...rest
  } = item;
  return { ...rest, designs };
}

/** Som van de toegewezen aantallen op een regel. */
export function assignedQuantity(item: CartItem): number {
  return (item.designs ?? []).reduce((sum, d) => sum + d.quantity, 0);
}

/**
 * Toewijzingsstatus van een regel. `complete` betekent dat de aantallen EXACT
 * optellen tot het bestelde aantal (uploads en "later aanleveren" tellen
 * allebei mee); afrekenen vereist dat elke bestelbare regel compleet is.
 */
export function designStatus(item: CartItem): {
  assigned: number;
  missing: number;
  over: number;
  complete: boolean;
} {
  const assigned = assignedQuantity(item);
  return {
    assigned,
    missing: Math.max(0, item.amount - assigned),
    over: Math.max(0, assigned - item.amount),
    complete: assigned === item.amount,
  };
}

/** Eerste design mét bestand — wat de regel-mockup toont. */
export function primaryDesign(item: CartItem): CartDesign | undefined {
  return (item.designs ?? []).find((d) => d.fileUrl !== null);
}

/** True wanneer elke bestelbare regel complete toewijzingen heeft. */
export function cartDesignsComplete(items: CartItem[]): boolean {
  return items
    .filter((it) => it.proboProductCode !== null)
    .every((it) => designStatus(normalizeCartItem(it)).complete);
}

/**
 * Wat de checkout-action écht van een design nodig heeft: het aantal en de
 * bestands-URL (null = later aanleveren). Naam/pad leidt de server zelf af uit
 * de URL; previews en waarschuwingen zijn display-only en blijven achter.
 */
export interface CheckoutDesign {
  quantity: number;
  fileUrl: string | null;
}

/**
 * Wat de checkout-action écht van een regel nodig heeft.
 *
 * De afrekenpagina serialiseert de winkelmand naar een verborgen veld, dus die
 * payload gaat integraal mee in de server-action. Dat was `JSON.stringify(items)`
 * — inclusief `previewUrl`, een base64-PNG van maximaal 3MB die de server nooit
 * leest. Next kapt action-bodies af op 1MB (docs: 01-app/02-guides/server-actions),
 * en `next.config` verhoogt dat niet, dus één foto-zware PDF gaf een harde 500 op
 * de betaalknop.
 *
 * Dit type is daarom de grens: alleen wat `checkoutAction` daadwerkelijk uitleest.
 * `unitPriceEstimate` hoort er bewust óók niet in — de prijs wordt server-side
 * herberekend uit de catalogus (`buildLocalQuote`), nooit uit de client-payload.
 */
export interface CheckoutLine {
  slug: string;
  name: string;
  proboProductCode: string | null;
  options: CartOption[];
  amount: number;
  sizeLabel: string;
  widthCm?: number;
  heightCm?: number;
  designs: CheckoutDesign[];
}

/** Winkelmand → checkout-payload: alleen de velden die de server uitleest. */
export function toCheckoutLines(items: CartItem[]): CheckoutLine[] {
  return items.map(normalizeCartItem).map((it) => ({
    slug: it.slug,
    name: it.name,
    proboProductCode: it.proboProductCode,
    options: it.options,
    amount: it.amount,
    sizeLabel: it.sizeLabel,
    widthCm: it.widthCm,
    heightCm: it.heightCm,
    designs: (it.designs ?? []).map((d) => ({
      quantity: d.quantity,
      fileUrl: d.fileUrl,
    })),
  }));
}
