import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProboLijst } from "./ProboLijst";

// De beachvlag uit de melding van 10 nov 2026: Samenstelling stond twee keer.
const CONFIG = {
  code: "beachflag-square",
  sizeLabel: "Square Small — 75 × 200 cm",
  options: [{ code: "amount", value: 1 }, { code: "flag-ciclo" }, { code: "75x200cm" }, { code: "left" }, { code: "flag-stick-bag-deluxe" }],
  unmapped: [{ label: "Samenstelling", value: "Alleen vlag" }],
  selections: { Mastzijde: "Links", Samenstelling: "Alleen vlag" },
};

describe("ProboLijst", () => {
  it("toont Samenstelling één keer: de keuze van de klant", () => {
    const html = renderToStaticMarkup(<ProboLijst configuration={CONFIG} aantal={1} />);
    expect(html).not.toContain("vlag, stok en draagtas");
    expect(html).not.toContain("flag-stick-bag-deluxe");
    expect(html).toContain("Alleen vlag");
    expect(html).toContain("Mastzijde");
    expect(html).toContain("75x200cm");
  });
});
