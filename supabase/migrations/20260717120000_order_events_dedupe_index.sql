-- =============================================================================
-- order_events: DB-level idempotentie voor async callbacks.
--
-- `recordEventOnce` (lib/orders/repository.ts) was check-then-insert ZONDER
-- backing index: twee gelijktijdige Mollie-webhook-leveringen (Mollie hertest
-- agressief) kunnen allebei `hasEvent=false` zien en allebei doorlopen, wat een
-- dubbel materiaalpaspoort / dubbele portaalmail geeft.
--
-- Deze partiële unieke index maakt de dedupe-sleutel
-- (order_id, source, event_type, payload->>'external_id') hard uniek — maar
-- ALLEEN voor de dedupe-bedoelde bronnen. `source = 'portal'` is bewust
-- uitgezonderd: die events mógen legitiem herhalen (een klant die hetzelfde
-- ontwerp twee keer vervangt, app/api/portal/route.ts).
--
-- NULL-external_id-rijen blijven distinct (Postgres-default), dus events zonder
-- external_id vallen nog terug op de check-then-insert — die dragen niet het
-- Mollie-retry-risico. Draait op een lege/schone tabel vóór livegang; bestaan
-- er al duplicaten, ruim die eerst op.
-- =============================================================================

create unique index if not exists order_events_dedupe_uidx
  on order_events (order_id, source, event_type, (payload ->> 'external_id'))
  where source <> 'portal';
