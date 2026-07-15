-- =============================================================================
-- SEO-analytics — dagelijkse Search Console-snapshots + de benut-lus.
--
-- Twee tabellen met twee heel verschillende doelen:
--
--  * gsc_snapshots   — feiten van Google, elke dag opgehaald. GSC bewaart zelf
--                      maar 16 maanden en toont geen trend-deltas; zonder eigen
--                      historie kun je nooit zien wat NIEUW is of of een actie
--                      geholpen heeft.
--  * seo_kans_acties — wat WIJ met een kans gedaan hebben. Alleen geschreven op
--                      expliciete actie van de gebruiker (de toggle), nooit
--                      afgeleid of stilletjes bijgewerkt.
--
-- RLS: aan, zonder policies — net als de rest van dit schema. Alle toegang loopt
-- server-side via de service-role key.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- gsc_snapshots
--
-- De samengestelde PK (dag, markt, dimensie, sleutel) is wat de cron idempotent
-- maakt: Google finaliseert data 2-3 dagen te laat en vult met terugwerkende
-- kracht aan, dus de cron her-upsert een rollend venster en late correcties
-- overschrijven zichzelf. Twee keer draaien op één dag is daardoor gratis.
-- ---------------------------------------------------------------------------
create table gsc_snapshots (
  dag         date not null,
  -- Nu altijd 'nl-NL'; kolom bestaat vast voor de vier andere marktdomeinen,
  -- die elk hun eigen GSC-property krijgen zodra ze live staan.
  markt       text not null default 'nl-NL',
  dimensie    text not null check (dimensie in ('query', 'pagina')),
  sleutel     text not null,                  -- het zoekwoord of het pad
  clicks      integer not null default 0,
  impressies  integer not null default 0,
  ctr         real not null default 0,        -- fractie 0..1, zoals GSC 'm levert
  positie     real not null default 0,        -- 1 = bovenaan
  captured_at timestamptz not null default now(),
  primary key (dag, markt, dimensie, sleutel)
);

-- Het dashboard leest altijd "laatste N dagen van één dimensie".
create index gsc_snapshots_dim_dag_idx on gsc_snapshots (dimensie, dag desc);
-- Voor de per-zoekwoord-tijdlijn (heeft een actie geholpen?).
create index gsc_snapshots_sleutel_idx on gsc_snapshots (sleutel, dag desc);

-- ---------------------------------------------------------------------------
-- seo_kans_acties
--
-- Eén rij per keer dat je een kans oppakt. MEERDERE rijen per sleutel is de
-- bedoeling: dat is de geschiedenis. De nieuwste rij is de huidige stand.
--
-- `positie_bij` / `impressies_bij` leggen de stand vast op het moment van
-- benutten, zodat we later kunnen meten of het geholpen heeft zonder de
-- snapshots opnieuw te hoeven uitvlooien.
-- ---------------------------------------------------------------------------
create table seo_kans_acties (
  id             uuid primary key default gen_random_uuid(),
  -- Het zoekwoord (doel) of de kans-sleutel. Vrij tekstveld: de doelenlijst
  -- leeft in code (lib/analytics/naar-nummer1.ts), niet in de database.
  sleutel        text not null,
  -- Waar de kans vandaan kwam: 'doel' (Naar #1) of 'kans' (lage CTR e.d.).
  bron           text not null default 'doel' check (bron in ('doel', 'kans')),
  status         text not null check (status in ('opgepakt', 'benut')),

  -- Stand op het moment van vastleggen.
  positie_bij    numeric(5,1),
  impressies_bij integer,

  notitie        text,
  aangemaakt_op  timestamptz not null default now(),
  benut_op       timestamptz
);

-- Nieuwste rij per sleutel opzoeken.
create index seo_kans_acties_sleutel_idx on seo_kans_acties (sleutel, aangemaakt_op desc);

-- ---------------------------------------------------------------------------
-- RLS: aan, geen policies. Anon/authenticated krijgen niets; alle toegang loopt
-- via de service-role (die RLS omzeilt) vanuit server-code.
-- ---------------------------------------------------------------------------
alter table gsc_snapshots   enable row level security;
alter table seo_kans_acties enable row level security;
