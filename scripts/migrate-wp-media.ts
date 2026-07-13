/**
 * Fase 4 — WordPress → Supabase media migration.
 *
 * Pulls every media item from the legacy WordPress site
 * (https://www.duurzame-vlaggen.nl) via the WP REST API and migrates each one
 * into Supabase Storage (bucket `product-media`, public read) plus a row in the
 * `media_assets` table. Idempotent: items whose `wp_id` already exists are
 * skipped, so the script is safe to re-run.
 *
 * NOTE — customer artwork NEVER lands here. This bucket is for product/site
 * media only; customer files go to Probo's white-label uploader.
 *
 * Standalone: this script does NOT import `@/lib/supabase/admin` (that module
 * pulls in "server-only", which throws outside the Next bundler). It builds its
 * own service-role Supabase client from the raw env instead, and loads
 * `.env.local` itself so it runs cleanly under `tsx`/`node`.
 *
 * Run:
 *   npx tsx scripts/migrate-wp-media.ts --dry-run --limit 5   # inspect, no writes
 *   npx tsx scripts/migrate-wp-media.ts                       # full migration
 *   npx tsx scripts/migrate-wp-media.ts --limit 50            # migrate first 50 new
 *
 * Flags:
 *   --dry-run     Log everything, upload/write nothing.
 *   --limit N     Migrate at most N *new* items (existing ones are skipped for free).
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "../lib/db/types";

// --- Config ------------------------------------------------------------------

const WP_BASE = "https://www.duurzame-vlaggen.nl";
const WP_MEDIA_ENDPOINT = `${WP_BASE}/wp-json/wp/v2/media`;
const PER_PAGE = 100;
const BUCKET = "product-media";
const STORAGE_PREFIX = "wp";
const FETCH_TIMEOUT_MS = 30_000;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

// --- .env.local loader -------------------------------------------------------

/**
 * Minimal `.env.local` loader so the script runs standalone (no Next runtime).
 * Only fills variables that are not already set in the process environment, so
 * an explicit `node --env-file=.env.local` or a real shell export still wins.
 */
function loadEnvLocal(): void {
  const envPath = resolve(repoRoot, ".env.local");
  let raw: string;
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    // No .env.local — rely on whatever is already in process.env.
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

interface Cli {
  dryRun: boolean;
  limit: number | null;
}

function parseCli(argv: string[]): Cli {
  let dryRun = false;
  let limit: number | null = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--limit") {
      const next = argv[i + 1];
      const parsed = Number(next);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`--limit requires a positive integer, got: ${String(next)}`);
      }
      limit = parsed;
      i++;
    } else if (arg.startsWith("--limit=")) {
      const parsed = Number(arg.slice("--limit=".length));
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`--limit requires a positive integer, got: ${arg}`);
      }
      limit = parsed;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return { dryRun, limit };
}

// --- WP media schema ---------------------------------------------------------

/**
 * The subset of a WP REST media object we care about. Unknown fields are
 * ignored; `.catch(...)` keeps optional/absent fields from failing the parse
 * (non-image attachments often lack `media_details.file` or `alt_text`).
 */
const WpMediaItem = z.object({
  id: z.number().int(),
  source_url: z.string().min(1),
  mime_type: z.string().min(1).catch(""),
  alt_text: z.string().catch(""),
  media_details: z
    .object({ file: z.string().optional() })
    .partial()
    .catch({}),
  title: z.object({ rendered: z.string() }).partial().catch({}),
});

type WpMediaItem = z.infer<typeof WpMediaItem>;

const WpMediaPage = z.array(z.unknown());

// --- Fetch helpers -----------------------------------------------------------

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (cause) {
    const reason = controller.signal.aborted ? `timed out after ${FETCH_TIMEOUT_MS}ms` : "network error";
    throw new Error(`GET ${url} failed (${reason})`, { cause });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch all media items, following pagination via the `X-WP-TotalPages` header.
 * Items that fail schema validation are logged and skipped rather than aborting
 * the whole run.
 */
async function fetchAllMedia(): Promise<WpMediaItem[]> {
  const items: WpMediaItem[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = `${WP_MEDIA_ENDPOINT}?per_page=${PER_PAGE}&page=${page}&_fields=id,source_url,mime_type,alt_text,media_details.file,title`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      throw new Error(`WP media request failed: GET ${url} → HTTP ${res.status}`);
    }

    // Prefer the header count; fall back to "stop when a page comes back empty".
    const headerTotal = res.headers.get("x-wp-totalpages");
    if (headerTotal && Number.isInteger(Number(headerTotal))) {
      totalPages = Number(headerTotal);
    }

    const body: unknown = await res.json();
    const rawItems = WpMediaPage.parse(body);
    if (rawItems.length === 0) {
      // Defensive: empty page means we're past the end regardless of the header.
      break;
    }

    for (const raw of rawItems) {
      const parsed = WpMediaItem.safeParse(raw);
      if (parsed.success) {
        items.push(parsed.data);
      } else {
        const id =
          raw && typeof raw === "object" && "id" in raw ? String((raw as { id: unknown }).id) : "?";
        console.warn(`  ! skipping unparseable media item (wp_id=${id}): ${parsed.error.message}`);
      }
    }

    if (!headerTotal && rawItems.length < PER_PAGE) {
      // No header and a short page → last page.
      break;
    }
    page++;
  } while (page <= totalPages);

  return items;
}

async function downloadBytes(url: string): Promise<Uint8Array> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`download failed: GET ${url} → HTTP ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

// --- Naming ------------------------------------------------------------------

/**
 * Derive a clean filename from the WP `media_details.file` path (or the URL as
 * a fallback), then slug it into an ASCII-safe basename for the storage key.
 */
function deriveFilename(item: WpMediaItem): string {
  const fromDetails = item.media_details.file;
  const source = fromDetails && fromDetails.length > 0 ? fromDetails : new URL(item.source_url).pathname;
  const base = source.split("/").pop() ?? `wp-${item.id}`;
  return base;
}

function sanitizeFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : "";
  const cleanStem = stem
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const cleanExt = ext.replace(/[^a-z0-9.]/g, "");
  return `${cleanStem || "file"}${cleanExt}`;
}

// --- Supabase ----------------------------------------------------------------

type Supabase = SupabaseClient<Database>;

/**
 * Build a service-role client from raw env, or return null when the required
 * variables are absent. In `--dry-run` a missing client is tolerated (existing
 * wp_ids simply can't be checked); a real run refuses to continue without it.
 */
function maybeCreateSupabase(): Supabase | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Load the set of `wp_id`s already migrated, for idempotency. */
async function fetchExistingWpIds(supabase: Supabase): Promise<Set<number>> {
  const existing = new Set<number>();
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("media_assets")
      .select("wp_id")
      .not("wp_id", "is", null)
      .range(from, from + pageSize - 1);
    if (error) {
      throw new Error(`Failed to read existing media_assets: ${error.message}`);
    }
    if (!data || data.length === 0) break;
    for (const row of data) {
      if (row.wp_id !== null) existing.add(row.wp_id);
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return existing;
}

// --- Per-item migration ------------------------------------------------------

interface Summary {
  migrated: number;
  skipped: number;
  failed: number;
}

async function migrateItem(
  supabase: Supabase,
  item: WpMediaItem,
  storagePath: string,
  filename: string,
): Promise<void> {
  const bytes = await downloadBytes(item.source_url);

  const contentType = item.mime_type || "application/octet-stream";
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType,
    upsert: true, // tolerate a re-run where storage was written but the DB row wasn't
  });
  if (uploadError) {
    throw new Error(`storage upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const altText = item.alt_text.trim() || item.title.rendered?.trim() || null;

  const { error: insertError } = await supabase.from("media_assets").insert({
    wp_id: item.id,
    wp_url: item.source_url,
    storage_path: storagePath,
    storage_url: publicUrl,
    filename,
    mime_type: item.mime_type || null,
    alt_text: altText,
  });
  if (insertError) {
    throw new Error(`media_assets insert failed: ${insertError.message}`);
  }
}

// --- Main --------------------------------------------------------------------

async function main(): Promise<void> {
  loadEnvLocal();
  const { dryRun, limit } = parseCli(process.argv.slice(2));

  console.log(`WP media migration${dryRun ? " [DRY RUN — no writes]" : ""}`);
  console.log(`  source: ${WP_MEDIA_ENDPOINT}`);
  console.log(`  target: bucket "${BUCKET}" + table media_assets`);
  if (limit !== null) console.log(`  limit:  ${limit} new item(s)`);

  const supabase = maybeCreateSupabase();
  if (!supabase && !dryRun) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — required for a real migration. " +
        "Set them in .env.local.",
    );
  }

  console.log("\nFetching WordPress media (paginated)…");
  const allItems = await fetchAllMedia();
  console.log(`  found ${allItems.length} media item(s) on WordPress.`);

  let existing: Set<number>;
  if (supabase) {
    existing = await fetchExistingWpIds(supabase);
    console.log(`  ${existing.size} already migrated (will be skipped).`);
  } else {
    existing = new Set();
    console.log("  (no Supabase credentials — cannot check already-migrated items in dry-run).");
  }

  // Candidates = not-yet-migrated, then capped by --limit.
  const notMigrated = allItems.filter((item) => !existing.has(item.id));
  const skippedExisting = allItems.length - notMigrated.length;
  const candidates = limit !== null ? notMigrated.slice(0, limit) : notMigrated;

  const summary: Summary = { migrated: 0, skipped: skippedExisting, failed: 0 };
  const total = candidates.length;
  console.log(`\nProcessing ${total} new item(s)…\n`);

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i];
    const filename = sanitizeFilename(deriveFilename(item));
    const storagePath = `${STORAGE_PREFIX}/${item.id}-${filename}`;
    const progress = `[${i + 1}/${total}]`;

    if (dryRun) {
      console.log(`${progress} wp_id=${item.id} → ${storagePath}  (${item.mime_type || "?"})`);
      console.log(`         from ${item.source_url}`);
      summary.migrated++; // "would migrate"
      continue;
    }

    try {
      await migrateItem(supabase!, item, storagePath, filename);
      console.log(`${progress} wp_id=${item.id} → ${storagePath}  ✓`);
      summary.migrated++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`${progress} wp_id=${item.id} FAILED: ${message}`);
      summary.failed++;
    }
  }

  console.log("\n──────────────────────────────────────────");
  console.log(dryRun ? "Dry-run summary (no writes performed):" : "Migration summary:");
  console.log(`  ${dryRun ? "would migrate" : "migrated"}: ${summary.migrated}`);
  console.log(`  skipped (already migrated): ${summary.skipped}`);
  console.log(`  failed: ${summary.failed}`);
  console.log("──────────────────────────────────────────");

  if (summary.failed > 0) process.exitCode = 1;
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nFatal: ${message}`);
  process.exit(1);
});
