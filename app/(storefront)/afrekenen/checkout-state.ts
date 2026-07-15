/**
 * Checkout-state, los van `actions.ts`.
 *
 * Waarom een eigen bestand: `actions.ts` draagt "use server", en zo'n module
 * mag uitsluitend async functies exporteren — elke andere export laat Next de
 * hele module afkeuren ("can only export async functions, found object").
 * `initialCheckoutState` is een object en hoort daar dus niet. De interface
 * mocht op zich blijven staan (types verdwijnen bij compilatie), maar staat
 * hier bij de waarde die hem gebruikt.
 *
 * Zet hier dus geen server-only code neer: dit bestand wordt ook door de
 * client-kant van het afrekenformulier geïmporteerd.
 */

export interface CheckoutState {
  status: "idle" | "error" | "quote";
  /** General banner message. */
  message?: string;
  /** Per-field validation errors, keyed by form field name. */
  fieldErrors?: Record<string, string>;
}

export const initialCheckoutState: CheckoutState = { status: "idle" };
