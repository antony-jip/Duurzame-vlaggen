-- =============================================================================
-- Multi-design assignments, "later aanleveren" portal, and lifecycle emails.
--
-- 1. order_item_designs — N design assignments per order_item, each covering a
--    `quantity` of that line. A row with file_url IS NULL is a pending
--    assignment ("later aanleveren"). App logic guarantees the quantities of an
--    item's designs sum to order_items.amount at checkout.
--    order_items.file_url stays for pre-existing rows but is no longer written;
--    this table is the source of truth for customer artwork.
--
-- 2. orders.portal_token / portal_expires_at — bearer credential for the
--    no-login delivery portal (/aanleveren/[token]). Unguessable (32 random
--    bytes, base64url), scoped to one order, expires 90 days after creation.
--    orders.reorder_token — long-lived token for the one-click re-order links
--    in the 4/8-month lifecycle emails (/opnieuw/[token]).
--
-- 3. marketing_suppressions — AVG/GDPR opt-out list for lifecycle (marketing)
--    emails, keyed by lowercased e-mail. Transactional mail ignores this list.
--
-- 4. order_status gains 'awaiting_files' ("wacht op bestand"): a paid order
--    with pending design assignments parks here until every file is in, then
--    proceeds to sent_to_probo. Transition matrix lives in app logic
--    (lib/orders/state-machine.ts), as before.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Design assignments per order line
-- ---------------------------------------------------------------------------
create table order_item_designs (
  id             uuid primary key default gen_random_uuid(),
  order_item_id  uuid not null references order_items(id) on delete cascade,
  quantity       integer not null,
  file_url       text,                                -- null = later aanleveren
  file_path      text,                                -- storage key in order-artwork
  file_name      text,
  file_warnings  jsonb not null default '[]'::jsonb,  -- non-blocking quality warnings
  uploaded_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index order_item_designs_order_item_id_idx
  on order_item_designs (order_item_id);
-- Portal/cleanup look files up by storage key.
create index order_item_designs_file_path_idx
  on order_item_designs (file_path);

create trigger order_item_designs_set_updated_at
  before update on order_item_designs
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Portal + re-order tokens on orders
-- ---------------------------------------------------------------------------
alter table orders
  add column portal_token      text unique,
  add column portal_expires_at timestamptz,
  add column reorder_token     text unique;

-- ---------------------------------------------------------------------------
-- 3. Marketing opt-out (AVG)
-- ---------------------------------------------------------------------------
create table marketing_suppressions (
  email      text primary key,                        -- lowercased
  reason     text,                                    -- unsubscribe | checkout_opt_out | ...
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. New order status
-- ---------------------------------------------------------------------------
alter type order_status add value if not exists 'awaiting_files';

-- ---------------------------------------------------------------------------
-- RLS — same posture as the rest of the schema: enabled, no permissive
-- policies; all access goes through the service-role key server-side.
-- ---------------------------------------------------------------------------
alter table order_item_designs    enable row level security;
alter table marketing_suppressions enable row level security;
