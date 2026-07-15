"use server";

/**
 * Server actions voor de analytics-pagina.
 *
 * De auth-gate op de layout beschermt het renderen, niet deze acties: elke actie
 * her-verifieert de sessie zelf via requireAdminUser(). Zie app/admin/auth.ts.
 */

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "../../auth";
import { legKansActieVast } from "@/lib/analytics/kans-acties";
import type { KansBron, KansStatus } from "@/lib/db/types";

const GELDIGE_STATUS: KansStatus[] = ["opgepakt", "benut"];
const GELDIGE_BRON: KansBron[] = ["doel", "kans"];

/**
 * Markeer een kans als opgepakt of benut. Schrijft een nieuwe rij in de
 * geschiedenis — we werken nooit een bestaande rij bij, zodat je later kunt zien
 * wanneer je wat deed en of het hielp.
 */
export async function markeerKans(formData: FormData): Promise<void> {
  await requireAdminUser();

  const sleutel = String(formData.get("sleutel") ?? "").trim();
  const status = String(formData.get("status") ?? "") as KansStatus;
  const bron = String(formData.get("bron") ?? "doel") as KansBron;
  const positieRuw = formData.get("positie");
  const impressiesRuw = formData.get("impressies");

  if (!sleutel) throw new Error("Geen zoekwoord meegegeven.");
  if (!GELDIGE_STATUS.includes(status)) throw new Error(`Onbekende status: ${status}`);
  if (!GELDIGE_BRON.includes(bron)) throw new Error(`Onbekende bron: ${bron}`);

  // De stand van dat moment vastleggen, zodat de effectmeting later een
  // ijkpunt heeft zonder de snapshots te hoeven uitvlooien.
  const positieBij = positieRuw !== null && positieRuw !== "" ? Number(positieRuw) : null;
  const impressiesBij =
    impressiesRuw !== null && impressiesRuw !== "" ? Number(impressiesRuw) : null;

  await legKansActieVast({
    sleutel,
    bron,
    status,
    positieBij: Number.isFinite(positieBij) ? positieBij : null,
    impressiesBij: Number.isFinite(impressiesBij) ? impressiesBij : null,
  });

  revalidatePath("/admin/analytics");
}
