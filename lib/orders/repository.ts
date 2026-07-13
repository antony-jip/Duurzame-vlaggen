import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  OrderRow,
  OrderItemRow,
  OrderInsert,
  OrderItemInsert,
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

/**
 * Insert an order together with its line items. Retries once on an
 * order_number collision by regenerating the number.
 */
export async function insertOrderWithItems(
  order: Omit<OrderInsert, "order_number"> & { order_number?: string },
  items: OrderItemInsertNoOrderId[],
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
        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(items.map((it) => ({ ...it, order_id: orderRow.id })));
        if (itemsError) {
          throw new Error(`Failed to insert order_items: ${itemsError.message}`);
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
 * Note: no DB-level unique index yet, so this is check-then-insert (a tight
 * race could double-insert). Acceptable for now; add a partial unique index if
 * callbacks ever get noisy.
 */
export async function recordEventOnce(input: {
  orderId: string;
  source: "mollie" | "probo" | "system";
  eventType: string;
  externalId?: string | null;
  data?: Record<string, unknown>;
}): Promise<{ inserted: boolean }> {
  const supabase = createSupabaseAdminClient();
  const externalId = input.externalId ?? null;

  let existing = supabase
    .from("order_events")
    .select("id")
    .eq("order_id", input.orderId)
    .eq("source", input.source)
    .eq("event_type", input.eventType);
  existing = externalId
    ? existing.eq("payload->>external_id", externalId)
    : existing.is("payload->>external_id", null);

  const { data: found, error: selectError } = await existing.maybeSingle();
  if (selectError) throw new Error(`recordEventOnce select failed: ${selectError.message}`);
  if (found) return { inserted: false };

  const payload = { external_id: externalId, ...(input.data ?? {}) } as Json;
  const { error: insertError } = await supabase.from("order_events").insert({
    order_id: input.orderId,
    source: input.source,
    event_type: input.eventType,
    payload,
  });
  if (insertError) throw new Error(`recordEventOnce insert failed: ${insertError.message}`);
  return { inserted: true };
}
