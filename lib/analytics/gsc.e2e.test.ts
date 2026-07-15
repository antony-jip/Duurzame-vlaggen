import { describe, expect, it } from "vitest";

import { gscQuery, gscGeconfigureerd } from "@/lib/analytics/gsc";
import { periode } from "@/lib/analytics/zoekverkeer";

/**
 * LIVE Search Console-check — raakt de echte Google-API, dus standaard uit.
 * Aanzetten met `RUN_GSC_E2E=1 npm run test:e2e`.
 *
 * Bedoeld als koppel-diagnose: draait de service-account-auth, accepteert Google
 * de sleutel, en heeft het account toegang tot de property? De drie meest
 * voorkomende fouten geven elk een eigen, herkenbare melding:
 *   - sleutel verkeerd geplakt   → "error:1E08010C" / DECODER routines
 *   - account niet toegevoegd    → 403 in Search Console
 *   - verkeerde property-vorm    → 403 of lege resultaten
 */
const RUN = process.env.RUN_GSC_E2E === "1";

describe.skipIf(!RUN)("Search Console-koppeling (live)", () => {
  it("heeft alle drie de env-vars", () => {
    expect(gscGeconfigureerd()).toBe(true);
  });

  it("haalt de headline-totalen op over de laatste 28 dagen", async () => {
    const { since, totEnMet } = periode("28d");
    const rijen = await gscQuery({
      startDate: since,
      endDate: totEnMet,
      dimensions: [],
    });

    // Geen rijen is geldig (property zonder verkeer); een fout is dat niet.
    expect(Array.isArray(rijen)).toBe(true);

    if (rijen.length > 0) {
      const t = rijen[0];
      expect(t.clicks).toBeTypeOf("number");
      expect(t.impressions).toBeTypeOf("number");
       
      console.log(
        `\n  ✓ Verbonden. ${since} t/m ${totEnMet}: ${t.clicks} klikken · ${t.impressions} vertoningen · positie ${t.position?.toFixed(1)}\n`,
      );
    } else {
       
      console.log("\n  ✓ Verbonden, maar geen data in dit venster.\n");
    }
  });

  it("levert zoekwoorden, zodat de kansen-analyse iets te doen heeft", async () => {
    const { since, totEnMet } = periode("28d");
    const rijen = await gscQuery({
      startDate: since,
      endDate: totEnMet,
      dimensions: ["query"],
      rowLimit: 5,
    });

    expect(Array.isArray(rijen)).toBe(true);
     
    console.log(
      `\n  Top-zoekwoorden (${rijen.length}):\n` +
        rijen
          .map((r) => `    ${r.keys[0]} · ${r.clicks} klikken · positie ${r.position.toFixed(1)}`)
          .join("\n") +
        "\n",
    );
  });
});
