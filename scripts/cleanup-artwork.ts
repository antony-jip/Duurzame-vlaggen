/**
 * Orphan artwork cleanup for the `order-artwork` Storage bucket.
 *
 * Customer artwork is uploaded browser → Storage before checkout completes, so
 * abandoned carts leave files that never get attached to an order. This script
 * removes bucket objects that are BOTH:
 *   - older than 30 days, and
 *   - not referenced by any `order_items.file_url`.
 *
 * Standalone (like scripts/migrate-wp-media.ts): it does NOT import
 * `@/lib/supabase/admin` (that pulls in "server-only", which throws outside the
 * Next bundler). It builds its own service-role client and loads `.env.local`.
 *
 * Run:
 *   npx tsx scripts/cleanup-artwork.ts --dry-run   # list what would be removed
 *   npx tsx scripts/cleanup-artwork.ts             # actually remove orphans
 *
 * Flags:
 *   --dry-run     Log everything, delete nothing.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/db/types";

const BUCKET = "order-artwork";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const LIST_PAGE = 1000;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

// --- .env.local loader (mirrors migrate-wp-media.ts) -------------------------

function loadEnvLocal(): void {
  const envPath = resolve(repoRoot, ".env.local");
  let raw: string;
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    return;
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

// --- CLI ---------------------------------------------------------------------

function parseCli(argv: string[]): { dryRun: boolean } {
  let dryRun = false;
  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return { dryRun };
}

// --- Supabase ----------------------------------------------------------------

type Supabase = SupabaseClient<Database>;

function createSupabase(): Supabase {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — set them in .env.local.",
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** All storage paths currently referenced by an order item. */
async function fetchReferencedPaths(supabase: Supabase): Promise<Set<string>> {
  const marker = "/order-artwork/";
  const referenced = new Set<string>();
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("order_items")
      .select("file_url")
      .not("file_url", "is", null)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Failed to read order_items: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) {
      const url = row.file_url;
      if (!url) continue;
      const idx = url.indexOf(marker);
      if (idx !== -1) referenced.add(url.slice(idx + marker.length));
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return referenced;
}

interface BucketFile {
  name: string;
  createdAt: number;
}

/** List every object at the bucket root, paginating. */
async function listBucket(supabase: Supabase): Promise<BucketFile[]> {
  const files: BucketFile[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: LIST_PAGE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`Failed to list bucket: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const obj of data) {
      // Folders have no `id`; skip them (we only store flat objects).
      if (!obj.id) continue;
      const created = obj.created_at ? Date.parse(obj.created_at) : Date.now();
      files.push({ name: obj.name, createdAt: created });
    }
    if (data.length < LIST_PAGE) break;
    offset += LIST_PAGE;
  }
  return files;
}

// --- Main --------------------------------------------------------------------

async function main(): Promise<void> {
  loadEnvLocal();
  const { dryRun } = parseCli(process.argv.slice(2));

  console.log(`Artwork orphan cleanup${dryRun ? " [DRY RUN — no deletes]" : ""}`);
  console.log(`  bucket: ${BUCKET}`);
  console.log(`  rule:   older than 30 days AND not referenced by any order\n`);

  const supabase = createSupabase();
  const referenced = await fetchReferencedPaths(supabase);
  console.log(`  ${referenced.size} file(s) referenced by orders (kept).`);

  const files = await listBucket(supabase);
  console.log(`  ${files.length} file(s) in bucket.\n`);

  const now = Date.now();
  const orphans = files.filter(
    (f) => !referenced.has(f.name) && now - f.createdAt > MAX_AGE_MS,
  );

  if (orphans.length === 0) {
    console.log("No orphans older than 30 days. Nothing to do.");
    return;
  }

  console.log(`Found ${orphans.length} orphan(s):`);
  for (const f of orphans) {
    const ageDays = Math.floor((now - f.createdAt) / (24 * 60 * 60 * 1000));
    console.log(`  ${dryRun ? "would remove" : "removing"}: ${f.name} (${ageDays}d old)`);
  }

  if (dryRun) {
    console.log("\nDry run — no files removed.");
    return;
  }

  // Remove in batches of 100 (Storage `.remove` accepts an array).
  let removed = 0;
  for (let i = 0; i < orphans.length; i += 100) {
    const batch = orphans.slice(i, i + 100).map((f) => f.name);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) {
      console.error(`  ! batch remove failed: ${error.message}`);
    } else {
      removed += batch.length;
    }
  }
  console.log(`\nRemoved ${removed} orphan(s).`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nFatal: ${message}`);
  process.exit(1);
});
