"use client";

/**
 * Message-catalogus voor client-componenten.
 *
 * `lib/i18n` is `server-only` (het leest request-headers), dus Header, Footer en
 * Price kunnen daar niet bij. De storefront-shell resolvet de catalogus één keer
 * server-side en zet hem hier in context; client-componenten lezen hem met
 * `useDict()`.
 *
 * Los van `CartProvider` gehouden: dat is winkelmand-state, dit is vertaling.
 * Een component dat alleen tekst nodig heeft (Footer) hoeft zo niet aan de mand
 * te hangen.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n/types";

const DictContext = createContext<Dictionary | null>(null);

export function DictProvider({
  children,
  dict,
}: {
  children: ReactNode;
  dict: Dictionary;
}) {
  return <DictContext.Provider value={dict}>{children}</DictContext.Provider>;
}

/**
 * De actieve catalogus. Gooit buiten de provider — dat is een bedradingsfout,
 * geen situatie om stilzwijgend op NL terug te vallen (dan zou een Duitse
 * pagina ongemerkt Nederlands tonen).
 */
export function useDict(): Dictionary {
  const dict = useContext(DictContext);
  if (dict === null) {
    throw new Error("useDict moet binnen een <DictProvider> gebruikt worden.");
  }
  return dict;
}
