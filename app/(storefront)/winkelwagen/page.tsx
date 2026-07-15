import { redirect } from "next/navigation";

/**
 * De winkelmand is samengevoegd met afrekenen.
 *
 * Ze toonden vrijwel hetzelfde — dezelfde regels, dezelfde aantalkiezer,
 * dezelfde mockup, hetzelfde subtotaal — dus de mand was een klik die de klant
 * niets gaf. Alles staat nu op /afrekenen: daar bewerk je je bestelling én
 * reken je af.
 *
 * Deze route blijft bestaan als doorverwijzing: het mandje in de header, oude
 * bookmarks en externe links wijzen er nog naar.
 */
export default function WinkelwagenPage() {
  redirect("/afrekenen");
}
