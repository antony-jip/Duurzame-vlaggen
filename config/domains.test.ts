import { describe, expect, it } from "vitest";

import { MARKET_DOMAINS, REDIRECT_DOMAINS, getRedirectTarget } from "./domains";
import { allePublicRoutes } from "@/lib/routes";

/**
 * Een redirect-domein bestaat om linkwaarde door te geven. Wijst het naar een
 * pad dat niet bestaat, dan is het een 301 naar een 404 en gooi je die waarde
 * juist weg. Dat was hier het geval voor drie domeinen: ze wezen naar
 * /mastvlaggen, /baniervlaggen en /beachvlaggen terwijl de echte slug
 * /collectie/<enkelvoud> is. Niets in de build merkte dat op.
 */

const schoon = (p: string) => p.replace(/\/+$/, "") || "/";

describe("REDIRECT_DOMAINS", () => {
  const routes = new Set(allePublicRoutes().map(schoon));

  it.each(Object.entries(REDIRECT_DOMAINS))(
    "%s wijst naar een bestaande route",
    (_domein, doel) => {
      expect(routes.has(schoon(doel.toPath))).toBe(true);
    },
  );

  it.each(Object.entries(REDIRECT_DOMAINS))(
    "%s wijst naar een bekend marktdomein",
    (_domein, doel) => {
      expect(Object.keys(MARKET_DOMAINS)).toContain(doel.toHost);
    },
  );

  it("stuurt een redirect-domein niet naar zichzelf", () => {
    for (const [domein, doel] of Object.entries(REDIRECT_DOMAINS)) {
      expect(doel.toHost).not.toBe(domein);
    }
  });

  it("negeert www en hoofdletters bij het opzoeken", () => {
    expect(getRedirectTarget("www.Duurzame-Mastvlaggen.nl")).toEqual(
      REDIRECT_DOMAINS["duurzame-mastvlaggen.nl"],
    );
  });

  it("geeft null voor een marktdomein, zodat dat niet wordt omgeleid", () => {
    expect(getRedirectTarget("duurzame-vlaggen.nl")).toBeNull();
  });
});
