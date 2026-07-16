/**
 * Customer artwork upload — signed direct-to-Storage flow (App Router, Next 16).
 *
 * The file no longer streams through this route (Vercel caps a serverless
 * request body at ~4.5 MB, well under our 50 MB artwork limit). Instead:
 *
 *   1. POST { action: "sign", fileName, fileType, fileSize }
 *        → validate + rate-limit, mint a signed upload URL for an unguessable
 *          `${uuid}-${safeName}` key → { path, token }.
 *   2. The browser uploads straight to Supabase with
 *        supabase.storage.from("order-artwork").uploadToSignedUrl(path, token, file).
 *   3. POST { action: "finalize", path, widthCm?, heightCm? }
 *        → fetch the file's head (and, for PDF, tail) bytes, verify the magic
 *          bytes against the claimed extension (authoritative — mismatch deletes
 *          the object and 415s), analyse dimensions/DPI/aspect ratio against the
 *          flag size, and return the public URL + non-blocking warnings.
 *   4. DELETE { path } removes an orphan (used on "Verwijderen"/"Vervangen"),
 *        refusing to delete a file already referenced by an order.
 *
 * The bucket is PUBLIC so Probo can fetch the artwork by URL later
 * (`products[].files[].uri`). Writes/deletes go through the service-role admin
 * client; the browser only ever holds a short-lived signed upload token.
 *
 * `runtime = "nodejs"` — Storage + fetch with Range headers use Node APIs.
 */

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import { sniffKind, kindFromFilename, kindFromMime, type ArtworkKind } from "@/lib/artwork/sniff";
import { analyzeBytes, buildWarnings, type FlagSize } from "@/lib/artwork/inspect";
import { isValidArtworkPath, safeNameSuffix } from "@/lib/artwork/paths";

export const runtime = "nodejs";

const BUCKET = "order-artwork";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB, mirrors the bucket limit
const HEAD_BYTES = 256 * 1024; // first 256 KB — enough for magic + dims
const TAIL_BYTES = 64 * 1024; // last 64 KB — PDF MediaBox often lives here

const EXT: Record<ArtworkKind, string> = { png: "png", jpeg: "jpg", pdf: "pdf" };

// --- Rate limiting -----------------------------------------------------------

/**
 * Best-effort in-memory sliding window, per IP, per serverless instance. This
 * is NOT durable — a fleet of instances each keeps its own counters, and a cold
 * start resets them. Good enough to blunt casual abuse of the sign endpoint;
 * for hard guarantees move this to Upstash/Redis later.
 */
const SIGN_MAX = 20;
const SIGN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MUTATE_MAX = 60; // finalize + delete, looser
const MUTATE_WINDOW_MS = 10 * 60 * 1000;

const hits = new Map<string, number[]>();

function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// --- Helpers -----------------------------------------------------------------

function publicUrlFor(path: string): string {
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Range-fetch a slice of the object's public URL; null on any failure. */
async function fetchRange(url: string, range: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url, { headers: { Range: range }, cache: "no-store" });
    // 206 (partial) or 200 (server ignored Range) both carry usable bytes.
    if (!res.ok && res.status !== 206) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// --- POST dispatch -----------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }
  const action = (body as { action?: unknown }).action;
  const ip = clientIp(request);

  if (action === "sign") return handleSign(body as Record<string, unknown>, ip);
  if (action === "finalize") return handleFinalize(body as Record<string, unknown>, ip);
  return NextResponse.json({ error: "Onbekende actie." }, { status: 400 });
}

// --- sign --------------------------------------------------------------------

async function handleSign(body: Record<string, unknown>, ip: string): Promise<NextResponse> {
  if (rateLimited(`sign:${ip}`, SIGN_MAX, SIGN_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Te veel uploads in korte tijd. Wacht even en probeer opnieuw." },
      { status: 429 },
    );
  }

  const fileName = typeof body.fileName === "string" ? body.fileName : "";
  const fileType = typeof body.fileType === "string" ? body.fileType : "";
  const fileSize = typeof body.fileSize === "number" ? body.fileSize : NaN;

  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return NextResponse.json({ error: "Leeg bestand." }, { status: 400 });
  }
  if (fileSize > MAX_BYTES) {
    return NextResponse.json({ error: "Bestand te groot (max 50 MB)." }, { status: 413 });
  }
  // Claimed kind must be an allowed type (extension and MIME must agree if both
  // are present); the authoritative magic-byte check happens at finalize.
  const claimed = kindFromMime(fileType) ?? kindFromFilename(fileName);
  if (!claimed) {
    return NextResponse.json(
      { error: "Alleen PDF, JPG of PNG toegestaan." },
      { status: 415 },
    );
  }

  const path = `${crypto.randomUUID()}-${safeNameSuffix(fileName, EXT[claimed])}`;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[artwork] sign failed:", error?.message);
    return NextResponse.json(
      { error: "Uploaden voorbereiden mislukt. Probeer opnieuw." },
      { status: 500 },
    );
  }

  return NextResponse.json({ path: data.path, token: data.token });
}

// --- finalize ----------------------------------------------------------------

async function handleFinalize(body: Record<string, unknown>, ip: string): Promise<NextResponse> {
  if (rateLimited(`mutate:${ip}`, MUTATE_MAX, MUTATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Te veel verzoeken. Wacht even en probeer opnieuw." },
      { status: 429 },
    );
  }

  const path = body.path;
  if (!isValidArtworkPath(path)) {
    return NextResponse.json({ error: "Ongeldig bestandspad." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const url = publicUrlFor(path);

  const head = await fetchRange(url, `bytes=0-${HEAD_BYTES - 1}`);
  if (!head || head.length === 0) {
    return NextResponse.json(
      { error: "Bestand niet gevonden. Upload opnieuw." },
      { status: 404 },
    );
  }

  // Magic-byte check is authoritative. A mismatch against the claimed extension
  // means the bytes lie about what they are → delete + reject.
  const sniffed = sniffKind(head);
  const claimed = kindFromFilename(path);
  if (!sniffed || (claimed !== null && sniffed !== claimed)) {
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json(
      { error: "Het bestand lijkt geen geldige PDF, JPG of PNG te zijn." },
      { status: 415 },
    );
  }

  // Dimension / DPI / aspect-ratio analysis (non-blocking warnings only).
  let tail: Uint8Array | undefined;
  if (sniffed === "pdf") {
    tail = (await fetchRange(url, `bytes=-${TAIL_BYTES}`)) ?? undefined;
  }
  const flag = readFlagSize(body);
  const info = analyzeBytes(sniffed, head, tail);
  const warnings = info ? buildWarnings(info, flag) : [];

  // Non-breaking extra: hand the detected dimensions + aspect ratio back so the
  // client can draw the artwork inside the flag's cut lines ("snijlijnen"). Null
  // when dimensions could not be determined (client then skips the preview).
  const dimensions = info
    ? info.kind === "pdf"
      ? {
          kind: "pdf" as const,
          widthCm: info.widthCm,
          heightCm: info.heightCm,
          ratio: info.heightCm > 0 ? info.widthCm / info.heightCm : null,
        }
      : {
          kind: "raster" as const,
          pixelWidth: info.pixelWidth,
          pixelHeight: info.pixelHeight,
          ratio: info.pixelHeight > 0 ? info.pixelWidth / info.pixelHeight : null,
        }
    : null;

  // Strip the "uuid-" prefix (36-char UUID + dash) to recover the display name.
  const name = path.slice(37);
  return NextResponse.json({
    url,
    name: name || `artwork.${EXT[sniffed]}`,
    warnings,
    dimensions,
  });
}

function readFlagSize(body: Record<string, unknown>): FlagSize | null {
  const widthCm = typeof body.widthCm === "number" ? body.widthCm : NaN;
  const heightCm = typeof body.heightCm === "number" ? body.heightCm : NaN;
  if (Number.isFinite(widthCm) && Number.isFinite(heightCm) && widthCm > 0 && heightCm > 0) {
    return { widthCm, heightCm };
  }
  return null;
}

// --- DELETE (orphan cleanup) -------------------------------------------------

export async function DELETE(request: Request): Promise<NextResponse> {
  const ip = clientIp(request);
  if (rateLimited(`mutate:${ip}`, MUTATE_MAX, MUTATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Te veel verzoeken. Wacht even en probeer opnieuw." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }
  const path = (body as { path?: unknown })?.path;
  if (!isValidArtworkPath(path)) {
    return NextResponse.json({ error: "Ongeldig bestandspad." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Never delete a file already attached to an order: zowel de legacy
  // enkelbestand-referentie (order_items.file_url) als design-toewijzingen
  // tellen. Een herbestelling deelt zijn storage-object met de oorspronkelijke
  // order, dus deze check voorkomt dat "verwijderen uit de mand" het artwork
  // van een oude order sloopt.
  const { data: refs, error: refErr } = await supabase
    .from("order_items")
    .select("id")
    .eq("file_url", publicUrlFor(path))
    .limit(1);
  if (refErr) {
    console.error("[artwork] delete ref-check failed:", refErr.message);
    return NextResponse.json({ error: "Verwijderen mislukt." }, { status: 500 });
  }
  const { data: designRefs, error: designErr } = await supabase
    .from("order_item_designs")
    .select("id")
    .eq("file_path", path)
    .limit(1);
  if (designErr) {
    console.error("[artwork] delete design ref-check failed:", designErr.message);
    return NextResponse.json({ error: "Verwijderen mislukt." }, { status: 500 });
  }
  if ((refs && refs.length > 0) || (designRefs && designRefs.length > 0)) {
    return NextResponse.json(
      { error: "Dit bestand hoort bij een bestelling en kan niet worden verwijderd." },
      { status: 409 },
    );
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error("[artwork] delete failed:", error.message);
    return NextResponse.json({ error: "Verwijderen mislukt." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
