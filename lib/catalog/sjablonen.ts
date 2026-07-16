/**
 * Aanleversjablonen — kant-en-klare PDF-templates (met contour, afloop en
 * tunnel-/bandzone) die de klant als onderlegger in zijn opmaakprogramma kan
 * gebruiken. De bestanden staan in de publieke product-media bucket onder
 * `sjablonen/`; dit module weet alleen welke combinaties bestaan en bouwt de
 * URL. Plain module: veilig voor client én server.
 *
 * Nu de beachvlag: straightflag (5 maten × links/rechts × tunnel of
 * elastische band) en squareflag (3 maten × links/rechts, afwerking zit al in
 * het sjabloon), aangeleverd door Antony 2026-07-16. Nieuwe producten:
 * bestanden uploaden naar de bucket en hier een entry toevoegen.
 */

const BASE =
  "https://hyvtseexvsdpdlrzwtgi.supabase.co/storage/v1/object/public/product-media/sjablonen";

/** Straightflag-maten waarvoor sjablonen bestaan ("BxH" in cm). */
const STRAIGHT_MATEN = new Set(["40x235", "65x315", "80x220", "80x315", "90x430"]);

/** Squareflag-maten waarvoor sjablonen bestaan ("BxH" in cm). */
const SQUARE_MATEN = new Set(["75x200", "75x300", "75x400"]);

export interface SjabloonInput {
  slug: string;
  widthCm?: number;
  heightCm?: number;
  /** Gekozen opties van de regel (label → waarde), bijv. uit CartItem.options. */
  selections: Record<string, string>;
}

/**
 * URL van het aanleversjabloon voor deze configuratie, of null wanneer er
 * (nog) geen sjabloon bestaat. De twee bandkleuren delen één elastiek-sjabloon.
 */
export function sjabloonUrl(input: SjabloonInput): string | null {
  if (input.slug !== "beachvlag" || !input.widthCm || !input.heightCm) return null;

  const maat = `${input.widthCm}x${input.heightCm}`;
  const zijde =
    (input.selections["Mastzijde"] ?? "Links").toLowerCase() === "rechts"
      ? "rechts"
      : "links";

  if (SQUARE_MATEN.has(maat)) {
    return `${BASE}/beachvlag/squareflag-${maat}-${zijde}.pdf`;
  }

  if (!STRAIGHT_MATEN.has(maat)) return null;

  const afwerking = (input.selections["Gewenste afwerking"] ?? "").toLowerCase();
  const soort = afwerking.includes("band") ? "elastische-band" : "tunnel";

  return `${BASE}/beachvlag/straightflag-${maat}-${zijde}-${soort}.pdf`;
}
