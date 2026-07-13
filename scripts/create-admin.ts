/**
 * Create a Supabase Auth user for the /admin back-office.
 *
 * Staff sign in to the back-office with Supabase Auth (e-mail + password); this
 * one-off script provisions such a user via the Admin API. The e-mail must ALSO
 * be listed in ADMIN_EMAILS (the allowlist) for the auth-gate to let it through.
 *
 * Standalone, like scripts/migrate-wp-media.ts: it does NOT import
 * `@/lib/supabase/admin` (that pulls in "server-only", which throws outside the
 * Next bundler). It builds its own service-role client from the raw env and
 * loads `.env.local` itself so it runs cleanly under `tsx`.
 *
 * Run:
 *   npx tsx scripts/create-admin.ts <email> <password>
 *
 * Example:
 *   npx tsx scripts/create-admin.ts antony@signcompany.nl 'a-strong-password'
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/db/types";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

// --- .env.local loader -------------------------------------------------------

/**
 * Minimal `.env.local` loader so the script runs standalone (no Next runtime).
 * Only fills variables that are not already set, so a real shell export wins.
 */
function loadEnvLocal(): void {
  const envPath = resolve(repoRoot, ".env.local");
  let raw: string;
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    return; // No .env.local — rely on whatever is already in process.env.
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key || key in process.env) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

// --- Main --------------------------------------------------------------------

async function main(): Promise<void> {
  loadEnvLocal();

  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    throw new Error("Usage: npx tsx scripts/create-admin.ts <email> <password>");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set them in .env.local).",
    );
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    throw new Error(`Failed to create admin user: ${error.message}`);
  }

  console.log(`Admin user created: ${data.user?.email} (id: ${data.user?.id})`);
  const allowlist = process.env.ADMIN_EMAILS ?? "";
  if (!allowlist.toLowerCase().includes(email.toLowerCase())) {
    console.warn(
      `\n⚠  ${email} is not in ADMIN_EMAILS yet — add it there or the auth-gate will reject the login.`,
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
