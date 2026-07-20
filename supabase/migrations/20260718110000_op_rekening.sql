-- =============================================================================
-- Betalen op rekening (eigen flow, vervangt de Mollie/Billie-route).
--
-- Een op-rekening-order krijgt bij plaatsing een Mollie-betaallink (Payment
-- Links API) in plaats van een gewone betaling. De order parkeert op de
-- bestaande status 'awaiting_payment'; pas als de betaling via de link binnen
-- is (webhook), gaat hij door het normale pad naar 'paid'. Geen nieuwe
-- statussen, geen parallel statusmodel.
--
-- 1. orders.mollie_payment_link_id — het pl_…-id van de betaallink. Non-null
--    markeert de order als "op rekening" (mollie_payment_id blijft leeg tot de
--    onderliggende betaling bestaat; de webhook vult hem bij betaling in).
-- 2. orders.mollie_payment_link_url — de betaal-URL zelf, zodat factuur- en
--    herinneringsmail hem kunnen tonen zonder Mollie opnieuw te bevragen.
-- 3. orders.payment_reminder_sent_at — stempel van de eenmalige
--    betaalherinnering (cron /api/cron/betaalherinnering, 7 dagen na
--    plaatsing). De cron claimt dit veld vóór het versturen, dus de
--    herinnering gaat hoogstens één keer de deur uit.
-- =============================================================================

alter table orders
  add column mollie_payment_link_id  text,
  add column mollie_payment_link_url text,
  add column payment_reminder_sent_at timestamptz;

comment on column orders.mollie_payment_link_id is
  'Mollie-betaallink (pl_…) voor op-rekening-orders; non-null = op rekening.';
comment on column orders.mollie_payment_link_url is
  'Betaal-URL van de Mollie-betaallink, voor factuur- en herinneringsmail.';
comment on column orders.payment_reminder_sent_at is
  'Wanneer de eenmalige betaalherinnering is verstuurd (null = nog niet).';
