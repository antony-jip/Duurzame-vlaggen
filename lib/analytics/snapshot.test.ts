import { describe, expect, it } from "vitest";

import { verdichtRijen, type SnapshotRij } from "./snapshot";

/**
 * Gevonden bij de eerste backfill: Postgres liet het hele blok vallen met
 * "ON CONFLICT DO UPDATE command cannot affect row a second time". Oorzaak is
 * dat `pad()` www en non-www op hetzelfde pad afbeeldt, waardoor GSC-rijen die
 * apart binnenkomen dezelfde sleutel krijgen. Dat trof niet alleen de backfill
 * maar ook de dagelijkse cron.
 */

function rij(over: Partial<SnapshotRij> = {}): SnapshotRij {
  return {
    dag: "2026-07-01",
    markt: "nl-NL",
    dimensie: "pagina",
    sleutel: "/",
    clicks: 0,
    impressies: 0,
    ctr: 0,
    positie: 10,
    ...over,
  };
}

describe("verdichtRijen", () => {
  it("laat unieke rijen ongemoeid", () => {
    const uit = verdichtRijen([rij({ sleutel: "/" }), rij({ sleutel: "/collectie" })]);
    expect(uit).toHaveLength(2);
  });

  it("voegt www en non-www op dezelfde dag samen", () => {
    const uit = verdichtRijen([
      rij({ clicks: 2, impressies: 100, positie: 10 }),
      rij({ clicks: 1, impressies: 100, positie: 20 }),
    ]);
    expect(uit).toHaveLength(1);
    expect(uit[0].clicks).toBe(3);
    expect(uit[0].impressies).toBe(200);
  });

  it("weegt de positie op vertoningen, niet plat gemiddeld", () => {
    // Plat gemiddelde zou 5.5 geven; gewogen hoort dicht bij 9 te liggen.
    const uit = verdichtRijen([
      rij({ impressies: 1, positie: 2 }),
      rij({ impressies: 499, positie: 9 }),
    ]);
    expect(uit[0].positie).toBeCloseTo(8.986, 2);
  });

  it("herberekent de CTR uit het samengevoegde totaal", () => {
    const uit = verdichtRijen([
      rij({ clicks: 1, impressies: 100, ctr: 0.01 }),
      rij({ clicks: 3, impressies: 100, ctr: 0.03 }),
    ]);
    expect(uit[0].ctr).toBeCloseTo(0.02, 5);
  });

  it("houdt dezelfde sleutel op verschillende dagen apart", () => {
    const uit = verdichtRijen([rij({ dag: "2026-07-01" }), rij({ dag: "2026-07-02" })]);
    expect(uit).toHaveLength(2);
  });

  it("houdt query en pagina apart, ook bij gelijke sleutel", () => {
    const uit = verdichtRijen([
      rij({ dimensie: "query", sleutel: "vlaggen" }),
      rij({ dimensie: "pagina", sleutel: "vlaggen" }),
    ]);
    expect(uit).toHaveLength(2);
  });

  it("deelt niet door nul als er geen vertoningen zijn", () => {
    const uit = verdichtRijen([rij({ impressies: 0, positie: 7 }), rij({ impressies: 0 })]);
    expect(uit[0].positie).toBe(7);
    expect(uit[0].ctr).toBe(0);
  });

  it("levert een lege lijst voor lege invoer", () => {
    expect(verdichtRijen([])).toEqual([]);
  });
});
