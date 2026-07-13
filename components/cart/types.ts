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
}
