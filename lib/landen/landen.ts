/**
 * Landenlijst voor de landenvlaggen-shop (/landenvlaggen).
 *
 * `LAND_CODES` = alle 249 ISO 3166-1 alpha-2 landcodes waarvoor het
 * `flag-icons`-package een 4x3-SVG meelevert (gegenereerd uit zijn
 * country.json, `iso: true`; `scripts/sync-flag-icons.mjs` bewaakt dat elke
 * code ook echt een bestand heeft). Hardcoded in plaats van country.json
 * client-side bundelen: de codes zijn een stabiele standaard en dit scheelt
 * ~30 KB aan hoofdsteden/continenten die niemand gebruikt.
 *
 * Nederlandse namen komen bij runtime uit `Intl.DisplayNames("nl")` — geen
 * eigen vertaaltabel te onderhouden, en de namen zijn overal consistent.
 */

export const LAND_CODES: readonly string[] = [
  "ad", "ae", "af", "ag", "ai", "al", "am", "ao", "aq", "ar", "as", "at",
  "au", "aw", "ax", "az", "ba", "bb", "bd", "be", "bf", "bg", "bh", "bi",
  "bj", "bl", "bm", "bn", "bo", "bq", "br", "bs", "bt", "bv", "bw", "by",
  "bz", "ca", "cc", "cd", "cf", "cg", "ch", "ci", "ck", "cl", "cm", "cn",
  "co", "cr", "cu", "cv", "cw", "cx", "cy", "cz", "de", "dj", "dk", "dm",
  "do", "dz", "ec", "ee", "eg", "eh", "er", "es", "et", "fi", "fj", "fk",
  "fm", "fo", "fr", "ga", "gb", "gd", "ge", "gf", "gg", "gh", "gi", "gl",
  "gm", "gn", "gp", "gq", "gr", "gs", "gt", "gu", "gw", "gy", "hk", "hm",
  "hn", "hr", "ht", "hu", "id", "ie", "il", "im", "in", "io", "iq", "ir",
  "is", "it", "je", "jm", "jo", "jp", "ke", "kg", "kh", "ki", "km", "kn",
  "kp", "kr", "kw", "ky", "kz", "la", "lb", "lc", "li", "lk", "lr", "ls",
  "lt", "lu", "lv", "ly", "ma", "mc", "md", "me", "mf", "mg", "mh", "mk",
  "ml", "mm", "mn", "mo", "mp", "mq", "mr", "ms", "mt", "mu", "mv", "mw",
  "mx", "my", "mz", "na", "nc", "ne", "nf", "ng", "ni", "nl", "no", "np",
  "nr", "nu", "nz", "om", "pa", "pe", "pf", "pg", "ph", "pk", "pl", "pm",
  "pn", "pr", "ps", "pt", "pw", "py", "qa", "re", "ro", "rs", "ru", "rw",
  "sa", "sb", "sc", "sd", "se", "sg", "sh", "si", "sj", "sk", "sl", "sm",
  "sn", "so", "sr", "ss", "st", "sv", "sx", "sy", "sz", "tc", "td", "tf",
  "tg", "th", "tj", "tk", "tl", "tm", "tn", "to", "tr", "tt", "tv", "tw",
  "tz", "ua", "ug", "um", "us", "uy", "uz", "va", "vc", "ve", "vg", "vi",
  "vn", "vu", "wf", "ws", "ye", "yt", "za", "zm", "zw",
];

/**
 * Populaire landen, in deze vaste volgorde bovenaan de shop. De selectie is
 * de NL-markt: buurlanden, grote handelspartners en de landen waarvoor hier
 * het vaakst een vlag gehesen wordt.
 */
export const POPULAIRE_LAND_CODES: readonly string[] = [
  "nl", "de", "be", "fr", "gb", "us", "es", "it", "tr", "ma", "pl", "ua",
];

export interface Land {
  /** ISO 3166-1 alpha-2, lowercase (= bestandsnaam van de SVG). */
  code: string;
  /** Nederlandse landnaam via Intl.DisplayNames. */
  naam: string;
}

/** URL van de 4x3-vlag-SVG (gekopieerd door scripts/sync-flag-icons.mjs). */
export function vlagSrc(code: string): string {
  return `/flags/4x3/${code}.svg`;
}

/**
 * Alle landen met Nederlandse naam, alfabetisch gesorteerd (NL-collatie, dus
 * bv. é sorteert als e). Landen zonder bekende NL-naam (zou niet moeten
 * voorkomen; alle 249 codes zijn geverifieerd) vallen stilletjes af in plaats
 * van als kale landcode in de lijst te staan.
 */
export function alleLanden(): Land[] {
  const namen = new Intl.DisplayNames(["nl"], { type: "region" });
  const collator = new Intl.Collator("nl");
  const landen: Land[] = [];
  for (const code of LAND_CODES) {
    let naam: string | undefined;
    try {
      naam = namen.of(code.toUpperCase());
    } catch {
      continue;
    }
    if (!naam || naam === code.toUpperCase()) continue;
    landen.push({ code, naam });
  }
  return landen.sort((a, b) => collator.compare(a.naam, b.naam));
}

/**
 * Bestandsnaam-slug van een landnaam: "Curaçao" → "curacao". Voor de naam van
 * het gegenereerde drukbestand (landenvlag-nederland.png) én de basis van de
 * per-land-landingspagina (/landenvlaggen/curacao).
 */
export function landSlug(naam: string): string {
  return naam
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Eén land met zijn unieke, botsingsvrije URL-slug. */
export interface LandMetSlug extends Land {
  /** Unieke slug binnen alle landen; basis is `landSlug(naam)`. */
  slug: string;
}

/**
 * Slug-index over álle landen, met botsingsbewaking.
 *
 * De slug is standaard `landSlug(naam)` (bv. "duitsland"). Zouden twee landen
 * dezelfde basis-slug opleveren — de NL-namen van Intl.DisplayNames zijn niet
 * gegarandeerd uniek na normalisatie — dan krijgen álle botsende landen de
 * landcode als suffix (`{basis}-{code}`). Dat is deterministisch: het hangt
 * niet af van de sorteervolgorde, dus dezelfde landcode levert altijd dezelfde
 * URL. Landen met een unieke basis houden hun schone slug.
 *
 * Gememoïseerd: `alleLanden()` bouwt per aanroep nieuwe Intl-objecten, en
 * `generateStaticParams`/`generateMetadata`/de pagina vragen dit meermaals op.
 */
let slugIndexCache: {
  lijst: LandMetSlug[];
  opSlug: Map<string, LandMetSlug>;
} | null = null;

function slugIndex() {
  if (slugIndexCache) return slugIndexCache;
  const landen = alleLanden();
  const basisAantal = new Map<string, number>();
  for (const l of landen) {
    const basis = landSlug(l.naam);
    basisAantal.set(basis, (basisAantal.get(basis) ?? 0) + 1);
  }
  const lijst: LandMetSlug[] = landen.map((land) => {
    const basis = landSlug(land.naam);
    const slug =
      (basisAantal.get(basis) ?? 0) > 1 ? `${basis}-${land.code}` : basis;
    return { ...land, slug };
  });
  const opSlug = new Map(lijst.map((l) => [l.slug, l]));
  slugIndexCache = { lijst, opSlug };
  return slugIndexCache;
}

/** Alle landen (NL-gesorteerd) met hun unieke URL-slug. */
export function alleLandenMetSlug(): LandMetSlug[] {
  return slugIndex().lijst;
}

/** Landcode → unieke slug, voor het bouwen van links naar de landpagina's. */
export function slugsPerLandcode(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of slugIndex().lijst) out[l.code] = l.slug;
  return out;
}

/** Resolver: slug → land, of undefined bij een onbekende slug (→ notFound). */
export function vindLandOpSlug(slug: string): LandMetSlug | undefined {
  return slugIndex().opSlug.get(slug);
}
