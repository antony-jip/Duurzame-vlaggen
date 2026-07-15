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
  /**
   * De ingevulde waarden, teruggekaatst naar het formulier.
   *
   * React wist een formulier zodra de action klaar is: de velden vallen terug op
   * hun `defaultValue`. Bij een fout was dat leeg, en dan mocht de klant zijn
   * hele adres opnieuw intikken — precies op het moment dat hij toch al
   * geïrriteerd is. Door hier terug te geven wat hij instuurde, reset React naar
   * die waarden in plaats van naar niets.
   *
   * Alleen gevuld op de foutpaden; bij succes volgt een redirect.
   */
  values?: Record<string, string>;
}

export const initialCheckoutState: CheckoutState = { status: "idle" };
