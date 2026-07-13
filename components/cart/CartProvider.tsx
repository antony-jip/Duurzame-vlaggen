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
import type { CartItem } from "./types";

const STORAGE_KEY = "dv-cart-v1";

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
  /** Add a line; merges into an identical existing line by bumping its amount. */
  addItem: (item: Omit<CartItem, "id">) => void;
  /** Remove a line by id. */
  removeItem: (id: string) => void;
  /** Set a line's quantity (clamped to at least 1). */
  updateAmount: (id: string, amount: number) => void;
  /** Attach (or clear, with null) the uploaded artwork for a line. */
  setItemFile: (id: string, fileUrl: string | null, fileName: string | null) => void;
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
        if (Array.isArray(parsed)) setItems(parsed as CartItem[]);
      }
    } catch {
      // Corrupt/blocked storage — start empty.
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist after hydration so the initial empty state never clobbers storage.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full/blocked — ignore, cart stays in memory.
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
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
      prev.map((it) =>
        it.id === id ? { ...it, amount: Math.max(1, Math.round(amount)) } : it,
      ),
    );
  }, []);

  const setItemFile = useCallback(
    (id: string, fileUrl: string | null, fileName: string | null) => {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, fileUrl, fileName } : it)));
    },
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce(
      (sum, it) => sum + it.unitPriceEstimate * it.amount,
      0,
    );
    const count = items.reduce((sum, it) => sum + it.amount, 0);
    return {
      items,
      subtotal,
      count,
      hydrated,
      catalog,
      addItem,
      removeItem,
      updateAmount,
      setItemFile,
      clear,
    };
  }, [items, hydrated, catalog, addItem, removeItem, updateAmount, setItemFile, clear]);

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
