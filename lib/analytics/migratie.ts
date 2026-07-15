import "server-only";
import { allePublicRoutes } from "@/lib/routes";
import type { PaginaRij } from "./zoekverkeer";

/**
 * Migratie-risico — uniek voor deze site.
 *
 * De nieuwe Next-site vervangt een lévende WordPress-site op hetzelfde domein.
 * Search Console kent dus de URL's van de OUDE site. Elke oude URL die nu
 * verkeer trekt en straks geen tegenhanger heeft, verliest bij livegang zijn
 * ranking, tenzij er een 301 op staat.
 *
 * Deze check is bewust een pure set-vergelijking tussen "paden met clicks in
 * GSC" en "publieke routes van de nieuwe site" (`lib/routes.ts`). Er wordt géén
 * redirect-map verondersteld: die staat nog niet in `next.config.ts`, en juist
 * dát is wat dit blok zichtbaar maakt.
 */

/** Trailing slash weg + lowercase. WP serveert `/materiaal/`, Next `/materiaal`. */
function normaliseer(p: string): string {
  const schoon = p.replace(/\/+$/, "").toLowerCase();
  return schoon === "" ? "/" : schoon;
}

/**
 * Voorstel-redirects, afgeleid uit `docs/CONTENT-MAP.md` (de REST-inventarisatie
 * van de WP-site). Dit is een SUGGESTIE voor de redirect-map, geen weergave van
 * wat er live staat. `null` = geen voor de hand liggende tegenhanger, hier moet
 * een besluit worden genomen.
 */
const VOORSTEL: Record<string, string | null> = {
  "/bestel-baniervlaggen": "/collectie/baniervlag",
  "/bestel-mastvlaggen": "/collectie/mastvlag",
  "/bestel-beachvlaggen": "/collectie/beachvlag",
  "/bestel-gevelvlaggen": "/collectie/gevelvlag",
  "/bestel-vlaggenmast": "/collectie/vlaggenmast",
  "/bestel": "/collectie",
  "/configurator": "/collectie",
  "/confi-vlaggen": "/collectie",
  "/producten": "/collectie",
  "/shop": "/collectie",
  "/offerte-aanvragen": "/contact",
  "/about": "/over-ons",
  "/blog": "/kennisbank",
  "/kennisbank/csrd-comlpiance": "/kennisbank/csrd-compliance", // typfout in WP-slug
  "/csrd-microplastics-probleem": "/kennisbank/microplastics",
  "/cart": "/winkelwagen",
  "/checkout": "/afrekenen",
  "/my-account": "/account",
  "/bestellingen": "/account",
  "/samples": null,
  "/bereken-besparing": null,
  "/bereken-besparing-2": null,
};

export interface MigratieRij {
  pagina: string;
  clicks: number;
  impressies: number;
  /** Voorgestelde bestemming, of null wanneer er een besluit nodig is. */
  voorstel: string | null;
  /** Staat er een voorstel klaar, of moeten we dit nog uitzoeken? */
  bekend: boolean;
}

export interface Migratie {
  /** Oude URL's met verkeer die straks nergens landen. */
  risico: MigratieRij[];
  /** Som van de clicks die op het spel staan. */
  clicksOpSpel: number;
  /** Hoeveel van die clicks al een voorgestelde bestemming hebben. */
  clicksMetVoorstel: number;
}

/**
 * @param paginas  Alle GSC-pagina-rijen over het venster (niet alleen de top-10).
 */
export function bepaalMigratieRisico(paginas: PaginaRij[]): Migratie {
  const bestaat = new Set(allePublicRoutes().map(normaliseer));

  const risico: MigratieRij[] = [];
  for (const p of paginas) {
    if (p.clicks <= 0) continue; // zonder clicks staat er niets op het spel
    const norm = normaliseer(p.pagina);
    if (bestaat.has(norm)) continue; // heeft een tegenhanger, prima

    const heeftVoorstel = Object.prototype.hasOwnProperty.call(VOORSTEL, norm);
    risico.push({
      pagina: p.pagina,
      clicks: p.clicks,
      impressies: p.impressies,
      voorstel: heeftVoorstel ? VOORSTEL[norm] : null,
      bekend: heeftVoorstel && VOORSTEL[norm] !== null,
    });
  }

  risico.sort((a, b) => b.clicks - a.clicks || b.impressies - a.impressies);

  return {
    risico,
    clicksOpSpel: risico.reduce((s, r) => s + r.clicks, 0),
    clicksMetVoorstel: risico.filter((r) => r.bekend).reduce((s, r) => s + r.clicks, 0),
  };
}
