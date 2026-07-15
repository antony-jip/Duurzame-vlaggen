import "server-only";
import { gscQuery, type GscRij } from "./gsc";
import { serverEnv } from "@/lib/env";

/**
 * Search Console → SEO-kansen.
 *
 * Overgenomen van de signcompany-analytics (`api/analytics.mjs`) en aangepast
 * op deze site. De drempels en de indeling zijn daar in de praktijk uitgehard;
 * afwijken zonder reden heeft weinig zin. Aangepast is:
 *  - `isBranded` (eigen merknaam + de merknamen van de andere marktdomeinen)
 *  - `vraagRe`   (vlaggen/CSRD-taal i.p.v. sign-taal)
 *  - `canon()` vangt hier de WP-trailing-slash-twins af (`/materiaal/` vs
 *    `/materiaal`) i.p.v. een kennisbank-herstructurering.
 */

export type Range = "7d" | "28d" | "90d" | "6m" | "12m";

export const RANGE_DAGEN: Record<Range, number> = {
  "7d": 7,
  "28d": 28,
  "90d": 90,
  "6m": 182,
  "12m": 365,
};

export const RANGE_LABEL: Record<Range, string> = {
  "7d": "7 dagen",
  "28d": "28 dagen",
  "90d": "90 dagen",
  "6m": "6 maanden",
  "12m": "12 maanden",
};

const DAG_MS = 86_400_000;

/** Google finaliseert data 2-3 dagen te laat; verser opvragen geeft lege dagen. */
const LAG_DAGEN = 3;

function isoDag(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Venster voor een range. `totEnMet` is inclusief (zoals GSC verwacht) en ligt
 * LAG_DAGEN terug, anders tellen we halfgevulde dagen mee en lijkt het laatste
 * stuk van elke grafiek een daling.
 */
export function periode(range: Range) {
  const dagen = RANGE_DAGEN[range] ?? 28;
  const eind = new Date(Date.now() - LAG_DAGEN * DAG_MS);
  const start = new Date(eind.getTime() - (dagen - 1) * DAG_MS);
  return { since: isoDag(start), totEnMet: isoDag(eind), dagen };
}

/** URL → pad. GSC levert absolute URL's; wij tonen en vergelijken op pad. */
export function pad(url: string): string {
  try {
    return new URL(url).pathname || url;
  } catch {
    return url;
  }
}

/**
 * Branded zoekwoorden zijn geen SEO-kans: de site rankt op zijn eigen naam met
 * sitelinks, dus "kannibalisatie" tussen `/`, `/contact` en `/over-ons` is daar
 * normaal. Naast de NL-merknaam ook de andere marktmerken, want die delen straks
 * één service-account.
 */
export function isBranded(query: string): boolean {
  return /duurzame.?vlaggen|duurzamevlaggen|nachhaltige.?flaggen|drapeaux.?durables|sustainable.?flags|sign\s*company/i.test(
    query,
  );
}

/**
 * Twee paden die na normalisatie samenvallen zijn dezelfde pagina onder een
 * andere URL-vorm — een redirect-/canonical-kwestie, geen kannibalisatie.
 * Vangt hier vooral de WP-erfenis af: WordPress serveert `/materiaal/`, Next
 * serveert `/materiaal`.
 */
function canon(p: string): string {
  return p.replace(/^\/+|\/+$/g, "").replace(/\//g, "-").toLowerCase();
}

/** Origin voor de live-check, afgeleid van de GSC-property. */
function siteOrigin(): string {
  const s = serverEnv.gscSiteUrl ?? "";
  if (s.startsWith("http")) {
    try {
      return new URL(s).origin;
    } catch {
      /* val terug */
    }
  }
  return "https://duurzame-vlaggen.nl";
}

/**
 * Live-check per pad: is de URL nog echt bereikbaar (2xx) of redirect 'ie al
 * (3xx)? Zo vallen al-opgeloste dubbele URL's weg — Google toont die nog uit de
 * historische index. `redirect: "manual"` volgt de 3xx niet.
 * Bij een fout houden we 'm op "live", zodat we een echt probleem niet stil
 * wegfilteren.
 */
const liveCache = new Map<string, { live: boolean; verlooptMs: number }>();

async function liveStatus(path: string): Promise<boolean> {
  const nu = Date.now();
  const cache = liveCache.get(path);
  if (cache && cache.verlooptMs > nu) return cache.live;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(siteOrigin() + path, {
      method: "HEAD",
      redirect: "manual",
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    const live = res.status >= 200 && res.status < 300;
    liveCache.set(path, { live, verlooptMs: nu + 10 * 60 * 1000 });
    return live;
  } catch {
    return true; // onbekend: niet wegfilteren, en niet cachen zodat we opnieuw proberen
  }
}

const pct1 = (n: number) => Math.round(n * 1000) / 10;
const een = (n: number) => Math.round(n * 10) / 10;

export interface Totalen {
  clicks: number;
  impressies: number;
  ctrPct: number;
  positie: number;
}

export interface Term {
  query: string;
  clicks: number;
  impressies: number;
  ctrPct: number;
  positie: number;
}

export interface Kans {
  query: string;
  pagina: string;
  impressies: number;
  clicks: number;
  ctrPct: number;
  positie: number;
}

export interface Beweger {
  naam: string;
  clicks: number;
  vorigeClicks: number;
  dClicks: number;
  positie: number | null;
}

export interface PaginaRij {
  pagina: string;
  clicks: number;
  impressies: number;
  ctrPct: number;
  positie: number;
}

export interface Zoekverkeer {
  totalen: Totalen;
  vorige: Totalen;
  delta: { clicks: number; impressies: number; ctrPunt: number; positie: number };
  perDag: { label: string; clicks: number; impressies: number }[];
  topZoektermen: Term[];
  topPaginas: PaginaRij[];
  /** Élke pagina-rij over het venster — de migratie-check kijkt verder dan de top-10. */
  allePaginas: PaginaRij[];
  apparaten: { label: string; clicks: number; impressies: number }[];
  landen: { label: string; clicks: number; impressies: number }[];
  bewegers: {
    queries: { stijgers: Beweger[]; dalers: Beweger[] };
    paginas: { stijgers: Beweger[]; dalers: Beweger[] };
  };
  geo: { vraagQueries: Term[]; snippetSteal: Term[] };
  kansen: {
    lageCtr: Kans[];
    bijnaPagina1: Kans[];
    kannibalisatie: { zoekterm: string; impressies: number; paginas: PaginaRij[] }[];
    duplicaatUrls: { zoekterm: string; impressies: number; paden: string[] }[];
  };
}

const DEVICE_LABEL: Record<string, string> = {
  DESKTOP: "Desktop",
  MOBILE: "Mobiel",
  TABLET: "Tablet",
};

const LAND_LABEL: Record<string, string> = {
  nld: "Nederland",
  bel: "België",
  deu: "Duitsland",
  fra: "Frankrijk",
  gbr: "Verenigd Koninkrijk",
  usa: "Verenigde Staten",
  esp: "Spanje",
  ita: "Italië",
  pol: "Polen",
  bra: "Brazilië",
};

function totaalUit(rijen: GscRij[]): Totalen {
  const r = rijen[0];
  return {
    clicks: r?.clicks ?? 0,
    impressies: r?.impressions ?? 0,
    ctrPct: r?.ctr != null ? pct1(r.ctr) : 0,
    positie: r?.position != null ? een(r.position) : 0,
  };
}

/** Periode-diff op Δclicks. Neemt ook termen mee die volledig wegvielen. */
function bewegers(
  huidig: GscRij[],
  vorig: GscRij[],
  sleutelFn: (r: GscRij) => string,
): { stijgers: Beweger[]; dalers: Beweger[] } {
  const vMap = new Map(vorig.map((r) => [sleutelFn(r), r]));
  const huidigeSleutels = new Set(huidig.map(sleutelFn));

  const rijen: Beweger[] = huidig.map((r) => {
    const v = vMap.get(sleutelFn(r));
    return {
      naam: sleutelFn(r),
      clicks: r.clicks,
      vorigeClicks: v ? v.clicks : 0,
      dClicks: r.clicks - (v ? v.clicks : 0),
      positie: een(r.position),
    };
  });

  // Weggevallen termen: staan niet meer in `huidig`, dus dClicks = -vorigeClicks.
  for (const [k, v] of vMap) {
    if (!huidigeSleutels.has(k)) {
      rijen.push({ naam: k, clicks: 0, vorigeClicks: v.clicks, dClicks: -v.clicks, positie: null });
    }
  }

  const schoon = rijen.filter((b) => !isBranded(b.naam));
  return {
    stijgers: schoon.filter((b) => b.dClicks > 0).sort((a, b) => b.dClicks - a.dClicks).slice(0, 8),
    dalers: schoon.filter((b) => b.dClicks < 0).sort((a, b) => a.dClicks - b.dClicks).slice(0, 8),
  };
}

export async function haalZoekverkeer(range: Range): Promise<Zoekverkeer> {
  const { since, totEnMet, dagen } = periode(range);

  // De query+page-fetch is de spil: die koppelt ELKE kans aan de pagina die er
  // nu voor rankt, waardoor een kans een concreet bestand aanwijst.
  const [rijen, queryPage, totaalRijen, dagRijen] = await Promise.all([
    gscQuery({ startDate: since, endDate: totEnMet, dimensions: ["query"], rowLimit: 200 }),
    gscQuery({ startDate: since, endDate: totEnMet, dimensions: ["query", "page"], rowLimit: 5000 }),
    gscQuery({ startDate: since, endDate: totEnMet, dimensions: [] }),
    gscQuery({ startDate: since, endDate: totEnMet, dimensions: ["date"], rowLimit: 400 }),
  ]);

  const totalen = totaalUit(totaalRijen);

  const perDag = dagRijen
    .slice()
    .sort((a, b) => (a.keys[0] < b.keys[0] ? -1 : 1))
    .map((r) => ({
      label: new Date(r.keys[0]).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }),
      clicks: r.clicks ?? 0,
      impressies: r.impressions ?? 0,
    }));

  // Vorige, even lange periode — direct vóór de huidige.
  const vSince = isoDag(new Date(new Date(since).getTime() - dagen * DAG_MS));
  const vTot = isoDag(new Date(new Date(since).getTime() - DAG_MS));

  const [paginaRijen, deviceRijen, landRijen, vTotaalRijen, vQueryRijen, vPaginaRijen] =
    await Promise.all([
      gscQuery({ startDate: since, endDate: totEnMet, dimensions: ["page"], rowLimit: 300 }),
      gscQuery({ startDate: since, endDate: totEnMet, dimensions: ["device"] }),
      gscQuery({ startDate: since, endDate: totEnMet, dimensions: ["country"], rowLimit: 10 }),
      gscQuery({ startDate: vSince, endDate: vTot, dimensions: [] }),
      gscQuery({ startDate: vSince, endDate: vTot, dimensions: ["query"], rowLimit: 300 }),
      gscQuery({ startDate: vSince, endDate: vTot, dimensions: ["page"], rowLimit: 300 }),
    ]);

  const vorige = totaalUit(vTotaalRijen);
  const pctVerschil = (nieuw: number, oud: number) =>
    oud ? Math.round(((nieuw - oud) / oud) * 1000) / 10 : nieuw ? 100 : 0;

  // Clicks/vertoningen als %; CTR in procentpunten; positie absoluut
  // (negatief = verbeterd, want lager is beter).
  const delta = {
    clicks: pctVerschil(totalen.clicks, vorige.clicks),
    impressies: pctVerschil(totalen.impressies, vorige.impressies),
    ctrPunt: een(totalen.ctrPct - vorige.ctrPct),
    positie: een(totalen.positie - vorige.positie),
  };

  const allePaginas: PaginaRij[] = paginaRijen
    .map((r) => ({
      pagina: pad(r.keys[0]),
      clicks: r.clicks,
      impressies: r.impressions,
      ctrPct: pct1(r.ctr),
      positie: een(r.position),
    }))
    .sort((a, b) => b.clicks - a.clicks || b.impressies - a.impressies);

  const topPaginas = allePaginas.slice(0, 10);

  const apparaten = deviceRijen
    .map((r) => ({
      label: DEVICE_LABEL[r.keys[0]] ?? r.keys[0],
      clicks: r.clicks,
      impressies: r.impressions,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const landen = landRijen
    .map((r) => ({
      label: LAND_LABEL[r.keys[0]] ?? (r.keys[0] || "").toUpperCase(),
      clicks: r.clicks,
      impressies: r.impressions,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 6);

  const alleTermen: Term[] = rijen.map((r) => ({
    query: r.keys[0],
    clicks: r.clicks,
    impressies: r.impressions,
    ctrPct: pct1(r.ctr),
    positie: een(r.position),
  }));

  const topZoektermen = alleTermen
    .slice()
    .sort((a, b) => b.clicks - a.clicks || b.impressies - a.impressies)
    .slice(0, 12);

  // GEO/AI-proxy. Vraag-queries zijn AI-Overview-gevoelig; snippet-steal =
  // hoog ranken met lage CTR ⇒ Google's snippet of AI Overview pikt de klik.
  const vraagRe =
    /^(wat|hoe|waarom|wanneer|welke|welk|hoeveel|wie|waar)\b|\b(kosten|kost|prijs|prijzen|verschil|betekenis|uitleg|duurzaam|afbreekbaar|biologisch|microplastic|csrd|milieu)\b/i;
  const geoBron = alleTermen.filter((t) => !isBranded(t.query));
  const vraagQueries = geoBron
    .filter((t) => vraagRe.test(t.query))
    .sort((a, b) => b.impressies - a.impressies)
    .slice(0, 12);
  const snippetSteal = geoBron
    .filter((t) => t.positie > 0 && t.positie <= 3.5 && t.impressies >= 40 && t.ctrPct < 4)
    .sort((a, b) => b.impressies - a.impressies)
    .slice(0, 12);

  // Per zoekterm: totalen, impressie-gewogen positie, en de rankende pagina's.
  interface Groep {
    query: string;
    impressies: number;
    clicks: number;
    posSom: number;
    paginas: PaginaRij[];
  }
  const perTerm = new Map<string, Groep>();
  for (const r of queryPage) {
    const [query, page] = r.keys;
    const g =
      perTerm.get(query) ?? { query, impressies: 0, clicks: 0, posSom: 0, paginas: [] };
    g.impressies += r.impressions;
    g.clicks += r.clicks;
    // Impressie-gewogen: een pagina met 1 vertoning op positie 90 mag het
    // gemiddelde niet kapenmaken.
    g.posSom += r.position * r.impressions;
    g.paginas.push({
      pagina: pad(page),
      impressies: r.impressions,
      clicks: r.clicks,
      ctrPct: pct1(r.ctr),
      positie: een(r.position),
    });
    perTerm.set(query, g);
  }

  const kans: Kans[] = [];
  for (const g of perTerm.values()) {
    g.paginas.sort((a, b) => b.impressies - a.impressies);
    kans.push({
      query: g.query,
      pagina: g.paginas[0].pagina,
      impressies: g.impressies,
      clicks: g.clicks,
      positie: g.impressies ? een(g.posSom / g.impressies) : 0,
      ctrPct: g.impressies ? pct1(g.clicks / g.impressies) : 0,
    });
  }

  // Kans A — lage CTR op pagina 1: je staat er al goed met veel vertoningen maar
  // krijgt weinig clicks. Titel/meta-omschrijving is de hefboom.
  const lageCtr = kans
    .filter((t) => !isBranded(t.query) && t.positie <= 10 && t.impressies >= 30 && t.ctrPct < 2)
    .sort((a, b) => b.impressies - a.impressies)
    .slice(0, 12);

  // Kans B — bijna pagina 1: positie 8-20 met genoeg vraag. Termen uit Kans A
  // slaan we over zodat dezelfde term niet in twee blokken opduikt.
  const lageCtrTermen = new Set(lageCtr.map((t) => t.query));
  const bijnaPagina1 = kans
    .filter(
      (t) =>
        !isBranded(t.query) &&
        !lageCtrTermen.has(t.query) &&
        t.positie >= 8 &&
        t.positie <= 20 &&
        t.impressies >= 20,
    )
    .sort((a, b) => b.impressies - a.impressies)
    .slice(0, 12);

  // Kans C/D — meerdere eigen pagina's op één term. Gesplitst in dubbele URL's
  // (dezelfde pagina onder meerdere vormen ⇒ redirect/canonical) en echte
  // kannibalisatie (verschillende pagina's, ná samenvouwen van de twins).
  const kannibalisatie: { zoekterm: string; impressies: number; paginas: PaginaRij[] }[] = [];
  const duplicaatRuw: { zoekterm: string; impressies: number; paden: string[] }[] = [];

  for (const g of perTerm.values()) {
    if (isBranded(g.query)) continue;
    if (g.paginas.length < 2) continue;
    if (g.paginas[1].impressies < 2) continue; // tweede pagina is losse ruis

    const perCanon = new Map<string, PaginaRij[]>();
    for (const p of g.paginas) {
      const c = canon(p.pagina);
      if (!perCanon.has(c)) perCanon.set(c, []);
      perCanon.get(c)!.push(p);
    }

    for (const varianten of perCanon.values()) {
      if (varianten.length < 2) continue;
      duplicaatRuw.push({
        zoekterm: g.query,
        impressies: varianten.reduce((s, p) => s + p.impressies, 0),
        paden: varianten.map((p) => p.pagina),
      });
    }

    if (perCanon.size >= 2) {
      // Representant per canon: de diepst-geneste URL. De oude platte vorm heeft
      // soms méér historische vertoningen en zou anders onterecht winnen.
      const diepte = (p: string) => (p.match(/\//g) || []).length;
      const representanten = [...perCanon.values()]
        .map(
          (varianten) =>
            varianten
              .slice()
              .sort((a, b) => diepte(b.pagina) - diepte(a.pagina) || b.impressies - a.impressies)[0],
        )
        .sort((a, b) => b.impressies - a.impressies);
      kannibalisatie.push({
        zoekterm: g.query,
        impressies: g.impressies,
        paginas: representanten.slice(0, 4),
      });
    }
  }
  kannibalisatie.sort((a, b) => b.impressies - a.impressies);

  // Ontdubbelen op het URL-paar zelf: dezelfde twins duiken onder meerdere
  // zoekwoorden op; hoogste vertoningen wint als label.
  const gezien = new Set<string>();
  const duplicaatUrls: typeof duplicaatRuw = [];
  for (const d of duplicaatRuw.sort((a, b) => b.impressies - a.impressies)) {
    const sleutel = d.paden.slice().sort().join("|");
    if (gezien.has(sleutel)) continue;
    gezien.add(sleutel);
    duplicaatUrls.push(d);
  }

  // Live-verificatie: alleen nog een echte dubbele-URL-kwestie als ≥2 varianten
  // 2xx zijn. Begrensd op de sterkste 24 paren om het aantal HEAD's te beperken.
  const gecheckt = await Promise.all(
    duplicaatUrls.slice(0, 24).map(async (d) => {
      const statussen = await Promise.all(d.paden.map((p) => liveStatus(p)));
      return statussen.filter(Boolean).length >= 2 ? d : null;
    }),
  );
  const duplicaatLive = gecheckt.filter((d): d is (typeof duplicaatRuw)[number] => d !== null);

  return {
    totalen,
    vorige,
    delta,
    perDag,
    topZoektermen,
    topPaginas,
    allePaginas,
    apparaten,
    landen,
    bewegers: {
      queries: bewegers(rijen, vQueryRijen, (r) => r.keys[0]),
      paginas: bewegers(paginaRijen, vPaginaRijen, (r) => pad(r.keys[0])),
    },
    geo: { vraagQueries, snippetSteal },
    kansen: { lageCtr, bijnaPagina1, kannibalisatie, duplicaatUrls: duplicaatLive },
  };
}
