import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Load `.env.local` into `process.env` for tests (vitest does not read Next's
 * env files). Minimal parser — no dotenv dependency. Existing `process.env`
 * values win, so CI can override. Missing file is fine (unit tests need no env).
 */
try {
  const path = fileURLToPath(new URL("../.env.local", import.meta.url));
  const contents = readFileSync(path, "utf8");
  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined && value !== "") {
      process.env[key] = value;
    }
  }
} catch {
  // No .env.local — unit tests run without it.
}
