"use client";

/**
 * Client-side cart: React context backed by localStorage.
 *
 * Mounted once in `app/layout.tsx` around Header/main/Footer. The provider
 * receives the active `catalog` (resolved server-side from request headers) so
 * client cart pages can format currency with the right locale without touching
 * request headers themselves.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UiCatalog } from "@/config/domains";
import { normalizeCartItem, type CartDesign, type CartItem } from "./types";
import { cartRegelTotaal } from "@/lib/pricing/local-catalog";

const STORAGE_KEY = "dv-cart-v1";
const VAT_STORAGE_KEY = "dv-vat-incl-v1";

/** NL standaard-btw-tarief, gebruikt voor de ex/incl-weergave. */
export const VAT_RATE = 0.21;

export interface CartContextValue {
  /** Current cart lines. */
  items: CartItem[];
  /** Sum of `unitPriceEstimate × amount` across all lines (ex VAT). */
  subtotal: number;
  /** Total quantity across all lines. */
  count: number;
  /** True once localStorage has been read (avoids an SSR/client flash). */
  hydrated: boolean;
  /** Active UI catalog, for locale-aware currency formatting. */
  catalog: UiCatalog;
  /** Toont de gebruiker prijzen incl. btw? (voorkeur, persistent) */
  inclVat: boolean;
  /** Wissel tussen prijzen ex en incl btw. */
  toggleVat: () => void;
  /** Add a line; merges into an identical existing line by bumping its amount. */
  addItem: (item: Omit<CartItem, "id">) => void;
  /** Staat het winkelmand-paneel open? */
  paneelOpen: boolean;
  /** Open/sluit het paneel. `addItem` opent het zelf al. */
  setPaneelOpen: (open: boolean) => void;
  /** Remove a line by id. */
  removeItem: (id: string) => void;
  /** Set a line's quantity (clamped to at least 1). */
  updateAmount: (id: string, amount: number) => void;
  /** Vervang de design-toewijzingen van een regel in één keer. */
  setItemDesigns: (id: string, designs: CartDesign[]) => void;
  /** Empty the cart. */
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Signature used to detect "identical" lines for quantity merging. */
function lineSignature(item: Omit<CartItem, "id" | "amount">): string {
  const options = [...item.options]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((o) => `${o.code}=${o.value ?? ""}`)
    .join("|");
  return `${item.slug}::${item.sizeLabel}::${options}`;
}

export function CartProvider({
  children,
  catalog,
}: {
  children: ReactNode;
  catalog: UiCatalog;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [inclVat, setInclVat] = useState(false);

  // Hydrate from localStorage exactly once, on mount. This is the canonical
  // "read persisted client state after SSR" case: the server renders an empty
  // cart, the client's first render must match it, and only then do we swap in
  // the stored items. Setting state in this effect (rather than a render-time
  // initializer that would read localStorage during SSR) is what keeps
  // hydration consistent — hence the scoped rule disable.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          // Migreer manden van vóór de design-toewijzingen (één fileUrl per
          // regel) bij het lezen.
          setItems((parsed as CartItem[]).map(normalizeCartItem));
        }
      }
      if (window.localStorage.getItem(VAT_STORAGE_KEY) === "1") {
        setInclVat(true);
      }
    } catch {
      // Corrupt/blocked storage — start empty.
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleVat = useCallback(() => {
    setInclVat((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(VAT_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Storage blocked — voorkeur blijft alleen in-memory.
      }
      return next;
    });
  }, []);

  // Persist after hydration so the initial empty state never clobbers storage.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full/blocked — ignore, cart stays in memory.
    }
  }, [items, hydrated]);

  // Het paneel is de winkelmand: na toevoegen zie je meteen wat erin zit en ga
  // je in één klik door. Er is geen mandpagina meer om op te landen.
  const [paneelOpen, setPaneelOpen] = useState(false);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setPaneelOpen(true);
    setItems((prev) => {
      const sig = lineSignature(item);
      const existing = prev.find((it) => lineSignature(it) === sig);
      if (existing) {
        return prev.map((it) =>
          it.id === existing.id
            ? { ...it, amount: it.amount + item.amount }
            : it,
        );
      }
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      return [...prev, { ...item, id }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const updateAmount = useCallback((id: string, amount: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const next = Math.max(1, Math.round(amount));
        // De snelle route blijft synchroon: één design dat de hele regel dekte
        // blijft de hele regel dekken als het aantal wijzigt. Verdeelde
        // toewijzingen blijven staan; de regel toont zelf zijn tekort/teveel.
        const designs = it.designs ?? [];
        const syncedDesigns =
          designs.length === 1 && designs[0].quantity === it.amount
            ? [{ ...designs[0], quantity: next }]
            : designs;
        return { ...it, amount: next, designs: syncedDesigns };
      }),
    );
  }, []);

  const setItemDesigns = useCallback((id: string, designs: CartDesign[]) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, designs } : it)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    // Subtotaal met staffelkorting per regel — zo klopt de mand met de
    // definitieve prijs die buildLocalQuote (checkout) berekent. Accessoires
    // (losse artikelen met eigen aantal) tellen als vast bedrag per regel mee,
    // buiten de staffel — zelfde regel als localLinePrice.
    const subtotal = items.reduce(
      (sum, it) => sum + cartRegelTotaal(it),
      0,
    );
    const count = items.reduce((sum, it) => sum + it.amount, 0);
    return {
      items,
      subtotal,
      count,
      hydrated,
      catalog,
      inclVat,
      toggleVat,
      addItem,
      removeItem,
      updateAmount,
      setItemDesigns,
      clear,
      paneelOpen,
      setPaneelOpen,
    };
  }, [items, hydrated, catalog, inclVat, toggleVat, addItem, removeItem, updateAmount, setItemDesigns, clear, paneelOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Access the cart. Throws if used outside a `CartProvider`. */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
