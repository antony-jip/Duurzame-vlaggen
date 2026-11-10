import { describe, expect, it } from "vitest";
import { optiesZonderDubbel } from "./probo-lijst";

// De order uit de melding: beachvlag 75×200, klant koos "Alleen vlag", de
// oude mapping stuurde toch de volledige set mee.
const OPTIES = [
  { code: "amount", value: 1 },
  { code: "flag-ciclo" },
  { code: "75x200cm" },
  { code: "left" },
  { code: "flag-stick-bag-deluxe" },
];

describe("optiesZonderDubbel", () => {
  it("laat de Probo-samenstelling weg als de keuze van de klant bij Zelf regelen staat", () => {
    const zichtbaar = optiesZonderDubbel(OPTIES, [{ label: "Samenstelling" }]);
    expect(zichtbaar.map((o) => o.code)).toEqual(["amount", "flag-ciclo", "75x200cm", "left"]);
  });

  it("zonder Zelf regelen blijft alles staan", () => {
    expect(optiesZonderDubbel(OPTIES, [])).toEqual(OPTIES);
  });

  it("een ander onderwerp bij Zelf regelen raakt de opties niet", () => {
    expect(optiesZonderDubbel(OPTIES, [{ label: "Accessoires" }])).toEqual(OPTIES);
  });
});
