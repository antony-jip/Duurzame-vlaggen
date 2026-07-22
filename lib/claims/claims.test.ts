import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  AFBRAAK_TESTS,
  CICLO_DISCLAIMER,
  HOOFDTEST,
  KORTE_ONDERBOUWING,
} from "./afbreekbaarheid";

/**
 * Claim-linter.
 *
 * De site voerde tot 2026-07-20 milieuclaims die feitelijk onjuist waren, of
 * die na 27 september 2026 verboden zijn onder EU-richtlijn 2024/825
 * (Empowering Consumers). Ze zijn eruit gehaald, maar copy groeit terug: één
 * enthousiaste tegel en "0% microplastics" staat er weer.
 *
 * Deze test scant de eigen broncode op die formuleringen. Hij kijkt alleen naar
 * ECHTE tekst: commentaar wordt eruit gestript, zodat de bestanden die uitleggen
 * waaróm een claim verboden is (dit bestand, `afbreekbaarheid.ts`, het
 * materiaalpaspoort) zichzelf niet laten omvallen.
 *
 * Valt hij om, dan is dat geen testprobleem maar een claimprobleem. Herschrijf
 * de copy; zet de regel niet op de uitzonderingenlijst.
 */

const ROOT = path.join(__dirname, "..", "..");
const SCAN_DIRS = ["app", "components", "lib", "messages"];
const SCAN_EXT = new Set([".ts", ".tsx", ".json"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "__snapshots__"]);

/**
 * Bestanden die de verboden claims letterlijk MOETEN noemen om ze te verbieden.
 *
 * Houd deze lijst op één of twee bestanden. Een pagina hier neerzetten om de
 * linter stil te krijgen is precies de fout die deze test hoort te vangen.
 */
const UITGEZONDERDE_BESTANDEN = new Set([
  // De guardrail voor de AI-tekstgenerator: die somt op wat níét geschreven mag
  // worden. Zonder de verboden formuleringen op te schrijven kan hij ze niet
  // verbieden, en dan schrijft het model de oude claims gewoon terug.
  path.join("lib", "analytics", "prompts.ts"),
]);

/** Alle bronbestanden waarin klantgerichte tekst kan staan. */
function bronBestanden(): string[] {
  const out: string[] = [];
  for (const dir of SCAN_DIRS) {
    const base = path.join(ROOT, dir);
    for (const entry of readdirSync(base, {
      recursive: true,
      withFileTypes: true,
    })) {
      if (!entry.isFile()) continue;
      const parent = entry.parentPath ?? entry.path;
      if (parent.split(path.sep).some((seg) => SKIP_DIRS.has(seg))) continue;
      if (!SCAN_EXT.has(path.extname(entry.name))) continue;
      // Tests bevatten bewust de verboden formuleringen als testdata.
      if (/\.test\.tsx?$/.test(entry.name)) continue;
      const rel = path.relative(ROOT, path.join(parent, entry.name));
      if (UITGEZONDERDE_BESTANDEN.has(rel)) continue;
      out.push(path.join(parent, entry.name));
    }
  }
  return out;
}

/**
 * Verwijder commentaar, zodat een uitleg over een verboden claim niet als
 * claim telt. Grof maar voldoende: we zoeken naar copy, niet naar syntaxis.
 */
function zonderCommentaar(bron: string): string {
  return bron.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}

/**
 * Zinnen die een verboden claim WEERLEGGEN in plaats van hem te voeren.
 *
 * "Flag-CiCLO is niet composteerbaar" bevat het woord composteerbaar, maar is
 * precies de tekst die we wíllen. Zonder deze uitzonderingen zou de linter de
 * eerlijkheid straffen die hij hoort af te dwingen.
 *
 * Houd deze lijst kort en letterlijk. Een nieuwe regel hoort hier alleen bij
 * als hij de claim ONTKENT; een claim "genuanceerd" voeren is nog steeds hem
 * voeren.
 */
const WEERLEGGINGEN: RegExp[] = [
  /niet composteerbaar/i,
  /composteerbaar[^.]{0,40}(uitgesloten|verboden|niet toegestaan)/i,
  /(claimen|beloven|zeggen)[^.]{0,30}geen (nul|0\s*%)\s*microplastic/i,
  // Ook met HTML-entiteiten ertussen (&ldquo;CSRD-certificaten&rdquo;).
  /csrd-certificaten\b[\s\S]{0,30}?bestaan niet/i,
];

/** Eén verboden formulering, met de reden erbij voor wie de test rood ziet. */
interface VerbodenClaim {
  naam: string;
  patroon: RegExp;
  waarom: string;
}

const VERBODEN: VerbodenClaim[] = [
  {
    naam: "100% afbreekbaar",
    patroon:
      /100\s*%\s*(biologisch afbreekbaar|biodegradable|biologisch abbaubar|biod[ée]gradable)/i,
    waarom:
      "Onjuist. De hoogste gemeten uitkomst is 94,2% in zeewater; de site legt op /afbreekbaarheid zelf uit waarom het geen 100% is.",
  },
  {
    naam: "0% microplastics",
    patroon: /\b(0|nul|zero)\s*%?\s*microplastic/i,
    waarom:
      "Onjuist. CiCLO vermindert de AFGIFTE van vezels niet, het versnelt de AFBRAAK van afgegeven vezels.",
  },
  {
    naam: "geen/zonder microplastics",
    patroon:
      /(geen|zonder|ohne|sans|without)\s+microplastic|zero plastic|microplastic\w*\s+achtergelaten/i,
    waarom:
      "Zelfde fout als '0% microplastics': suggereert dat er niets loslaat. Beschrijf in plaats daarvan wat er met afgegeven vezels gebeurt.",
  },
  {
    naam: "composteerbaar",
    patroon: /composteerbaar|compostable|kompostierbar/i,
    waarom:
      "De licentiegever van CiCLO verbiedt deze claim uitdrukkelijk. Compostering kent andere normen en veel kortere termijnen.",
  },
  {
    naam: "CSRD-proof",
    // Bewust op de claim-BIJVOEGLIJKE naamwoorden en niet op "CSRD-certificaten":
    // dat laatste is een zelfstandig naamwoord dat we alleen gebruiken om te
    // zeggen dat het niet bestaat, onder andere als vraag in de FAQ.
    patroon: /csrd[-\s]?(proof|compliant|gecertificeerd|ready)/i,
    waarom:
      "Na het Omnibus-pakket (december 2025) geldt de CSRD alleen boven 1.000 medewerkers en 450 mln omzet. Voor het mkb is de claim onjuist, en 'CSRD-certificaten' bestaan niet.",
  },
  {
    naam: "96% afbreekbaar",
    patroon: /96\s*%/,
    waarom:
      "Dit cijfer is nergens op terug te voeren. Gebruik de gemeten uitkomsten uit AFBRAAK_TESTS.",
  },
  {
    naam: "x% minder microplastics",
    patroon: /\d+\s*%\s*minder\s+microplastic/i,
    waarom:
      "CiCLO vermindert de afgifte niet. Een percentage 'minder microplastics' bestaat niet.",
  },
];

describe("claim-linter", () => {
  const bestanden = bronBestanden();

  it("vindt überhaupt bronbestanden om te scannen", () => {
    // Vangt een stukgelopen scanner af: anders zou de linter stil groen zijn.
    expect(bestanden.length).toBeGreaterThan(50);
  });

  for (const claim of VERBODEN) {
    it(`voert nergens de claim "${claim.naam}"`, () => {
      const treffers: string[] = [];
      for (const bestand of bestanden) {
        const tekst = zonderCommentaar(readFileSync(bestand, "utf8"));
        for (const [i, regel] of tekst.split("\n").entries()) {
          if (WEERLEGGINGEN.some((w) => w.test(regel))) continue;
          if (claim.patroon.test(regel)) {
            treffers.push(
              `${path.relative(ROOT, bestand)}:${i + 1} — ${regel.trim().slice(0, 120)}`,
            );
          }
        }
      }
      expect(
        treffers,
        `${claim.waarom}\n\nGevonden op:\n${treffers.join("\n")}`,
      ).toEqual([]);
    });
  }
});

describe("schrijfwijze van percentages", () => {
  it("rendert geen percentage met een Engelse punt", () => {
    // `afbraakPct` is een number (94.2). Direct in JSX zetten levert "94.2%" op
    // in plaats van "94,2%". Dat is geen schoonheidsfoutje: het staat in een
    // Nederlandse claim die een inkoper natrekt, en het verraadt dat het cijfer
    // ergens onbewerkt uit een tabel is gevallen. Gebruik `pctNl()`.
    const fout: string[] = [];
    for (const bestand of bronBestanden()) {
      if (!bestand.endsWith(".tsx")) continue;
      const tekst = zonderCommentaar(readFileSync(bestand, "utf8"));
      for (const [i, regel] of tekst.split("\n").entries()) {
        // `{...afbraakPct}` of `${...referentiePct}` zonder pctNl eromheen.
        if (!/\$?\{[^{}]*(afbraakPct|referentiePct)[^{}]*\}/.test(regel))
          continue;
        if (/pctNl\(/.test(regel)) continue;
        fout.push(
          `${path.relative(ROOT, bestand)}:${i + 1} — ${regel.trim().slice(0, 100)}`,
        );
      }
    }
    expect(fout, `Gebruik pctNl():\n${fout.join("\n")}`).toEqual([]);
  });
});

describe("onderbouwing", () => {
  it("heeft voor elke test een norm, een percentage en een leesbare termijn", () => {
    expect(AFBRAAK_TESTS.length).toBe(4);
    for (const test of AFBRAAK_TESTS) {
      // Zonder deze drie is het volgens EU 2024/825 een kale claim.
      expect(test.norm).toMatch(/^ASTM D\d+/);
      expect(test.afbraakPct).toBeGreaterThan(0);
      expect(test.dagen).toBeGreaterThan(0);
      expect(test.duur).not.toMatch(/\d+\s*dagen/);
    }
  });

  it("voert zeewater als hoofdclaim, de hoogste gemeten uitkomst", () => {
    const hoogste = Math.max(...AFBRAAK_TESTS.map((t) => t.afbraakPct));
    expect(HOOFDTEST.afbraakPct).toBe(hoogste);
    expect(HOOFDTEST.omgeving).toBe("Zeewater");
  });

  it("noemt in de korte onderbouwing het percentage, de omgeving en de termijn", () => {
    expect(KORTE_ONDERBOUWING).toContain("94,2".replace(",", "."));
    expect(KORTE_ONDERBOUWING).toContain("zeewater");
    expect(KORTE_ONDERBOUWING).toContain(HOOFDTEST.duur);
  });

  it("houdt de disclaimer van CiCLO volledig", () => {
    // Inkorten haalt precies de nuance weg waar hij voor bedoeld is.
    expect(CICLO_DISCLAIMER).toMatch(/gecontroleerde omstandigheden/i);
    expect(CICLO_DISCLAIMER).toMatch(/vari[eë]ren/i);
  });
});
