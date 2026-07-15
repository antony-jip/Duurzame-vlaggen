/**
 * Bedrijfsgegevens — één bron van waarheid voor alles wat naar buiten gaat.
 *
 * Staat hier en niet in `lib/seo.ts`: dat gaat over vindbaarheid, dit over
 * juridische identiteit. Een factuur moet in Nederland minimaal je volledige
 * naam, adres, btw-nummer en KvK-nummer bevatten.
 *
 * Handelsnaam-constructie: "Duurzame Vlaggen" is een handelsnaam van
 * Sign Company B.V. Op een factuur hoort de rechtspersoon te staan, met de
 * handelsnaam erbij — vandaar beide velden.
 */

export const BEDRIJF = {
  /** Handelsnaam waaronder de webshop opereert. */
  handelsnaam: "Duurzame Vlaggen",
  /** De rechtspersoon achter de handelsnaam. Hoort op factuur en AV. */
  rechtspersoon: "Sign Company B.V.",
  /** Regel zoals we het naar buiten schrijven. */
  tenaamstelling: "Duurzame Vlaggen · onderdeel van Sign Company B.V.",

  /**
   * Btw-identificatienummer. Geverifieerd met de Nederlandse 11-proef
   * (2026-07-15): som 121, deelbaar door 11 ⇒ geldig van vorm.
   */
  btwNummer: "NL006284267B01",

  /**
   * KvK-nummer.
   *
   * LET OP: aangeleverd als "360.111.150" = 9 cijfers, terwijl een Nederlands
   * KvK-nummer er 8 heeft. Waarschijnlijk een typefout (vermoedelijk 36011115).
   * Nog te bevestigen door Antony — zie docs/GO-LIVE.md #7. Tot die tijd staat
   * `kvkBevestigd` op false en laat de factuur het nummer bewust weg in plaats
   * van een mogelijk fout nummer te drukken.
   */
  kvkNummer: "360111150",
  kvkBevestigd: false,

  /** Geverifieerd met mod-97 (2026-07-15): rest 1 ⇒ geldig. */
  iban: "NL71 RABO 0148 1208 81",
  bank: "Rabobank",

  email: "info@duurzame-vlaggen.nl",
  telefoon: "085 060 8963",
  website: "duurzame-vlaggen.nl",

  /**
   * Vestigingsadres. Enkhuizen is bevestigd als magazijn/HQ (docs/CONTENT-MAP.md),
   * het straatadres nog niet — zie GO-LIVE.md #7. Leeg laten is beter dan
   * verzinnen: een factuuradres moet kloppen.
   */
  adres: {
    straat: null as string | null,
    postcode: null as string | null,
    plaats: "Enkhuizen",
    land: "Nederland",
  },
} as const;

/**
 * Adresregels voor op briefpapier. Slaat ontbrekende velden over, zodat een
 * onbevestigd straatadres geen "null" op de factuur zet.
 */
export function bedrijfsAdresRegels(): string[] {
  const { straat, postcode, plaats, land } = BEDRIJF.adres;
  return [straat, [postcode, plaats].filter(Boolean).join("  "), land]
    .map((r) => (r ?? "").trim())
    .filter(Boolean);
}

/**
 * Wat er onderaan een factuur hoort. `kvkBevestigd` gate: liever geen
 * KvK-nummer dan een fout KvK-nummer.
 */
export function factuurVoetRegels(): string[] {
  const identificatie = [
    BEDRIJF.rechtspersoon,
    BEDRIJF.kvkBevestigd ? `KvK ${BEDRIJF.kvkNummer}` : null,
    `Btw ${BEDRIJF.btwNummer}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    identificatie,
    `${BEDRIJF.bank} ${BEDRIJF.iban} · ${BEDRIJF.email} · ${BEDRIJF.telefoon}`,
  ];
}
