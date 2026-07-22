import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  STATIC_ROUTES,
  KENNISBANK_SLUGS,
  allePublicRoutes,
} from "@/lib/routes";

/**
 * Elke route in de sitemap moet een echte pagina hebben.
 *
 * Een sitemap die naar een 404 verwijst is erger dan geen sitemap: Google
 * crawlt hem, vindt niets, en verliest vertrouwen in de rest van de opgave.
 * Deze test vangt de klassieke fout van een pagina hernoemen zonder de route
 * bij te werken (en andersom).
 */
const APP = path.join(__dirname, "..", "app", "(storefront)");

function heeftPagina(route: string): boolean {
  const rel = route === "/" ? "" : route.slice(1);
  return existsSync(path.join(APP, rel, "page.tsx"));
}

describe("routes", () => {
  it("heeft voor elke statische route een page.tsx", () => {
    const missend = STATIC_ROUTES.map((r) => r.path).filter(
      (p) => !heeftPagina(p),
    );
    expect(missend).toEqual([]);
  });

  it("heeft voor elk kennisbank-artikel een page.tsx", () => {
    const missend = KENNISBANK_SLUGS.filter(
      (s) => !heeftPagina(`/kennisbank/${s}`),
    );
    expect(missend).toEqual([]);
  });

  it("bevat geen dubbele paden", () => {
    const alle = allePublicRoutes();
    expect(new Set(alle).size).toBe(alle.length);
  });
});
