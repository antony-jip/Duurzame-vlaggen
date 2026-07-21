import { describe, expect, it } from "vitest";

import { bouwDoelPrompt, bouwWerklijstPrompt, paginaSituatie } from "./prompts";
import type { DoelStand } from "./naar-nummer1";

/**
 * De prompt-generator geeft een model schrijfopdrachten op de echte site. Fout
 * advies hier kost rankings, dus de gevallen die uit elkaar gehouden moeten
 * worden staan vast in tests.
 *
 * Het geval dat dit bestand bestaat: de eerste versie noemde élke afwijkende
 * rankende pagina "verkeerde pagina" en droeg op die de term te laten loslaten.
 * Over een venster dat grotendeels op de oude WordPress-site sloeg, betekende
 * dat: verzwak de homepage op "duurzame vlaggen", de enige term die we bezitten.
 */

function doel(over: Partial<DoelStand> = {}): DoelStand {
  return {
    woord: "baniervlag",
    pagina: "/collectie/baniervlag",
    groep: "Product",
    positie: 20,
    impressies: 100,
    clicks: 0,
    rankendePagina: null,
    verkeerdePagina: false,
    stand: "zichtbaar",
    afstand: 19,
    ...over,
  };
}

describe("paginaSituatie", () => {
  it("ziet geen conflict wanneer de bedoelde pagina zelf rankt", () => {
    expect(
      paginaSituatie(doel({ rankendePagina: "/collectie/baniervlag", verkeerdePagina: false })),
    ).toBe("geen-conflict");
  });

  it("ziet geen conflict wanneer er nog niets rankt", () => {
    expect(paginaSituatie(doel({ positie: null, rankendePagina: null }))).toBe("geen-conflict");
  });

  it("herkent de homepage apart van echte zelfconcurrentie", () => {
    expect(paginaSituatie(doel({ rankendePagina: "/", verkeerdePagina: true }))).toBe("homepage");
  });

  it("noemt een andere bestaande route wél zelfconcurrentie", () => {
    expect(paginaSituatie(doel({ rankendePagina: "/materiaal", verkeerdePagina: true }))).toBe(
      "kannibalisatie",
    );
  });

  it("herkent een URL van de oude site aan het ontbreken in lib/routes.ts", () => {
    expect(
      paginaSituatie(doel({ rankendePagina: "/bestel-baniervlaggen/", verkeerdePagina: true })),
    ).toBe("oude-site");
  });

  it("negeert de trailing slash die WordPress serveerde", () => {
    expect(paginaSituatie(doel({ rankendePagina: "/materiaal/", verkeerdePagina: true }))).toBe(
      "kannibalisatie",
    );
  });
});

describe("bouwDoelPrompt", () => {
  it("draagt nooit op de homepage een term te laten loslaten", () => {
    const prompt = bouwDoelPrompt(
      doel({ woord: "pet vlaggen", pagina: "/materiaal", rankendePagina: "/", verkeerdePagina: true }),
    );
    expect(prompt).toContain("NIET los");
    expect(prompt).not.toMatch(/homepage.*moet 'm.*LOSLATEN/i);
  });

  it("draagt dat wél op bij twee bestaande pagina's", () => {
    const prompt = bouwDoelPrompt(
      doel({ pagina: "/collectie", rankendePagina: "/materiaal", verkeerdePagina: true }),
    );
    expect(prompt).toContain("zelfconcurrentie");
    expect(prompt).toContain("loslaten");
  });

  it("stuurt bij een oude WP-URL naar de redirect, niet naar copy-werk", () => {
    const prompt = bouwDoelPrompt(
      doel({ rankendePagina: "/bestel-baniervlaggen/", verkeerdePagina: true }),
    );
    expect(prompt).toContain("301");
    expect(prompt).not.toContain("zelfconcurrentie");
  });

  it("zet de meetperiode erbij zodat oude cijfers niet als stand-van-nu lezen", () => {
    const prompt = bouwDoelPrompt(doel(), { since: "2025-07-21", totEnMet: "2026-07-18" });
    expect(prompt).toContain("2025-07-21 t/m 2026-07-18");
    expect(prompt).toContain("WordPress");
  });

  it("wijst naar AGENTS.md, want de Next-conventies hier wijken af", () => {
    expect(bouwDoelPrompt(doel())).toContain("AGENTS.md");
  });
});

describe("bouwWerklijstPrompt", () => {
  const doelen = [
    doel({ woord: "duurzame vlaggen", pagina: "/", positie: 9.7, impressies: 521 }),
    doel({ woord: "baniervlag", pagina: "/collectie/baniervlag", positie: null, impressies: 0 }),
    doel({ woord: "baniervlaggen", pagina: "/collectie/baniervlag", positie: null, impressies: 0 }),
    doel({ woord: "beachvlag", pagina: "/collectie/beachvlag", positie: null, impressies: 0 }),
  ];

  it("groepeert per pagina in plaats van per zoekwoord", () => {
    const prompt = bouwWerklijstPrompt(doelen);
    // Eén kop voor de baniervlag-pagina, met beide termen eronder.
    const koppen = prompt.match(/### `\/collectie\/baniervlag`/g) ?? [];
    expect(koppen).toHaveLength(1);
    expect(prompt).toContain('"baniervlag"');
    expect(prompt).toContain('"baniervlaggen"');
  });

  it("telt pagina's en zoekwoorden allebei", () => {
    expect(bouwWerklijstPrompt(doelen)).toContain("3 pagina's, 4 zoekwoorden");
  });

  it("zet de pagina die al rankt vooraan", () => {
    const prompt = bouwWerklijstPrompt(doelen);
    expect(prompt.indexOf("### `/`")).toBeLessThan(prompt.indexOf("### `/collectie/baniervlag`"));
  });

  it("zet bij gelijke stand de pagina met de meeste termen eerst", () => {
    const prompt = bouwWerklijstPrompt(doelen);
    expect(prompt.indexOf("### `/collectie/baniervlag`")).toBeLessThan(
      prompt.indexOf("### `/collectie/beachvlag`"),
    );
  });

  it("belooft geen ranglijst die de data niet kan waarmaken", () => {
    expect(bouwWerklijstPrompt(doelen)).toContain("een hint, geen ranglijst");
  });

  it("beschermt de homepage expliciet", () => {
    expect(bouwWerklijstPrompt(doelen)).toContain("Niet de homepage verzwakken");
  });
});
