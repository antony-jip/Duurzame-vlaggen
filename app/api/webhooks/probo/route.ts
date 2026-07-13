/**
 * Probo status callback webhook (App Router route handler, Next.js 16).
 *
 * Probo POSTs a JSON callback when a supplier order changes state. When we placed
 * the order we sent `id` = our order UUID and `reference` = our order_number, and
 * Probo echoes those back. The exact payload shape is not contractually stable, so
 * we extract fields tolerantly from a set of plausible keys and hand a normalised
 * update to `handleProboStatus`, which correlates and advances the order idempotently.
 *
 * v16 notes:
 * - `runtime = "nodejs"` is required — the callback verification uses `node:crypto`
 *   (timing-safe compare against `PROBO_SECURITY_TOKEN`).
 * - We read the raw body once with `await request.text()` and use `request.headers`
 *   (a `Headers` object) directly rather than the async `headers()` helper.
 *
 * Responses:
 * - 401 when a security token is configured but the header is invalid.
 * - 400 when the body is not valid JSON, or no `status` can be found.
 * - 200 on success.
 * - 500 on an unexpected failure.
 */
import { handleProboStatus } from "@/lib/orders/orchestration";
import { verifyProboCallback } from "@/lib/probo/callbacks";

export const runtime = "nodejs";

/** Narrow an unknown value to a plain, indexable record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Read a nested string value from an unknown payload by following a key path.
 * Returns the trimmed string when found and non-empty, otherwise `null`.
 */
function readString(payload: unknown, path: readonly string[]): string | null {
  let current: unknown = payload;
  for (const key of path) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  if (typeof current !== "string") return null;
  const trimmed = current.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Return the first non-null string among the given key paths. */
function pick(payload: unknown, paths: readonly (readonly string[])[]): string | null {
  for (const path of paths) {
    const value = readString(payload, path);
    if (value !== null) return value;
  }
  return null;
}

export async function POST(request: Request): Promise<Response> {
  const check = verifyProboCallback(request.headers);
  if (check.configured && !check.valid) {
    return new Response(null, { status: 401 });
  }
  if (!check.configured) {
    console.warn(
      "[probo-webhook] PROBO_SECURITY_TOKEN not set — skipping verification",
    );
  }

  const rawBody = await request.text();

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(null, { status: 400 });
  }

  // Our order UUID: sent as `id`/`reference` and echoed back by Probo.
  const ourOrderId = pick(payload, [
    ["id"],
    ["order", "id"],
    ["reference"],
    ["your_reference"],
    ["customer_reference"],
  ]);

  const supplierOrderNumber = pick(payload, [
    ["supplier_order_number"],
    ["order", "supplier_order_number"],
  ]);

  const status = pick(payload, [["status"], ["order", "status"], ["event"]]);
  if (status === null) {
    return new Response(null, { status: 400 });
  }

  const carrier = pick(payload, [["carrier"], ["order", "carrier"]]);
  const trackingUrl = pick(payload, [
    ["trackingUrl"],
    ["track_trace"],
    ["tracking_url"],
    ["order", "tracking_url"],
    ["order", "track_trace"],
  ]);

  try {
    await handleProboStatus({
      ourOrderId,
      supplierOrderNumber,
      status,
      carrier,
      trackingUrl,
    });
  } catch (err) {
    console.error("[probo-webhook]", err);
    return new Response(null, { status: 500 });
  }

  return new Response(null, { status: 200 });
}
