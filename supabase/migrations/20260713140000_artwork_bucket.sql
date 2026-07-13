-- ---------------------------------------------------------------------------
-- Storage bucket: order-artwork (public read).
--
-- Holds customer-supplied print files (design artwork) for orders. Probo pulls
-- the file by public URL via the order request's `products[].files[].uri`
-- (the "supply files for an order request" flow), so the bucket MUST be public.
-- Paths use unguessable UUIDs; allowed types mirror what Probo accepts.
--
-- (The alternative — Probo's white-label uploader — was NOT chosen; artwork is
-- stored here and passed to Probo by URL.)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'order-artwork',
  'order-artwork',
  true,
  52428800, -- 50 MB
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do nothing;
