/**
 * Kopieer de landenvlag-SVG's (4x3) uit het `flag-icons`-npm-package naar
 * `public/flags/4x3/`, zodat /landenvlaggen ze als gewone statische assets kan
 * tonen (mini's in de landenlijst) én kan ophalen om er client-side een
 * drukklaar PNG-bestand van te renderen.
 *
 * Waarom kopiëren in plaats van rechtstreeks uit node_modules serveren:
 * node_modules bestaat niet in de productie-output, en de shop heeft de SVG's
 * per URL nodig (fetch → canvas). `public/` is dáárvoor de plek; deze map staat
 * in .gitignore en wordt gegenereerd via `postinstall` en `prebuild`
 * (zie package.json), dus lokaal én op Vercel altijd aanwezig en actueel.
 *
 * Alleen echte ISO 3166-1-landen (`iso: true` in country.json) — de rest van
 * het package (gb-eng, eu, un, …) is voor de landenshop niet relevant.
 */

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = join(root, "node_modules", "flag-icons");
const dest = join(root, "public", "flags", "4x3");

const countries = JSON.parse(readFileSync(join(pkg, "country.json"), "utf8"));
const isoCodes = countries.filter((c) => c.iso).map((c) => c.code);

mkdirSync(dest, { recursive: true });

let copied = 0;
const missing = [];
for (const code of isoCodes) {
  const src = join(pkg, "flags", "4x3", `${code}.svg`);
  try {
    copyFileSync(src, join(dest, `${code}.svg`));
    copied++;
  } catch {
    missing.push(code);
  }
}

if (missing.length > 0) {
  console.error(
    `[sync-flag-icons] FOUT: geen SVG voor: ${missing.join(", ")}`,
  );
  process.exit(1);
}
console.log(`[sync-flag-icons] ${copied} landenvlaggen → public/flags/4x3/`);
