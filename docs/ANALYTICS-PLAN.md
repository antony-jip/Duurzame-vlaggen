# Analytics + SEO — Duurzame-Vlaggen

> Herschreven 2026-07-15, ná het aansluiten van Search Console. De eerste versie
> van dit document ging uit van "we hebben rankings die we bij de migratie moeten
> beschermen". **Dat bleek niet zo.** De echte cijfers staan hieronder; het plan
> is daarop aangepast.
>
> Gekozen richting: Vercel Analytics + Google Search Console (signcompany-model).
> Geen PostHog, geen eigen event-ingest.

---

## 1. De meting (16 maanden GSC, opgehaald 2026-07-15)

Property: `sc-domain:duurzame-vlaggen.nl`. Data begint januari 2026.

**Totaal: 32 klikken · 1.410 vertoningen · gemiddelde positie 15.9.**
16 zoekwoorden en 11 pagina's met überhaupt een vertoning. De homepage is 31 van
de 32 klikken.

### De site staat offline (bewust) en Google ruimt op

`duurzame-vlaggen.nl` geeft **HTTP 503 op elke pagina**, ook voor een gewone
browser (`Retry-After: 600`, host = WordPress.com). Bevestigd door Antony: de site
staat bewust uit. Google weet dat niet en deïndexeert:

| Maand | Klikken | Vertoningen |
|---|---|---|
| 2026-01 | 9 | 140 |
| 2026-02 | 10 | 287 |
| 2026-03 | 0 | 180 |
| 2026-04 | 10 | 476 |
| 2026-05 | 2 | 279 |
| 2026-06 | 1 | 32 |
| 2026-07 | 0 | 16 |

97% van de vertoningen weg sinds april. `robots.txt` geeft een 408, `sitemap.xml`
nog wel een 200.

### Wat er rankt

| Zoekwoord | Klikken | Vertoningen | Positie |
|---|---|---|---|
| **duurzame vlaggen** | **16** | **521** | **9.7** |
| duurzame vlag | 0 | 141 | 10.7 |
| duurzame vlaggen drukken | 0 | 113 | 37.4 |
| duurzame vlaggen bedrukken | 0 | 85 | 46.7 |
| duurzame vlaggenstokken | 0 | 40 | 27.7 |
| bedrijfsvlag | 0 | 28 | 70.6 |
| pet vlaggen | 0 | 24 | 59.9 |

Pagina's met verkeer: `/` (31 klikken), `/voor-verenigingen/` (1), `/certificeringen/`
(0 klikken, 229 vertoningen). De rest is ruis.

### De kansen-meter: waar we staan t.o.v. #1

Het "Naar #1"-blok bovenaan het dashboard (`lib/analytics/naar-nummer1.ts`) zet 30
doelwoorden af tegen de pagina die ze hoort te winnen. Stand op 2026-07-15, over 12
maanden:

| Stand | Aantal |
|---|---|
| Top 3 | 0 |
| Pagina 1 | 1 · *duurzame vlaggen* (9.7) |
| In beeld (11+) | 6 |
| Nog niet in beeld | 23 |

**Positie 9.7 op "duurzame vlaggen" terwijl de site al drie maanden 503 geeft.** Dat
is de kern: een top-10-plek op de belangrijkste categorieterm, zónder werkende
website. Het domein wordt relevant bevonden en Google houdt het vast.

Twee patronen die eruit springen:

**Alles rankt op `/`.** Elk zoekwoord dat in beeld is, wordt door de homepage
gepakt — ook `duurzame vlaggen drukken` (37.4), `bedrijfsvlag` (70.6) en
`pet vlaggen` (59.9). Er is nooit een pagina geweest die die termen kon winnen.
De nieuwe site heeft die pagina's wél. Dat is geen langzame klim, dat is een
ontbrekende schakel die je invult.

**23 van de 30 doelen zijn witruimte.** `baniervlag`, `mastvlag`, `beachvlag`,
`gevelvlag`, `vlaggenmast` — nul vertoningen, terwijl je ze verkoopt. Een standaard
dashboard laat dit nooit zien, want het toont alleen wat al meet.

### Twee dingen die dit omgooien

**De migratie is bijna risicoloos.** De WP-bestelpagina's waarvoor de eerste versie
van dit document een redirect-map bouwde (`/bestel-mastvlaggen/`, `/bestel-baniervlaggen/`,
…) hebben **nul vertoningen**. Ze ranken niet. Er valt bij livegang vrijwel niets te
verliezen. De redirect-map is nog steeds nette hygiëne, maar het is geen blokker.

**De enige SEO-actie die telt is livegang.** Zolang de site 503 geeft, zakt
"duurzame vlaggen" (je enige echte bezit) verder weg. Elke week wachten kost
ranking. Een dashboard meet dat keurig, maar verandert het niet.

---

## 2. Wat er nu staat (gebouwd, werkend)

Route `app/admin/(dash)/analytics/page.tsx`, achter de bestaande auth
(`requireAdminPage()` → Supabase Auth + `ADMIN_EMAILS`). Server component,
CSS-modules, geen chart-library — conform de rest van de stack.

| Bestand | Rol |
|---|---|
| `lib/analytics/gsc.ts` | Service-account JWT + query. Alleen `node:crypto`, geen extra dep. Plus `veilig()` voor per-sectie error-isolatie. |
| `lib/analytics/naar-nummer1.ts` | **De kansen-meter.** Doelwoord → pagina → afstand tot #1. |
| `lib/analytics/zoekverkeer.ts` | De analyse: totalen, deltas, kansen, GEO, bewegers. |
| `lib/analytics/migratie.ts` | Migratie-risico (uniek voor deze site). |
| `lib/routes.ts` | Publieke routes, één bron voor `sitemap.ts` én de migratie-check. |
| `lib/analytics/migratie.test.ts` | 7 unit-tests. |
| `lib/analytics/gsc.e2e.test.ts` | Live koppel-diagnose: `RUN_GSC_E2E=1 npm run test:e2e`. |

**Overgenomen van signcompany** (`api/analytics.mjs`), grotendeels ongewijzigd omdat
die drempels daar in de praktijk zijn uitgehard: de GSC-JWT, `veilig()`, de
`bewegers()`-diff (neemt weggevallen termen mee), de vier kansen-classifiers, de
live HEAD-verificatie van dubbele URL's, en `canon()` — die laatste vangt hier de
WP-trailing-slash-twins af (`/materiaal/` vs `/materiaal`).

**Aangepast:** `isBranded` (eigen merknamen + de vier marktmerken), `vraagRe`
(vlaggen/CSRD-taal).

**Bewust anders dan kunstdoekje:** die leest zijn eigen `sitemap.ts` met een regex
om aan de routelijst te komen. Dat breekt zodra je de array herformatteert. Hier
staat de lijst in `lib/routes.ts` en importeert de sitemap 'm.

### Login: alleen een wachtwoord

`app/admin/actions.ts` + `enkeleAdmin()` in `auth.ts`. Bij precies één adres in
`ADMIN_EMAILS` leidt de server het e-mailadres zelf af en volstaat een wachtwoord.
Bij meerdere admins verschijnt het e-mailveld weer (anders logt de tweede in als de
eerste). Supabase Auth en de allowlist blijven intact — dit is alleen het veld weg,
geen zwakkere beveiliging. Bewust anders dan kunstdoekje/signcompany, die één
gedeeld wachtwoord zonder account gebruiken, zonder rate-limiting.

### Env

`GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY`, `GSC_SITE_URL` staan in Vercel én
`.env.local`. Service-account: `gsc-analytics@gen-lang-client-0127090702.iam.gserviceaccount.com`,
toegevoegd aan de GSC-property met rechten "Beperkt". Search Console API staat aan
op het Google Cloud-project "Duurzame vlaggen". Alle drie optioneel: niet gezet ⇒
setup-melding, geen crash.

`GSC_PRIVATE_KEY` moet op **één regel** met letterlijke `\n` (`lib/env.ts` zet ze om).
Meerregelig geplakt breekt `test/setup.ts`.

---

## 3. Wat nu te doen

### 3.1 Livegang is de SEO-actie 🔴

Niets in dit dashboard is interessant zolang de site 503 geeft. Zie `docs/GO-LIVE.md`
voor de blokkers.

### 3.2 Vóór livegang, klein en de moeite waard 🟠

**Canonicals per markt.** `lib/seo.ts` leidt `SITE_URL` af uit één env-var, terwijl
vijf marktdomeinen op één Vercel-project draaien. Elk domein zendt dus canonicals
naar hetzelfde domein ⇒ .be/.de/.fr/.com worden als duplicaat naar .nl gevouwen.
`config/domains.ts` definieert al een `hreflang` per markt, maar **niets consumeert
die waarde** (grep op `hreflang` in `app/`+`lib/`: nul treffers). `proxy.ts` zet al
`x-market`; daar kan een host-aware `SITE_URL` op meeliften. Nu nog gratis te
repareren, want die domeinen hebben geen verkeer.

**Redirect-domeinen wijzen naar 404.** `config/domains.ts` stuurt
`duurzame-mastvlaggen.nl` → `/mastvlaggen`; de echte slug is `/collectie/mastvlag`.
Idem voor banier en beach. Eenregelige fix per domein.

**Conversielekken.** Het contactformulier is een `mailto:` (`ContactForm.tsx` zet
`window.location.href`) met "Offerte aanvragen" in de dropdown. En quote-only
checkout (`afrekenen/actions.ts`, `proboProductCode === null` ⇒ nu alleen
`vlaggenmast`, €520+) gooit naam, mail, telefoon, btw-nummer en adressen weg zonder
op te slaan of te mailen. Komt verkeer terug, dan vang je het niet. `RESEND_API_KEY`
is er al.

**Redirect-map WP → Next.** Nette hygiëne, geen blokker meer (die pagina's ranken
niet). De volledige map stond in de vorige versie van dit document; bron is
`docs/CONTENT-MAP.md`. Let op de WP-typfout-slug `/kennisbank/csrd-comlpiance/`.
`lib/analytics/migratie.ts` bevat de voorgestelde mapping als `VOORSTEL`.

### 3.3 Ná livegang

**`gsc_snapshots`** (uit kunstdoekje, `supabase/gsc_snapshots.sql`) + dagelijkse cron.
GSC bewaart maar 16 maanden en toont geen trend-deltas; de `(dag, dimensie, sleutel)`-PK
maakt de cron idempotent omdat GSC 2-3 dagen te laat finaliseert en backfilt. Hier
uit te breiden met een `markt`-kolom (5 properties). Nu nog niet zinvol: er is geen
data om te bewaren.

**Vercel Analytics.** Er staat nu geen enkel tracking-script op de site. Cookieloos,
dus geen cookiebanner nodig. Les uit signcompany: die vuurt drie custom events af die
het dashboard nooit uitleest. Alleen events toevoegen die we tonen.

**Zoekwoord → omzet.** Het stuk dat kunstdoekje en signcompany niet kunnen bouwen,
want die hebben geen orders-tabel. Met `orders`, `order_items.configuration` en
`orders.market`: omzet per markt naast clicks, gekozen maten vs. de `popular`-defaults
(valideert de `TODO: prijs verifiëren`-gokken in `lib/pricing/local-catalog.ts`),
custom-maat-vraag, en welke quote-only configuraties worden aangevraagd (input voor
welke Probo-codes prioriteit hebben, `GO-LIVE.md` #1). Winkelwagen is localStorage,
dus verlaten carts laten geen spoor na — een echte funnel vraagt eigen ingest en valt
buiten de gekozen richting.

**Overwegen:** AI-zichtbaarheid (signcompany `api/ai-monitor.mjs` vraagt Claude of het
merk genoemd wordt bij categorievragen; kost tokens, staat daar achter een knop) en
Indexering via de GSC Sitemaps API — die laatste is goedkoop en juist ná livegang
nuttig om te zien of de nieuwe structuur wordt opgepikt.

---

## 4. Openstaande besluiten

- `/samples/` en `/bereken-besparing/` hebben geen tegenhanger in de nieuwe site.
  Bouwen of 301? (Ze ranken niet, dus de inzet is laag.)
- GSC-properties voor de vier andere marktdomeinen aanmaken zodra die live staan.
- WordPress.com-abonnement opzeggen na livegang.
- Los van analytics: op Vercel staat `MOLLIE_TEST_KEY` terwijl de code
  `MOLLIE_API_KEY` leest ⇒ `serverEnv.mollieApiKey` gooit bij afrekenen.
  `PROBO_API_KEY`, `RESEND_API_KEY` en `MAIL_FROM` ontbreken op het project.
