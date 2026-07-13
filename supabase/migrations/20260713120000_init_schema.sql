-- =============================================================================
-- Duurzame-Vlaggen.nl — initial schema (build spec §6)
-- Enum + 5 tables + RLS + Storage bucket. All writes happen server-side via the
-- service-role key (which bypasses RLS). RLS is enabled with NO permissive
-- policies, so anon/authenticated clients get nothing until account features are
-- added deliberately later.
-- =============================================================================

-- gen_random_uuid() is core in Postgres 13+ (Supabase runs 15+), no extension needed.

-- ---------------------------------------------------------------------------
-- Enum: order status (state machine, spec §11 — forward-only in app logic)
-- ---------------------------------------------------------------------------
create type order_status as enum (
  'cart',
  'awaiting_payment',
  'paid',
  'sent_to_probo',
  'probo_accepted',
  'in_production',
  'shipped',
  'payment_failed',
  'probo_rejected',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
create table customers (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid references auth.users(id),   -- nullable: guest checkout allowed
  email         text not null,
  company_name  text,
  vat_number    text,
  addresses     jsonb not null default '[]'::jsonb,  -- saved addresses in Probo format
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index customers_auth_user_id_idx on customers (auth_user_id);
create index customers_email_idx on customers (email);

create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text unique not null,           -- "DV-" prefix (generated app-side)
  market            text not null,                  -- nl-NL | nl-BE | de-DE | fr-FR | en
  currency          text not null default 'EUR',
  customer_id       uuid references customers(id),  -- nullable for guest
  email             text not null,
  phone             text,

  status            order_status not null default 'cart',

  billing_address   jsonb,                          -- Probo address format
  shipping_address  jsonb,                          -- Probo address format

  -- VAT (spec §9)
  is_business       boolean not null default false,
  vat_number        text,
  vat_number_valid  boolean,                        -- VIES result
  vat_validated_at  timestamptz,
  reverse_charge    boolean not null default false,
  vat_rate          numeric(5,2),                   -- applied %, snapshot

  -- Money (all ex-VAT unless noted, spec §10)
  subtotal_ex_vat   numeric(12,2),
  shipping_cost     numeric(12,2),
  vat_amount        numeric(12,2),
  total             numeric(12,2),

  -- Mollie (spec §8)
  mollie_payment_id text,
  mollie_status     text,

  -- Probo (spec §7)
  probo_order_id    text,
  probo_status      text,
  carrier           text,
  tracking_url      text,

  created_at        timestamptz not null default now(),
  paid_at           timestamptz,
  ordered_at        timestamptz,                    -- sent to Probo
  shipped_at        timestamptz,
  updated_at        timestamptz not null default now()
);

create index orders_customer_id_idx on orders (customer_id);
create index orders_status_idx on orders (status);
create index orders_email_idx on orders (email);
create index orders_mollie_payment_id_idx on orders (mollie_payment_id);
create index orders_probo_order_id_idx on orders (probo_order_id);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- order_items
-- Reflects the VERIFIED Probo flow (differs from the old spec §6):
--   * calculation_id  — the spine: configure → price → uploader → order all
--                       reference this id returned by /products/configure.
--   * uploader_id + uploader_external_id — an uploader session is referenced in
--     the order via `uploaders: [{ id, external_id }]`. Both values are needed;
--     the old single `uploader_session_id` is dropped.
--   * base_price = Probo purchase_price (our cost, from /price:
--     products_purchase_price). markup_pct (default 50%) is applied on top.
-- ---------------------------------------------------------------------------
create table order_items (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid not null references orders(id) on delete cascade,
  probo_product_code   text not null,                -- e.g. banner-510
  product_type         text not null,                -- baniervlag | mastvlag | ...
  product_name         text,                         -- localized snapshot
  configuration        jsonb not null,               -- full Probo options payload
  amount               integer not null,

  -- Probo configure/uploader linkage (verified)
  calculation_id       text,                         -- from /products/configure
  uploader_id          bigint,                       -- uploader session id
  uploader_external_id bigint,                        -- uploader session external_id
  uploader_status      text,
  file_url             text,

  -- Money (spec §10)
  base_price           numeric(12,2),                -- Probo purchase_price (cost)
  markup_pct           numeric(5,2) not null default 50.00,
  line_price           numeric(12,2),                -- base_price * (1 + markup/100)

  created_at           timestamptz not null default now()
);

create index order_items_order_id_idx on order_items (order_id);

-- ---------------------------------------------------------------------------
-- order_events (idempotency + audit for async callbacks, spec §6/§11)
-- ---------------------------------------------------------------------------
create table order_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  source      text not null,                        -- mollie | probo | system
  event_type  text not null,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

create index order_events_order_id_idx on order_events (order_id);

-- ---------------------------------------------------------------------------
-- media_assets (WordPress → Supabase Storage migration mapping, spec §6/§13)
-- ---------------------------------------------------------------------------
create table media_assets (
  id            uuid primary key default gen_random_uuid(),
  wp_id         integer,                        -- original WordPress media ID
  wp_url        text not null,                  -- original WordPress source_url
  storage_path  text not null,                  -- path in Supabase Storage bucket
  storage_url   text not null,                  -- public URL in Supabase Storage
  filename      text,
  mime_type     text,
  alt_text      text,                           -- carried over from WP where present
  migrated_at   timestamptz not null default now()
);

create index media_assets_wp_id_idx on media_assets (wp_id);
create index media_assets_wp_url_idx on media_assets (wp_url);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Enabled on every table. No permissive policies: all access goes through the
-- service-role key server-side, which bypasses RLS. When Supabase Auth accounts
-- are introduced, add self-read policies (customers/orders/order_items keyed on
-- auth_user_id) in a later migration.
-- ---------------------------------------------------------------------------
alter table customers   enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;
alter table order_events enable row level security;
alter table media_assets enable row level security;

-- ---------------------------------------------------------------------------
-- Storage bucket: product-media (public read). Populated later (spec §13).
-- Customer artwork NEVER lands here — that goes to Probo's white-label uploader.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;
