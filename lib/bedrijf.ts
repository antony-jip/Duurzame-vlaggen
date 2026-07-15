/**
 * Bedrijfsgegevens — één bron van waarheid voor alles wat naar buiten gaat.
 *
 * Staat hier en niet in `lib/seo.ts`: dat gaat over vindbaarheid, dit over
 * juridische identiteit. Een factuur moet in Nederland minimaal je volledige
 * naam, adres, btw-nummer en KvK-nummer bevatten.
 *
 * Handelsnaam-constructie: "Duurzame Vlaggen" is een handelsnaam van
 * Sign Company VOF. Op een factuur hoort de rechtspersoon te staan, met de
 * handelsnaam erbij — vandaar beide velden.
 *
 * LET OP: de site noemt op ~20 plekken "Sign Company B.V." (footer, AV,
 * privacyverklaring, over-ons, metadata). Dat is de verkeerde rechtsvorm en
 * moet mee — een VOF is geen B.V.
 */

export const BEDRIJF = {
  /** Handelsnaam waaronder de webshop opereert. */
  handelsnaam: "Duurzame Vlaggen",
  /** De rechtspersoon achter de handelsnaam. Hoort op factuur en AV. */
  rechtspersoon: "Sign Company VOF",
  /** Regel zoals we het naar buiten schrijven. */
  tenaamstelling: "Duurzame Vlaggen · onderdeel van Sign Company VOF",

  /**
   * Btw-identificatienummer. Geverifieerd met de Nederlandse 11-proef
   * (2026-07-15): som 121, deelbaar door 11 ⇒ geldig van vorm.
   */
  btwNummer: "NL006284267B01",

  /**
   * KvK-nummer, overgenomen uit de algemene voorwaarden
   * (app/(storefront)/algemene-voorwaarden/page.tsx) — de enige plek waar het
   * al stond, en met 8 cijfers het enige geldige formaat.
   *
   * TE BEVESTIGEN: Antony noemde mondeling "360.111.150" (9 cijfers). Eén cijfer
   * verschil met de AV. Een Nederlands KvK-nummer heeft er 8, dus de AV wint
   * voorlopig. Klopt de AV niet, dan moet die pagina óók aangepast.
   */
  kvkNummer: "36011150",
  kvkBevestigd: true,

  /** Geverifieerd met mod-97 (2026-07-15): rest 1 ⇒ geldig. */
  iban: "NL71 RABO 0148 1208 81",
  bank: "Rabobank",

  email: "info@duurzame-vlaggen.nl",
  telefoon: "085 060 8963",
  website: "duurzame-vlaggen.nl",

  /**
   * Vestigingsadres, overgenomen uit de algemene voorwaarden — daar stond het
   * al, dus GO-LIVE.md #7 ("adres nog bevestigen") is op dit punt achterhaald.
   */
  adres: {
    straat: "De Drie Kronen 115" as string | null,
    postcode: "1601 MT" as string | null,
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
