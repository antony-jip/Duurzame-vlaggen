import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { KansBron, KansStatus, SeoKansActieRow } from "@/lib/db/types";

/**
 * De benut-lus: wat hebben we met een kans gedaan?
 *
 * Bewust gescheiden van de GSC-data. Google levert feiten; deze tabel legt vast
 * wat WIJ besloten. Er wordt alleen geschreven op een expliciete klik van de
 * gebruiker — nooit afgeleid uit de cijfers, nooit stilzwijgend bijgewerkt.
 *
 * Meerdere rijen per sleutel zijn de bedoeling: dat is de geschiedenis. De
 * nieuwste rij is de huidige stand.
 */

export interface KansStand {
  status: KansStatus;
  /** Positie op het moment dat de kans werd vastgelegd. */
  positieBij: number | null;
  aangemaaktOp: string;
  benutOp: string | null;
}

/**
 * Huidige stand per sleutel. Eén query voor alle rijen; de nieuwste per sleutel
 * wint. Bij enkele honderden rijen is dat goedkoper en simpeler dan een
 * DISTINCT ON-view, en de tabel groeit met hooguit een paar rijen per week.
 */
export async function haalKansStanden(): Promise<Map<string, KansStand>> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("seo_kans_acties")
    .select("sleutel, status, positie_bij, aangemaakt_op, benut_op")
    .order("aangemaakt_op", { ascending: false });

  if (error) throw new Error(`Kansstanden ophalen mislukt: ${error.message}`);

  const standen = new Map<string, KansStand>();
  for (const rij of data ?? []) {
    // Gesorteerd op nieuwste eerst, dus de eerste die we zien wint.
    if (standen.has(rij.sleutel)) continue;
    standen.set(rij.sleutel, {
      status: rij.status,
      positieBij: rij.positie_bij,
      aangemaaktOp: rij.aangemaakt_op,
      benutOp: rij.benut_op,
    });
  }
  return standen;
}

export interface LegVastInput {
  sleutel: string;
  bron?: KansBron;
  status: KansStatus;
  positieBij?: number | null;
  impressiesBij?: number | null;
  notitie?: string | null;
}

/** Nieuwe rij in de geschiedenis. Aanroepen vanuit een server action. */
export async function legKansActieVast(input: LegVastInput): Promise<SeoKansActieRow> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("seo_kans_acties")
    .insert({
      sleutel: input.sleutel,
      bron: input.bron ?? "doel",
      status: input.status,
      positie_bij: input.positieBij ?? null,
      impressies_bij: input.impressiesBij ?? null,
      notitie: input.notitie ?? null,
      benut_op: input.status === "benut" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) throw new Error(`Kansactie vastleggen mislukt: ${error.message}`);
  return data;
}

/**
 * Geschiedenis van één sleutel — voedt later de effectmeting ("stond op 9.7 toen
 * je 'm benutte, staat nu op 4.2").
 */
export async function haalKansGeschiedenis(sleutel: string): Promise<SeoKansActieRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("seo_kans_acties")
    .select("*")
    .eq("sleutel", sleutel)
    .order("aangemaakt_op", { ascending: false });

  if (error) throw new Error(`Geschiedenis ophalen mislukt: ${error.message}`);
  return data ?? [];
}
