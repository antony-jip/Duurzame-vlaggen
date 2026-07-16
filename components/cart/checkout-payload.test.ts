import { describe, expect, it } from "vitest";
import { toCheckoutLines, type CartItem } from "./types";

/**
 * Regressietest: de checkout-payload blijft klein.
 *
 * Aanleiding (2026-07-15): de afrekenpagina serialiseerde de hele winkelmand
 * naar het verborgen `items`-veld met `JSON.stringify(items)`. Daar zit
 * `previewUrl` in — een base64-PNG van het ontwerp, tot 3MB
 * (`INLINE_PREVIEW_MAX_BYTES` in ArtworkUploadModal). Dat veld is display-only:
 * `checkoutAction` leest het nooit.
 *
 * Next kapt server-action-bodies af op 1MB (node_modules/next/dist/docs,
 * 01-app/02-guides/server-actions) en `next.config` verhoogt dat niet. Eén
 * bestelling met een foto-zware PDF gaf daardoor een harde 500 op "Nu betalen":
 * geen nette foutmelding, gewoon stuk — precies op de knop waar het geld
 * binnenkomt.
 *
 * `toCheckoutLines` is sindsdien de grens. Deze test bewaakt dat er niemand
 * per ongeluk het hele item weer meestuurt.
 */

/** Next's standaard bodySizeLimit voor server-actions. */
const BODY_LIMIT_BYTES = 1024 * 1024;

function regelMet(previewBytes: number): CartItem {
  return {
    id: "line-1",
    slug: "baniervlag",
    name: "Baniervlag",
    proboProductCode: "flag-ciclo",
    options: [{ code: "Afwerking", value: "Tunnel" }],
    amount: 2,
    unitPriceEstimate: 45.5,
    sizeLabel: "100 × 300 cm",
    widthCm: 100,
    heightCm: 300,
    designs: [
      {
        id: "d1",
        quantity: 1,
        fileUrl:
          "https://voorbeeld.supabase.co/storage/v1/object/public/order-artwork/a.pdf",
        fileName: "ontwerp.pdf",
        filePath: "a.pdf",
        fileWarnings: ["Lage resolutie"],
        previewUrl: `data:image/png;base64,${"A".repeat(previewBytes)}`,
      },
      {
        id: "d2",
        quantity: 1,
        fileUrl: null,
        fileName: null,
        filePath: null,
        fileWarnings: [],
      },
    ],
  };
}

describe("toCheckoutLines", () => {
  it("laat de velden staan die checkoutAction uitleest", () => {
    const [regel] = toCheckoutLines([regelMet(10)]);
    expect(regel).toEqual({
      slug: "baniervlag",
      name: "Baniervlag",
      proboProductCode: "flag-ciclo",
      options: [{ code: "Afwerking", value: "Tunnel" }],
      amount: 2,
      sizeLabel: "100 × 300 cm",
      widthCm: 100,
      heightCm: 300,
      designs: [
        {
          quantity: 1,
          fileUrl:
            "https://voorbeeld.supabase.co/storage/v1/object/public/order-artwork/a.pdf",
        },
        { quantity: 1, fileUrl: null },
      ],
    });
  });

  it("migreert een legacy regel (los fileUrl) naar één design-toewijzing", () => {
    const legacy = { ...regelMet(10), designs: undefined, fileUrl: "https://x/y.png" };
    const [regel] = toCheckoutLines([legacy]);
    expect(regel.designs).toEqual([{ quantity: 2, fileUrl: "https://x/y.png" }]);
  });

  it("stuurt geen weergave-velden mee", () => {
    const [regel] = toCheckoutLines([regelMet(10)]) as unknown as Record<string, unknown>[];
    for (const veld of [
      "previewUrl",
      "fileUrl",
      "fileName",
      "filePath",
      "fileWarnings",
      "id",
      // De prijs komt server-side uit de catalogus (buildLocalQuote), nooit
      // uit de client-payload.
      "unitPriceEstimate",
    ]) {
      expect(regel).not.toHaveProperty(veld);
    }
    const [eersteDesign] = (regel as { designs: Record<string, unknown>[] }).designs;
    for (const veld of ["previewUrl", "fileName", "filePath", "fileWarnings", "id"]) {
      expect(eersteDesign).not.toHaveProperty(veld);
    }
  });

  it("blijft ver onder Next's 1MB-bodylimiet, ook met een mand vol zware previews", () => {
    // Vijf regels met elk een preview van 2MB: zonder de strip is dit ~10MB en
    // dus een gegarandeerde 500.
    const mand = Array.from({ length: 5 }, () => regelMet(2 * 1024 * 1024));

    const ruw = JSON.stringify(mand);
    expect(ruw.length).toBeGreaterThan(BODY_LIMIT_BYTES);

    const payload = JSON.stringify(toCheckoutLines(mand));
    expect(payload.length).toBeLessThan(BODY_LIMIT_BYTES);
    // Ruim onder de limiet, niet net eronder.
    expect(payload.length).toBeLessThan(10 * 1024);
  });
});
