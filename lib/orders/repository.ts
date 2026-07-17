import "server-only";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  OrderRow,
  OrderItemRow,
  OrderItemDesignRow,
  OrderInsert,
  OrderItemInsert,
  OrderItemDesignInsert,
  OrderStatus,
  Json,
} from "@/lib/db/types";
import { assertTransition, timestampColumnFor } from "@/lib/orders/state-machine";
import { generateOrderNumber } from "@/lib/orders/numbers";

/**
 * Data-access layer for orders. All writes go through the service-role admin
 * client (bypasses RLS — there are no permissive policies). Business rules
 * (which transition, which price) live in orchestration; this module just reads
 * and writes rows, plus two safety helpers: `advanceOrderStatus` (enforces the
 * state machine + stamps timestamps) and `recordEventOnce` (idempotency for
 * async Mollie/Probo callbacks).
 */

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = "23505";

type OrderItemInsertNoOrderId = Omit<OrderItemInsert, "order_id">;
type DesignInsertNoItemId = Omit<OrderItemDesignInsert, "order_item_id">;

/** Een orderregel om in te voegen, mét zijn design-toewijzingen (mag leeg). */
export type OrderItemWithDesigns = OrderItemInsertNoOrderId & {
  designs?: DesignInsertNoItemId[];
};

/**
 * Insert an order together with its line items and their design assignments.
 * Retries once on an order_number collision by regenerating the number.
 * Item-ids worden app-side gegenereerd zodat de designrijen ernaar kunnen
 * verwijzen zonder read-back.
 */
export async function insertOrderWithItems(
  order: Omit<OrderInsert, "order_number"> & { order_number?: string },
  items: OrderItemWithDesigns[],
): Promise<OrderRow> {
  const supabase = createSupabaseAdminClient();

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const order_number = order.order_number ?? generateOrderNumber();
    const { data, error } = await supabase
      .from("orders")
      .insert({ ...order, order_number })
      .select()
      .single();

    if (!error && data) {
      const orderRow = data as OrderRow;
      if (items.length > 0) {
        const withIds = items.map((it) => ({ ...it, id: it.id ?? randomUUID() }));
        const { error: itemsError } = await supabase.from("order_items").insert(
          withIds.map((it) => {
            const { designs, ...row } = it;
            void designs; // designrijen gaan hieronder naar hun eigen tabel
            return { ...row, order_id: orderRow.id };
          }),
        );
        if (itemsError) {
          throw new Error(`Failed to insert order_items: ${itemsError.message}`);
        }

        const designRows = withIds.flatMap((it) =>
          (it.designs ?? []).map((d) => ({ ...d, order_item_id: it.id })),
        );
        if (designRows.length > 0) {
          const { error: designsError } = await supabase
            .from("order_item_designs")
            .insert(designRows);
          if (designsError) {
            throw new Error(
              `Failed to insert order_item_designs: ${designsError.message}`,
            );
          }
        }
      }
      return orderRow;
    }

    lastError = error;
    // Only retry on order_number collision; anything else is fatal.
    if (error?.code !== UNIQUE_VIOLATION || order.order_number) break;
  }

  throw new Error(
    `Failed to insert order: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

/**
 * List orders for the admin back-office, newest first. Optionally filter on a
 * single status. Reads via the service-role admin client (bypasses RLS), so it
 * MUST only be called behind the admin auth-gate.
 */
export async function listOrders(opts?: { status?: OrderStatus }): Promise<OrderRow[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("orders").select().order("created_at", { ascending: false });
  if (opts?.status) {
    query = query.eq("status", opts.status);
  }
  const { data, error } = await query;
  if (error) throw new Error(`listOrders failed: ${error.message}`);
  return (data ?? []) as OrderRow[];
}

export async function getOrderById(id: string): Promise<OrderRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("orders").select().eq("id", id).maybeSingle();
  if (error) throw new Error(`getOrderById failed: ${error.message}`);
  return data as OrderRow | null;
}

export async function getOrderByMolliePaymentId(paymentId: string): Promise<OrderRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select()
    .eq("mollie_payment_id", paymentId)
    .maybeSingle();
  if (error) throw new Error(`getOrderByMolliePaymentId failed: ${error.message}`);
  return data as OrderRow | null;
}

export async function getOrderByProboOrderId(proboOrderId: string): Promise<OrderRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select()
    .eq("probo_order_id", proboOrderId)
    .maybeSingle();
  if (error) throw new Error(`getOrderByProboOrderId failed: ${error.message}`);
  return data as OrderRow | null;
}

export async function getOrderItems(orderId: string): Promise<OrderItemRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("order_items").select().eq("order_id", orderId);
  if (error) throw new Error(`getOrderItems failed: ${error.message}`);
  return (data ?? []) as OrderItemRow[];
}

// --- Design-toewijzingen --------------------------------------------------------

/** Alle design-toewijzingen van een order, gegroepeerd op order_item_id. */
export async function getOrderDesigns(
  orderId: string,
): Promise<Map<string, OrderItemDesignRow[]>> {
  const supabase = createSupabaseAdminClient();
  const items = await getOrderItems(orderId);
  const map = new Map<string, OrderItemDesignRow[]>();
  if (items.length === 0) return map;

  const { data, error } = await supabase
    .from("order_item_designs")
    .select()
    .in(
      "order_item_id",
      items.map((it) => it.id),
    )
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getOrderDesigns failed: ${error.message}`);

  for (const row of (data ?? []) as OrderItemDesignRow[]) {
    const list = map.get(row.order_item_id) ?? [];
    list.push(row);
    map.set(row.order_item_id, list);
  }
  return map;
}

export async function getDesignById(id: string): Promise<OrderItemDesignRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("order_item_designs")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getDesignById failed: ${error.message}`);
  return data as OrderItemDesignRow | null;
}

/** Koppel (of vervang) het bestand van een design-toewijzing. */
export async function updateDesignFile(
  id: string,
  file: { file_url: string; file_path: string; file_name: string; file_warnings: Json },
): Promise<OrderItemDesignRow> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("order_item_designs")
    .update({ ...file, uploaded_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`updateDesignFile failed: ${error.message}`);
  return data as OrderItemDesignRow;
}

/** Aantal design-toewijzingen op de order dat nog geen bestand heeft. */
export async function countPendingDesigns(orderId: string): Promise<number> {
  const designs = await getOrderDesigns(orderId);
  let pending = 0;
  for (const list of designs.values()) {
    pending += list.filter((d) => d.file_url === null).length;
  }
  return pending;
}

// --- Token-lookups ---------------------------------------------------------------

/** Is de portaallink van deze order verlopen? */
export function isPortalExpired(order: Pick<OrderRow, "portal_expires_at">): boolean {
  return (
    order.portal_expires_at !== null && Date.parse(order.portal_expires_at) < Date.now()
  );
}

/** Zoek een order op portaal-token. Verval checkt de aanroeper (isPortalExpired). */
export async function getOrderByPortalToken(token: string): Promise<OrderRow | null> {
  if (!token) return null;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select()
    .eq("portal_token", token)
    .maybeSingle();
  if (error) throw new Error(`getOrderByPortalToken failed: ${error.message}`);
  return data as OrderRow | null;
}

export async function getOrderByReorderToken(token: string): Promise<OrderRow | null> {
  if (!token) return null;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select()
    .eq("reorder_token", token)
    .maybeSingle();
  if (error) throw new Error(`getOrderByReorderToken failed: ${error.message}`);
  return data as OrderRow | null;
}

/**
 * Verzonden orders waarvan shipped_at in [from, to) valt. Gebruikt door de
 * lifecycle-cron om de 4/8-maanden-cohorten te vinden.
 */
export async function listShippedOrdersBetween(
  fromIso: string,
  toIso: string,
): Promise<OrderRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select()
    .eq("status", "shipped")
    .gte("shipped_at", fromIso)
    .lt("shipped_at", toIso)
    .order("shipped_at", { ascending: true });
  if (error) throw new Error(`listShippedOrdersBetween failed: ${error.message}`);
  return (data ?? []) as OrderRow[];
}

// --- Marketing-suppressies (AVG opt-out) ------------------------------------------

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("marketing_suppressions")
    .select("email")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw new Error(`isEmailSuppressed failed: ${error.message}`);
  return data !== null;
}

/** Zet een e-mailadres op de opt-out-lijst voor lifecycle-mail (idempotent). */
export async function suppressEmail(email: string, reason: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("marketing_suppressions")
    .upsert({ email: email.trim().toLowerCase(), reason }, { onConflict: "email" });
  if (error) throw new Error(`suppressEmail failed: ${error.message}`);
}

/**
 * Verwijder een order definitief. De foreign keys ruimen regels, designs en
 * events mee op (on delete cascade); artwork-objecten in Storage worden
 * wezen en later geveegd door scripts/cleanup-artwork.ts.
 */
export async function deleteOrder(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw new Error(`deleteOrder failed: ${error.message}`);
}

export type OrderPatch = Partial<Omit<OrderInsert, "order_number">>;

export async function updateOrder(id: string, patch: OrderPatch): Promise<OrderRow> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("orders").update(patch).eq("id", id).select().single();
  if (error) throw new Error(`updateOrder failed: ${error.message}`);
  return data as OrderRow;
}

/**
 * Move an order to `to`, enforcing the state machine and stamping the matching
 * timestamp column. Idempotent no-op if the order is already in `to`. Extra
 * column updates (e.g. mollie/probo ids) can be merged via `extra`.
 */
export async function advanceOrderStatus(
  id: string,
  to: OrderStatus,
  extra: OrderPatch = {},
): Promise<OrderRow> {
  const current = await getOrderById(id);
  if (!current) throw new Error(`advanceOrderStatus: order ${id} not found`);
  if (current.status === to) {
    // Already there — treat as success (idempotent callbacks), but still apply extra.
    return Object.keys(extra).length ? updateOrder(id, extra) : current;
  }
  assertTransition(current.status, to);

  const patch: OrderPatch = { ...extra, status: to };
  const tsColumn = timestampColumnFor(to);
  if (tsColumn && !(tsColumn in patch)) {
    patch[tsColumn] = new Date().toISOString();
  }
  return updateOrder(id, patch);
}

/**
 * Append an order_event exactly once. Dedupe key = (order_id, source,
 * event_type, external_id). Used so a Mollie/Probo callback that fires twice
 * only mutates state once. `external_id` is stored inside the payload.
 *
 * Een partiële unieke index (`order_events_dedupe_uidx`, migratie
 * 20260717120000, alle bronnen behalve `portal`) dekt de race af: verliest een
 * gelijktijdige tweede insert alsnog, dan gooit die 23505 en hertest de webhook
 * (Mollie), waarna `hasEvent` 'm dedupliceert. Optionele verfijning: die 23505
 * hier opvangen en als `{ inserted: false }` behandelen om de 500 te vermijden.
 */
export async function recordEventOnce(input: {
  orderId: string;
  source: EventSource;
  eventType: string;
  externalId?: string | null;
  data?: Record<string, unknown>;
}): Promise<{ inserted: boolean }> {
  const externalId = input.externalId ?? null;

  const exists = await hasEvent({
    orderId: input.orderId,
    source: input.source,
    eventType: input.eventType,
    externalId,
  });
  if (exists) return { inserted: false };

  await recordEvent(input);
  return { inserted: true };
}

export type EventSource = "mollie" | "probo" | "system" | "portal";

/** Bestaat er al een event met exact deze dedupe-sleutel? */
export async function hasEvent(input: {
  orderId: string;
  source: EventSource;
  eventType: string;
  externalId?: string | null;
}): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const externalId = input.externalId ?? null;

  let query = supabase
    .from("order_events")
    .select("id")
    .eq("order_id", input.orderId)
    .eq("source", input.source)
    .eq("event_type", input.eventType);
  query = externalId
    ? query.eq("payload->>external_id", externalId)
    : query.is("payload->>external_id", null);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`hasEvent select failed: ${error.message}`);
  return data !== null;
}

/**
 * Schrijf een order_event ONVOORWAARDELIJK (geen dedupe). Voor gebeurtenissen
 * die legitiem mogen herhalen, zoals een klant die via het portaal twee keer
 * hetzelfde ontwerp vervangt.
 */
export async function recordEvent(input: {
  orderId: string;
  source: EventSource;
  eventType: string;
  externalId?: string | null;
  data?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const payload = { external_id: input.externalId ?? null, ...(input.data ?? {}) } as Json;
  const { error } = await supabase.from("order_events").insert({
    order_id: input.orderId,
    source: input.source,
    event_type: input.eventType,
    payload,
  });
  if (error) throw new Error(`recordEvent insert failed: ${error.message}`);
}
