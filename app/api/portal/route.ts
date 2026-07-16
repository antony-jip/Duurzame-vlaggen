/**
 * Aanleverportaal-API — koppelt (of vervangt) een ontwerpbestand aan een
 * design-toewijzing via het no-login portaal (/aanleveren/[token]).
 *
 * Het portaal-token is een bearer-credential: onraadbaar (32 random bytes),
 * beperkt tot één order, en verloopt PORTAL_TTL_DAYS na plaatsing. De upload
 * zelf hergebruikt de bestaande /api/artwork sign/finalize-flow (browser →
 * Storage); deze route bindt alleen een gefinaliseerd object aan een
 * toewijzing:
 *
 *   POST { action: "attach", token, designId, path, warnings? }
 *     → valideer token/order/design/pad, controleer de magic bytes van het
 *       object, werk order_item_designs bij, schrijf een order_events-regel,
 *       en mail ons. Is dit het laatste ontbrekende bestand, dan meldt die
 *       mail dat de order compleet is — er is GEEN automatische vervolgstap,
 *       want bestellen bij Probo gaat met de hand ("Markeer besteld").
 *       Vervangen bestanden worden uit Storage verwijderd zodra geen enkele
 *       order ze meer refereert.
 *
 * Bewerkbaar zolang de order awaiting_payment/paid/awaiting_files is; vanaf
 * sent_to_probo zijn de bestanden overgedragen en is het portaal dicht.
 */

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publicEnv, serverEnv } from "@/lib/env";
import { sniffKind } from "@/lib/artwork/sniff";
import { isValidArtworkPath } from "@/lib/artwork/paths";
import {
  countPendingDesigns,
  getDesignById,
  getOrderByPortalToken,
  getOrderItems,
  isPortalExpired,
  recordEvent,
  updateDesignFile,
} from "@/lib/orders/repository";
import { sendMailInhoud } from "@/lib/email/send";
import { portaalNotificatie } from "@/lib/email/templates";
import type { OrderStatus } from "@/lib/db/types";

export const runtime = "nodejs";

const BUCKET = "order-artwork";

/** Statussen waarin de klant nog bestanden mag aanleveren/vervangen. */
const EDITABLE_STATUSES: readonly OrderStatus[] = [
  "awaiting_payment",
  "paid",
  "awaiting_files",
];

// Best-effort in-memory rate limit, per IP per instance (spiegelt /api/artwork).
const MAX_HITS = 60;
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
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

function publicUrlFor(path: string): string {
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

function bad(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Verwijder een storage-object tenzij een order het nog refereert (legacy
 * order_items.file_url of een design-toewijzing). Best-effort: fouten worden
 * gelogd, nooit doorgegeven — een zwerfbestand ruimt cleanup-artwork.ts op.
 */
async function removeIfUnreferenced(path: string): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    const [{ data: legacy }, { data: designs }] = await Promise.all([
      supabase.from("order_items").select("id").eq("file_url", publicUrlFor(path)).limit(1),
      supabase.from("order_item_designs").select("id").eq("file_path", path).limit(1),
    ]);
    if ((legacy?.length ?? 0) > 0 || (designs?.length ?? 0) > 0) return;
    await supabase.storage.from(BUCKET).remove([path]);
  } catch (err) {
    console.error(
      `[portal] opruimen van vervangen bestand mislukt (${path}):`,
      err instanceof Error ? err.message : err,
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (rateLimited(`portal:${clientIp(request)}`)) {
    return bad("Te veel verzoeken. Wacht even en probeer opnieuw.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Ongeldig verzoek.", 400);
  }
  if (typeof body !== "object" || body === null) return bad("Ongeldig verzoek.", 400);

  const { action, token, designId, path, warnings } = body as {
    action?: unknown;
    token?: unknown;
    designId?: unknown;
    path?: unknown;
    warnings?: unknown;
  };
  if (action !== "attach") return bad("Onbekende actie.", 400);
  if (typeof token !== "string" || typeof designId !== "string") {
    return bad("Ongeldig verzoek.", 400);
  }
  if (!isValidArtworkPath(path)) return bad("Ongeldig bestandspad.", 400);

  // --- Token → order (de bearer-check) ----------------------------------------
  const order = await getOrderByPortalToken(token);
  if (!order) return bad("Deze link is niet geldig.", 404);
  if (isPortalExpired(order)) {
    return bad("Deze link is verlopen. Neem contact met ons op.", 410);
  }
  if (!EDITABLE_STATUSES.includes(order.status)) {
    return bad("Je bestelling is al besteld; bestanden zijn niet meer te wijzigen.", 409);
  }

  // --- Design moet bij deze order horen ----------------------------------------
  const design = await getDesignById(designId);
  if (!design) return bad("Ontwerp niet gevonden.", 404);
  const items = await getOrderItems(order.id);
  const item = items.find((it) => it.id === design.order_item_id);
  if (!item) return bad("Ontwerp niet gevonden.", 404);

  // --- Het object moet bestaan en écht PDF/JPG/PNG zijn -------------------------
  const url = publicUrlFor(path);
  let head: Uint8Array | null = null;
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-63" }, cache: "no-store" });
    if (res.ok || res.status === 206) head = new Uint8Array(await res.arrayBuffer());
  } catch {
    head = null;
  }
  if (!head || head.length === 0 || !sniffKind(head)) {
    return bad("Bestand niet gevonden. Upload opnieuw.", 404);
  }

  const replaced = design.file_url !== null;
  const previousPath = design.file_path;
  const previousUrl = design.file_url;
  const fileName = path.slice(37) || "ontwerp";
  const safeWarnings = Array.isArray(warnings)
    ? warnings.filter((w): w is string => typeof w === "string")
    : [];

  await updateDesignFile(design.id, {
    file_url: url,
    file_path: path,
    file_name: fileName,
    file_warnings: safeWarnings,
  });

  // Compat: account/herbestellen/admin tonen het eerste ontwerp via
  // order_items.file_url. Vul hem wanneer de regel er nog geen had, en volg
  // een vervanging van precies dát bestand.
  if (!item.file_url || item.file_url === previousUrl) {
    const supabase = createSupabaseAdminClient();
    await supabase.from("order_items").update({ file_url: url }).eq("id", item.id);
  }

  const pending = await countPendingDesigns(order.id);
  const kind = replaced ? ("replaced" as const) : ("delivered" as const);

  await recordEvent({
    orderId: order.id,
    source: "portal",
    eventType: `design.${kind}`,
    externalId: design.id,
    data: { file_name: fileName, item: item.product_name ?? item.probo_product_code, pending },
  });

  // Notificatie naar ons; bij pending === 0 is dit het sein "alles binnen,
  // bestel maar bij Probo".
  const notifyTo = serverEnv.orderNotifyEmail;
  if (notifyTo) {
    await sendMailInhoud(
      notifyTo,
      portaalNotificatie({
        order,
        kind,
        fileName,
        itemLabel: item.product_name ?? item.probo_product_code,
        remainingPending: pending,
        adminUrl: `${publicEnv.appUrl}/admin/orders/${order.id}`,
      }),
    );
  }

  // Vervangen bestand: oude object weg zodra niets het meer refereert.
  if (replaced && previousPath && previousPath !== path) {
    await removeIfUnreferenced(previousPath);
  }

  return NextResponse.json({
    ok: true,
    design: { id: design.id, fileUrl: url, fileName, warnings: safeWarnings },
    pending,
  });
}
