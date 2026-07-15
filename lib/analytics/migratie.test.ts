import { describe, it, expect } from "vitest";
import { bepaalMigratieRisico } from "./migratie";
import type { PaginaRij } from "./zoekverkeer";

/**
 * De migratie-check vergelijkt GSC-paden (de WP-site) met de routes van de
 * nieuwe site. Hier wordt getoetst dat we geen vals alarm slaan op pagina's die
 * gewoon blijven bestaan, en niets missen dat straks 404't.
 */

function rij(pagina: string, clicks: number, impressies = clicks * 10): PaginaRij {
  return { pagina, clicks, impressies, ctrPct: 10, positie: 5 };
}

describe("bepaalMigratieRisico", () => {
  it("meldt een WP-bestelpagina als risico, met het juiste voorstel", () => {
    const r = bepaalMigratieRisico([rij("/bestel-mastvlaggen/", 120)]);

    expect(r.risico).toHaveLength(1);
    expect(r.risico[0]).toMatchObject({
      pagina: "/bestel-mastvlaggen/",
      voorstel: "/collectie/mastvlag",
      bekend: true,
    });
    expect(r.clicksOpSpel).toBe(120);
    expect(r.clicksMetVoorstel).toBe(120);
  });

  it("negeert pagina's die in de nieuwe site blijven bestaan", () => {
    const r = bepaalMigratieRisico([
      rij("/materiaal", 50),
      rij("/csrd", 30),
      rij("/collectie/baniervlag", 80),
      rij("/kennisbank/microplastics", 10),
    ]);

    expect(r.risico).toEqual([]);
    expect(r.clicksOpSpel).toBe(0);
  });

  it("ziet de WP-trailing-slash als dezelfde pagina", () => {
    // WordPress serveert /materiaal/, Next serveert /materiaal. Zonder
    // normalisatie zou elke WP-URL onterecht als risico opduiken.
    const r = bepaalMigratieRisico([rij("/materiaal/", 50), rij("/over-ons/", 20)]);

    expect(r.risico).toEqual([]);
  });

  it("markeert een pagina zonder tegenhanger als 'besluit nodig'", () => {
    const r = bepaalMigratieRisico([rij("/samples/", 40), rij("/onbekende-pagina/", 5)]);

    expect(r.risico.map((x) => x.bekend)).toEqual([false, false]);
    expect(r.clicksOpSpel).toBe(45);
    // Niets heeft een bestemming, dus er valt nog niets te redirecten.
    expect(r.clicksMetVoorstel).toBe(0);
  });

  it("laat pagina's zonder clicks buiten beschouwing", () => {
    // Vertoningen zonder clicks zetten geen verkeer op het spel.
    const r = bepaalMigratieRisico([rij("/bestel-beachvlaggen/", 0, 500)]);

    expect(r.risico).toEqual([]);
  });

  it("sorteert op clicks, zodat het duurste verlies bovenaan staat", () => {
    const r = bepaalMigratieRisico([
      rij("/bestel-gevelvlaggen/", 10),
      rij("/offerte-aanvragen/", 200),
      rij("/bestel-baniervlaggen/", 75),
    ]);

    expect(r.risico.map((x) => x.pagina)).toEqual([
      "/offerte-aanvragen/",
      "/bestel-baniervlaggen/",
      "/bestel-gevelvlaggen/",
    ]);
  });

  it("herkent de typfout-slug uit de WP-kennisbank", () => {
    // /kennisbank/csrd-comlpiance/ (sic) rankt en moet naar de correcte slug.
    const r = bepaalMigratieRisico([rij("/kennisbank/csrd-comlpiance/", 15)]);

    expect(r.risico[0]).toMatchObject({
      voorstel: "/kennisbank/csrd-compliance",
      bekend: true,
    });
  });
});
