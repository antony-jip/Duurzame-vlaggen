import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Ondertekende akkoordlink voor een offerte.
 *
 * Offertes staan niet in een database: alles wat de akkoordpagina en de
 * betaallink nodig hebben reist mee in de link, met een HMAC erover. Zo kan
 * niemand het bedrag of de geldigheid aanpassen, en werkt de link zonder
 * lookup:
 *
 *   token = base64url(json) + "." + hmac_sha256(base64url(json), secret)
 *
 * Het secret komt van de aanroeper (`serverEnv.emailLinkSecret`, net als de
 * uitschrijflinks), met een eigen prefix zodat een uitschrijftoken nooit als
 * offertetoken geldt.
 */

export interface OfferteToken {
  /** Offertenummer. */
  n: string;
  /** Onderwerp, bv. "Beachvlag" of "3 producten". */
  s: string;
  /** Totaal incl. btw in euro's. */
  t: number;
  /** Geldig tot (ISO-datum). */
  g: string;
  /** Organisatie, naam en e-mail van de aanvrager. */
  o: string;
  nm: string;
  e: string;
  /** Referentie/inkoopnummer, optioneel. */
  r?: string;
  /** True als er regels met "prijs volgt" op staan: dan geen automatische betaallink. */
  h?: boolean;
}

const PREFIX = "offerte-akkoord:";

function hmac(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(PREFIX + payload).digest("hex");
}

export function signOfferteToken(data: OfferteToken, secret: string): string {
  const payload = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
  return `${payload}.${hmac(payload, secret)}`;
}

/** Geeft de inhoud terug, of null als de handtekening niet klopt. Verloop checkt de aanroeper. */
export function verifyOfferteToken(token: string, secret: string): OfferteToken | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const payload = token.slice(0, dot);
  const given = token.slice(dot + 1);
  const expected = hmac(payload, secret);
  if (given.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OfferteToken;
    if (typeof data.n !== "string" || typeof data.t !== "number" || typeof data.g !== "string") {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/** Is de offerte nog geldig? `g` is de laatste geldige dag (tot en met). */
export function offerteVerlopen(data: OfferteToken, nu = new Date()): boolean {
  const eind = new Date(data.g);
  eind.setUTCHours(23, 59, 59, 999);
  return nu.getTime() > eind.getTime();
}
