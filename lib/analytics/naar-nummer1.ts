import "server-only";
import { getAllProducts } from "@/lib/catalog/products";
import { gscQuery } from "./gsc";
import { pad } from "./zoekverkeer";

/**
 * Naar #1 — de kansen-meter.
 *
 * De rest van het dashboard kijkt terug ("wat deed het vorige maand"). Dit blok
 * kijkt vooruit: voor elk zoekwoord dat we WILLEN winnen, hoe ver zijn we en
 * welke pagina moet het pakken?
 *
 * Twee soorten kansen, bewust in één lijst:
 *  1. We ranken al  → afstand tot positie 1 is de kans.
 *  2. We ranken niet → witruimte. Geen enkele vertoning, terwijl we het product
 *     wél verkopen. Dit is het grootste blok en het meest onzichtbaar in een
 *     standaard-dashboard, dat alleen toont wat al meet.
 *
 * Venster: vast 12 maanden, niet de range-kiezer. Dit is een strategische stand,
 * geen periodemeting — en met weinig data zou 28 dagen bijna alles op "niet in
 * beeld" zetten terwijl er wel degelijk historie is.
 */

const DAG_MS = 86_400_000;

/** Doelwoord + de pagina die 'm hoort te winnen. */
export interface Doel {
  woord: string;
  pagina: string;
  /** Waarom dit doel: bepaalt de groepering in de UI. */
  groep: "Categorie" | "Product" | "Doelgroep" | "Materiaal & CSRD";
}

/**
 * De doelenlijst. Afgeleid van de catalogus (elk product hoort zijn eigen naam te
 * winnen) plus de commerciële en inhoudelijke termen die bij deze niche horen.
 *
 * Bewust handgeschreven en niet gegenereerd: welk woord bij welke pagina hoort is
 * een redactionele keuze, geen mechanische. Uitbreiden mag — dit is de plek.
 */
function bouwDoelen(): Doel[] {
  const doelen: Doel[] = [
    // Categorie — de kern. Hier zit de vraag én de omzet.
    { woord: "duurzame vlaggen", pagina: "/", groep: "Categorie" },
    { woord: "duurzame vlag", pagina: "/", groep: "Categorie" },
    { woord: "biologisch afbreekbare vlaggen", pagina: "/", groep: "Categorie" },
    { woord: "duurzame vlaggen bedrukken", pagina: "/collectie", groep: "Categorie" },
    { woord: "duurzame vlaggen drukken", pagina: "/collectie", groep: "Categorie" },
    { woord: "vlaggen bedrukken", pagina: "/collectie", groep: "Categorie" },
    { woord: "vlaggen laten maken", pagina: "/collectie", groep: "Categorie" },

    // Doelgroep — de landingspagina's die er al zijn.
    { woord: "bedrijfsvlag", pagina: "/voor-bedrijven", groep: "Doelgroep" },
    { woord: "bedrijfsvlaggen", pagina: "/voor-bedrijven", groep: "Doelgroep" },
    { woord: "vlaggen voor gemeenten", pagina: "/voor-gemeenten", groep: "Doelgroep" },
    { woord: "vlaggen vereniging", pagina: "/voor-verenigingen", groep: "Doelgroep" },

    // Materiaal & CSRD — de inhoudelijke hoek waar dit merk uniek in is.
    { woord: "vlaggen microplastics", pagina: "/kennisbank/microplastics", groep: "Materiaal & CSRD" },
    { woord: "microplastics vlaggen", pagina: "/kennisbank/microplastics", groep: "Materiaal & CSRD" },
    { woord: "csrd vlaggen", pagina: "/csrd", groep: "Materiaal & CSRD" },
    { woord: "pet vlaggen", pagina: "/materiaal", groep: "Materiaal & CSRD" },
    { woord: "afbreekbaar polyester", pagina: "/materiaal", groep: "Materiaal & CSRD" },
  ];

  // Product — elk vlagtype hoort zijn eigen naam te winnen, enkelvoud én meervoud.
  // Het meervoud staat expliciet per slug: een regeltje als "+gen" maakt van
  // vlaggenmast "vlaggenmastgen".
  const MEERVOUD: Record<string, string> = {
    baniervlag: "baniervlaggen",
    mastvlag: "mastvlaggen",
    beachvlag: "beachvlaggen",
    gevelvlag: "gevelvlaggen",
    vlaggenmast: "vlaggenmasten",
  };
  for (const p of getAllProducts()) {
    const slug = `/collectie/${p.slug}`;
    doelen.push({ woord: p.slug, pagina: slug, groep: "Product" });
    const meervoud = MEERVOUD[p.slug];
    if (meervoud) doelen.push({ woord: meervoud, pagina: slug, groep: "Product" });
  }
  // Handmatige varianten die niet uit de slug volgen.
  doelen.push(
    { woord: "beachflag", pagina: "/collectie/beachvlag", groep: "Product" },
    { woord: "beachflags", pagina: "/collectie/beachvlag", groep: "Product" },
    { woord: "vlaggenmast kopen", pagina: "/collectie/vlaggenmast", groep: "Product" },
    { woord: "duurzame vlaggenstokken", pagina: "/collectie/vlaggenmast", groep: "Product" },
  );

  // Ontdubbelen op woord; het eerste doel wint.
  const gezien = new Set<string>();
  return doelen.filter((d) => {
    const k = d.woord.toLowerCase();
    if (gezien.has(k)) return false;
    gezien.add(k);
    return true;
  });
}

export type Stand = "top3" | "pagina1" | "zichtbaar" | "onzichtbaar";

export interface DoelStand extends Doel {
  /** Impressie-gewogen positie, of null wanneer we niet voorkomen. */
  positie: number | null;
  impressies: number;
  clicks: number;
  /** Pagina die er nu voor rankt — kan een ándere zijn dan `pagina`. */
  rankendePagina: string | null;
  /** Rankt er een andere pagina dan bedoeld? Dan concurreer je met jezelf. */
  verkeerdePagina: boolean;
  stand: Stand;
  /** Posities te gaan tot #1. Null wanneer we niet in beeld zijn. */
  afstand: number | null;
}

export interface Nummer1Meter {
  doelen: DoelStand[];
  /** Aantallen per stand — voedt de meter. */
  telling: Record<Stand, number>;
  totaal: number;
  /** Vertoningen die nu al binnenkomen op doelwoorden. */
  impressiesOpDoelen: number;
  /** Venster waarover gemeten is. */
  since: string;
  totEnMet: string;
}

function standVan(positie: number | null): Stand {
  if (positie === null) return "onzichtbaar";
  if (positie <= 3) return "top3";
  if (positie <= 10) return "pagina1";
  return "zichtbaar";
}

function normaliseer(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function haalNummer1Meter(): Promise<Nummer1Meter> {
  const eind = new Date(Date.now() - 3 * DAG_MS);
  const start = new Date(eind.getTime() - 365 * DAG_MS);
  const since = start.toISOString().slice(0, 10);
  const totEnMet = eind.toISOString().slice(0, 10);

  // TWEE queries, bewust.
  //
  // `query` alleen → Google's eigen aggregatie op property-niveau. Dit is het
  // cijfer dat ook in de Search Console-UI staat, en dus het cijfer dat we tonen.
  // `query+page`   → alleen om te bepalen wélke pagina er nu voor rankt.
  //
  // Ze door elkaar halen levert verkeerde posities op: met de page-dimensie erbij
  // rekent GSC per pagina, waardoor een term met meerdere rankende pagina's een
  // heel andere gemiddelde positie krijgt (gemeten: 14.9 i.p.v. 9.7).
  const [queryRijen, queryPageRijen] = await Promise.all([
    gscQuery({ startDate: since, endDate: totEnMet, dimensions: ["query"], rowLimit: 5000 }),
    gscQuery({
      startDate: since,
      endDate: totEnMet,
      dimensions: ["query", "page"],
      rowLimit: 5000,
    }),
  ]);

  interface Agg {
    impressies: number;
    clicks: number;
    positie: number;
  }
  const perWoord = new Map<string, Agg>();
  for (const r of queryRijen) {
    perWoord.set(normaliseer(r.keys[0]), {
      impressies: r.impressions,
      clicks: r.clicks,
      positie: Math.round(r.position * 10) / 10,
    });
  }

  // Dominante pagina per zoekwoord (op vertoningen).
  const paginaPerWoord = new Map<string, Map<string, number>>();
  for (const r of queryPageRijen) {
    const w = normaliseer(r.keys[0]);
    const m = paginaPerWoord.get(w) ?? new Map<string, number>();
    const p = pad(r.keys[1]);
    m.set(p, (m.get(p) ?? 0) + r.impressions);
    paginaPerWoord.set(w, m);
  }

  const doelen: DoelStand[] = bouwDoelen().map((d) => {
    const sleutel = normaliseer(d.woord);
    // Exacte match, geen substring. "vlaggen bedrukken" mag niet de cijfers van
    // "duurzame vlaggen bedrukken" lenen: dat zijn twee doelen met eigen vraag.
    const agg = perWoord.get(sleutel);

    if (!agg || agg.impressies === 0) {
      return {
        ...d,
        positie: null,
        impressies: 0,
        clicks: 0,
        rankendePagina: null,
        verkeerdePagina: false,
        stand: "onzichtbaar" as Stand,
        afstand: null,
      };
    }

    const rankendePagina =
      [...(paginaPerWoord.get(sleutel)?.entries() ?? [])].sort((a, b) => b[1] - a[1])[0]?.[0] ??
      null;
    // Trailing slash negeren: WP serveert /materiaal/, Next /materiaal.
    const schoon = (p: string) => p.replace(/\/+$/, "") || "/";

    return {
      ...d,
      positie: agg.positie,
      impressies: agg.impressies,
      clicks: agg.clicks,
      rankendePagina,
      verkeerdePagina: rankendePagina ? schoon(rankendePagina) !== schoon(d.pagina) : false,
      stand: standVan(agg.positie),
      afstand: Math.round((agg.positie - 1) * 10) / 10,
    };
  });

  // Sorteer op kans: eerst wat rankt (dichtst bij #1), dan witruimte op vraag.
  doelen.sort((a, b) => {
    if (a.positie === null && b.positie === null) return b.impressies - a.impressies;
    if (a.positie === null) return 1;
    if (b.positie === null) return -1;
    return a.positie - b.positie;
  });

  const telling: Record<Stand, number> = {
    top3: 0,
    pagina1: 0,
    zichtbaar: 0,
    onzichtbaar: 0,
  };
  for (const d of doelen) telling[d.stand]++;

  return {
    doelen,
    telling,
    totaal: doelen.length,
    impressiesOpDoelen: doelen.reduce((s, d) => s + d.impressies, 0),
    since,
    totEnMet,
  };
}
