import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrderRow, OrderItemRow } from "@/lib/db/types";

/**
 * Klantportaal-datalaag: orders lezen NAMENS een ingelogde klant.
 *
 * BEVEILIGING (kritisch). Reads gaan via de service-role admin-client (bypasst
 * RLS — er zijn geen permissieve policies), dus filteren we hier ALTIJD expliciet
 * op de server-afgeleide identiteit van de geauthenticeerde sessie:
 *   - `authUserId`  → de klant-koppeling via `customers.auth_user_id`;
 *   - `email`       → het geverifieerde e-mailadres uit `auth.getUser()`.
 * Beide komen uit de Supabase-sessie, NOOIT uit de URL of client-input. Zo ziet
 * een klant uitsluitend zijn eigen orders (incl. eerdere gast-orders op hetzelfde
 * e-mailadres) en kan een gemanipuleerde order-id nooit andermans order tonen.
 */

/** Server-afgeleide identiteit van de ingelogde klant. */
export interface CustomerIdentity {
  authUserId: string;
  email: string;
}

/** Alle customer-id's die aan deze auth-user hangen (meestal één). */
async function customerIdsForAuthUser(authUserId: string): Promise<string[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", authUserId);
  if (error) throw new Error(`customerIdsForAuthUser failed: ${error.message}`);
  return (data ?? []).map((row) => row.id);
}

/**
 * Resolve (of maak) de `customers`-rij voor een ingelogde klant en geef zijn id.
 * Gebruikt door de checkout zodat een order van een ingelogde klant een
 * `customer_id` krijgt. Idempotent: bestaat er al een rij voor deze auth-user,
 * dan wordt die hergebruikt.
 */
export async function getOrCreateCustomerId(
  authUserId: string,
  email: string,
): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const existing = await customerIdsForAuthUser(authUserId);
  if (existing.length > 0) return existing[0];

  const { data, error } = await supabase
    .from("customers")
    .insert({ auth_user_id: authUserId, email })
    .select("id")
    .single();
  if (error) throw new Error(`getOrCreateCustomerId failed: ${error.message}`);
  return data.id;
}

/**
 * Alle orders van de ingelogde klant, nieuwste eerst. Matcht op het geverifieerde
 * sessie-e-mailadres (vangt ook gast-orders) én op de gekoppelde customer-id's.
 * Transient `cart`-orders (nog geen betaling gestart) worden weggelaten.
 */
export async function listCustomerOrders(identity: CustomerIdentity): Promise<OrderRow[]> {
  const supabase = createSupabaseAdminClient();
  const ids = await customerIdsForAuthUser(identity.authUserId);

  const emailFilter = `email.ilike.${identity.email}`;
  const orFilter =
    ids.length > 0 ? `${emailFilter},customer_id.in.(${ids.join(",")})` : emailFilter;

  const { data, error } = await supabase
    .from("orders")
    .select()
    .or(orFilter)
    .neq("status", "cart")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listCustomerOrders failed: ${error.message}`);
  return (data ?? []) as OrderRow[];
}

/**
 * Orderregels voor meerdere orders in één query (dashboard: regelaantal +
 * mini-thumbnail). Neemt alleen id's aan die de aanroeper al als eigen orders
 * van de klant heeft geverifieerd via {@link listCustomerOrders}.
 */
export async function getItemsForOrders(orderIds: string[]): Promise<OrderItemRow[]> {
  if (orderIds.length === 0) return [];
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("order_items")
    .select()
    .in("order_id", orderIds);
  if (error) throw new Error(`getItemsForOrders failed: ${error.message}`);
  return (data ?? []) as OrderItemRow[];
}

/**
 * Eén order van de ingelogde klant, of `null` als de order niet bestaat OF niet
 * bij deze klant hoort. Ownership wordt na het ophalen server-side geverifieerd
 * tegen de sessie-identiteit — nooit vertrouwen we de id uit de URL blind.
 */
export async function getCustomerOrder(
  orderId: string,
  identity: CustomerIdentity,
): Promise<OrderRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select()
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(`getCustomerOrder failed: ${error.message}`);
  const order = data as OrderRow | null;
  if (!order || order.status === "cart") return null;

  const emailMatches = order.email.toLowerCase() === identity.email.toLowerCase();
  if (emailMatches) return order;

  if (order.customer_id) {
    const ids = await customerIdsForAuthUser(identity.authUserId);
    if (ids.includes(order.customer_id)) return order;
  }
  return null;
}
