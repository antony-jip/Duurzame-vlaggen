import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { gscQuery } from "./gsc";
import { pad } from "./zoekverkeer";
import type { GscDimensie } from "@/lib/db/types";

/**
 * Dagelijkse Search Console-snapshot.
 *
 * Waarom eigen opslag terwijl GSC de data al heeft: GSC bewaart 16 maanden,
 * toont geen trend-deltas, en kan niet zeggen "dit zoekwoord is nieuw sinds
 * gisteren". Daar is een eigen tijdlijn voor nodig.
 *
 * Rollend venster i.p.v. alleen gisteren: Google finaliseert data 2-3 dagen te
 * laat en vult met terugwerkende kracht aan. We halen daarom de laatste
 * VENSTER_DAGEN opnieuw op en upserten; de composite PK zorgt dat late
 * correcties zichzelf overschrijven. Twee keer draaien op één dag is gratis.
 */

const DAG_MS = 86_400_000;
const LAG_DAGEN = 3;
const VENSTER_DAGEN = 10;
const MARKT = "nl-NL";

function isoDag(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface SnapshotResultaat {
  since: string;
  totEnMet: string;
  queries: number;
  paginas: number;
}

export async function draaiSnapshot(): Promise<SnapshotResultaat> {
  const eind = new Date(Date.now() - LAG_DAGEN * DAG_MS);
  const start = new Date(eind.getTime() - (VENSTER_DAGEN - 1) * DAG_MS);
  const since = isoDag(start);
  const totEnMet = isoDag(eind);

  // Per dag ophalen: zonder de date-dimensie krijgen we één geaggregeerde rij
  // over het hele venster en kunnen we geen dag-op-dag-tijdlijn opbouwen.
  const [queryRijen, paginaRijen] = await Promise.all([
    gscQuery({
      startDate: since,
      endDate: totEnMet,
      dimensions: ["date", "query"],
      rowLimit: 25000,
    }),
    gscQuery({
      startDate: since,
      endDate: totEnMet,
      dimensions: ["date", "page"],
      rowLimit: 25000,
    }),
  ]);

  const rijen = [
    ...queryRijen.map((r) => ({
      dag: r.keys[0],
      markt: MARKT,
      dimensie: "query" as GscDimensie,
      sleutel: r.keys[1],
      clicks: r.clicks,
      impressies: r.impressions,
      ctr: r.ctr,
      positie: r.position,
    })),
    ...paginaRijen.map((r) => ({
      dag: r.keys[0],
      markt: MARKT,
      dimensie: "pagina" as GscDimensie,
      sleutel: pad(r.keys[1]),
      clicks: r.clicks,
      impressies: r.impressions,
      ctr: r.ctr,
      positie: r.position,
    })),
  ];

  if (rijen.length === 0) {
    return { since, totEnMet, queries: 0, paginas: 0 };
  }

  const supabase = createSupabaseAdminClient();

  // In blokken: één upsert van 25k rijen loopt tegen payload-limieten aan.
  const BLOK = 500;
  for (let i = 0; i < rijen.length; i += BLOK) {
    const { error } = await supabase
      .from("gsc_snapshots")
      .upsert(rijen.slice(i, i + BLOK), { onConflict: "dag,markt,dimensie,sleutel" });
    if (error) {
      throw new Error(`Snapshot-upsert mislukt op blok ${i / BLOK}: ${error.message}`);
    }
  }

  return {
    since,
    totEnMet,
    queries: queryRijen.length,
    paginas: paginaRijen.length,
  };
}

/**
 * Zoekwoorden die vandaag wél vertoningen hebben en in de `sinds`-dagen dáárvoor
 * niet. Dit is het "nieuwe kansen"-signaal: termen waarop Google je voor het
 * eerst laat zien.
 */
export async function haalNieuweZoekwoorden(sinds = 30): Promise<
  { sleutel: string; impressies: number; positie: number; eersteDag: string }[]
> {
  const supabase = createSupabaseAdminClient();
  const grens = isoDag(new Date(Date.now() - sinds * DAG_MS));

  const { data, error } = await supabase
    .from("gsc_snapshots")
    .select("dag, sleutel, impressies, positie")
    .eq("dimensie", "query")
    .gte("dag", isoDag(new Date(Date.now() - 400 * DAG_MS)))
    .order("dag", { ascending: true });

  if (error) throw new Error(`Nieuwe zoekwoorden ophalen mislukt: ${error.message}`);

  // Eerste dag per zoekwoord bepalen; nieuw = eerste keer gezien binnen `sinds`.
  const eerste = new Map<string, string>();
  const laatste = new Map<string, { impressies: number; positie: number }>();
  for (const r of data ?? []) {
    if (!eerste.has(r.sleutel)) eerste.set(r.sleutel, r.dag);
    laatste.set(r.sleutel, { impressies: r.impressies, positie: r.positie });
  }

  const nieuw: { sleutel: string; impressies: number; positie: number; eersteDag: string }[] = [];
  for (const [sleutel, dag] of eerste) {
    if (dag < grens) continue;
    const l = laatste.get(sleutel);
    if (!l) continue;
    nieuw.push({
      sleutel,
      impressies: l.impressies,
      positie: Math.round(l.positie * 10) / 10,
      eersteDag: dag,
    });
  }

  return nieuw.sort((a, b) => b.impressies - a.impressies);
}
