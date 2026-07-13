# Content-map — bestaande WordPress-site duurzame-vlaggen.nl

> Bron-inventarisatie voor de Next.js rebuild. Opgesteld 2026-07-13.
>
> **Hoe verzameld:** De front-end HTML en de XML-sitemaps gaven `503 Service Unavailable`
> (bot-/rate-protection, `Retry-After: 600`). De **WordPress REST API is wél open** en is de
> primaire bron: `/wp-json/wp/v2/pages` (rendered content per pagina), `/wc/store/v1/products`,
> `/wp-json/wp/v2/media`, `/wp-json/wp/v2/posts`. Alle inhoud hieronder komt uit de REST API.
>
> **Belangrijkste bevinding:** de "shop" draait **niet** op reguliere WooCommerce-producten
> (die zijn leeg / placeholder), maar op **Elementor-configuratorpagina's per vlagtype**. De
> productdata (afmetingen, opties, prijzen) staat in die pagina's, niet in de product-API.

---

## 1. Navigatiestructuur

Het menu is niet apart als REST-endpoint benaderbaar; onderstaande structuur is afgeleid uit de
pagina-lijst (`menu_order`/parent) en de homepage-CTA's. Verifieer exacte menu-labels bij rebuild.

### Vermoedelijk hoofdmenu
| Label | Doel-pagina | Slug |
|---|---|---|
| Home | `/` | home |
| Producten / Configureer je vlag | `/producten/` + configurator | producten / configurator |
| Materiaal | `/materiaal/` | materiaal |
| CSRD | `/csrd/` | csrd |
| Kennisbank | `/kennisbank/` | kennisbank |
| Over ons | `/over-ons/` | over-ons |
| Contact | `/contact/` | contact |
| Offerte aanvragen | `/offerte-aanvragen/` | offerte-aanvragen |

### Doelgroep-landingspagina's (segmentatie)
- `/voor-bedrijven/` — Voor Bedrijven (CSRD/compliance-insteek)
- `/voor-gemeenten/` — Voor Gemeenten
- `/voor-verenigingen/` — Voor Verenigingen

### Bestel-/configuratorpagina's (de feitelijke catalogus)
- `/bestel-baniervlaggen/`
- `/bestel-mastvlaggen/`
- `/bestel-beachvlaggen/`
- `/bestel-gevelvlaggen/`
- `/bestel-vlaggenmast/`
- `/bestel/` (overkoepelend), `/configurator/`, `/confi-vlaggen/`

### Footer-/service-links (afgeleid)
- Garantie `/garantie/`
- Veelgestelde vragen `/veelgestelde-vragen/`
- Algemene voorwaarden `/algemene-voorwaarden/`
- Privacyverklaring `/privacyverklaring/`
- Cookiebeleid `/cookiebeleid/`
- Certificeringen `/certificeringen/`
- Samples `/samples/`
- Bereken besparing `/bereken-besparing/`

### WooCommerce-standaardpagina's (aanwezig maar grotendeels leeg)
`/shop/`, `/cart/`, `/checkout/`, `/my-account/`, `/bestellingen/`

### Volledige paginalijst uit REST (43 pagina's)
Kennisbank heeft child-pagina's (parent = 965): `flag-ciclo-technologie`, `vlaggen-kiezen`,
`microplastics`, `csrd-comlpiance` (let op typfout in slug). Overige losse pagina's o.a.:
`about`, `blog`, `garantie`, `materiaal`, `csrd-microplastics-probleem`,
`bereken-besparing-2`, `elementor-page-897`, `elementor-page-509` (kladpagina's — niet migreren).

---

## 2. Producttaxonomie — vlagtypes

> **Cruciaal voor catalog + Probo-koppeling.** De reguliere WooCommerce product-API
> (`/wc/store/v1/products`) gaf slechts **2 producten** ("Baniervlag", "Flag CiCLO®"), beide
> met prijs €0 en zonder omschrijving/categorie — placeholders. De echte product-informatie
> hieronder komt uit de Elementor-**configuratorpagina's**.

**5 vlagtypes + toebehoren:**

### 2.1 Baniervlag (`bestel-baniervlaggen`) — "Populair"
- **Omschrijving:** Verticale baniervlag met CiCLO®-technologie; "zelfde kwaliteit als een gewone vlag", breekt daarna vanzelf af. USP: *"Altijd zichtbaar, ook zonder wind."*
- **Afmetingen:** 250×100 tot 400×100 cm (voor masten 5–8 m) + maatwerk.
- **Opties:** mastzijde links/rechts · afwerking tunnel (gestikt) of zonder tunnel (haken) · band/koordkleur wit of zwart · ontwerpservice +€85 · staffelkorting (5+ = 5%, 50+ = 20%).
- **Prijsindicatie:** €32,50 (250×100) → €52,00 (400×100). Verzending €7,50 onder €150.

### 2.2 Mastvlag (`bestel-mastvlaggen`)
- **Omschrijving:** Klassieke horizontale vlag voor verticale mast.
- **Afmetingen / prijs:** 100×150 (€19,50, mast 2–3 m) · 120×180 (€29,50, 4–5 m) · 150×225 (€44,50, 6–7 m, standaard) · 200×300 (€79,50, 8–9 m) · 225×350 (€99,50, 10 m) + maatwerk.
- **Opties:** mastzijde links/rechts · afwerking clips/haken of koord+lus · bandkleur wit/zwart · ontwerpservice +€85 · staffel tot 20% (50+).
- **Levering:** 3 werkdagen na akkoord.

### 2.3 Beachvlag / beachflag (`bestel-beachvlaggen`)
- **Omschrijving:** Grote promotievlaggen voor events/beurzen/retail.
- **Modellen & maten:**
  - *Straightflag* (rechte onderrand): S 80×220 (€35) · M-S 65×315 (€45) · M-L 80×315 (€49) · L 90×430 (€65)
  - *Squareflag* (rechthoekig): S 75×200 (€45) · M 75×300 (€55) · L 75×400 (€65)
  - Media-library noemt ook *drop*- en *wave*-varianten — verifiëren.
- **Opties:** samenstelling (alleen vlag / vlag+mast / complete set met draagtas) · mastzijde links/rechts · afwerking wit/zwart/bedrukt · accessoires (kruisvoet, grondpen, parasolvoet, waterzak) · staffel 5+/10+/25+/50% → 5/10/15/20%.
- **Levensduur:** 3–4 mnd buiten; levering 3 werkdagen.

### 2.4 Gevelvlag (`bestel-gevelvlaggen`)
- **Omschrijving:** Biologisch afbreekbare gevelvlag voor bedrijven aan de gevel.
- **Afmetingen / prijs:** 100×70 (€17,50) · 150×100 (€29,50) · 200×100 (€39,50) · 225×150 (€59,50) + maatwerk.
- **Opties:** mastzijde links/rechts · afwerking koord+lus · koordkleur wit/zwart · ontwerpservice +€85 · staffel tot 20% (50+).
- **Levering:** 3 werkdagen; UV-kleurvast ~2 jaar.

### 2.5 Vlaggenmast (`bestel-vlaggenmast`) — hardware, niet-afbreekbaar
- **Omschrijving:** Aluminium vlaggenmast, *"stevige mast in de kleur die bij je gevel past. Hoogwaardig aluminium dat jaren meegaat."*
- **Hoogtes/materiaal:** online tot 8 m (maatwerk op aanvraag) · hoogwaardig aluminium · kleuren wit / zilver (aluminium) / zwart / antraciet.
- **Features:** incl. muurbeugels · 10+ jaar garantie · Easylift®-systeem (kantelbaar, interne lijn) · leveringsopties: alleen leveren óf professionele montage.
- **Prijsindicatie:** basis €520–€578,50 (6–8 m) · kleurtoeslag zwart/antraciet +€71,50 · montageservice €214,50/mast + €110,50 voorrijkosten · 5% korting bij 3+.

### Overzichtstabel Probo-koppeling
| Vlagtype | Slug | Standaardmaten | Vanaf-prijs | Kernopties |
|---|---|---|---|---|
| Baniervlag | bestel-baniervlaggen | 250–400 ×100 cm | €32,50 | zijde, tunnel/haken, bandkleur, ontwerp |
| Mastvlag | bestel-mastvlaggen | 100×150 – 225×350 | €19,50 | zijde, clips/koord, bandkleur, ontwerp |
| Beachvlag | bestel-beachvlaggen | straight/square div. | €35 | model, set, accessoires |
| Gevelvlag | bestel-gevelvlaggen | 100×70 – 225×150 | €17,50 | zijde, koord, koordkleur, ontwerp |
| Vlaggenmast | bestel-vlaggenmast | tot 8 m | €520 | hoogte, kleur, montage |

> **Let op (te verifiëren bij rebuild):** pagina `producten` (ID 79) leverde via REST inhoud
> over **"PlantBased Stickers"** (sheet/label/roll/custom stickers, suikerriet-gebaseerd) — dit
> is vermoedelijk restant-/template-inhoud van een zustersjabloon en **niet** het feitelijke
> vlaggen-assortiment. Niet migreren tenzij bewust bevestigd.

---

## 3. Kernpagina's — boodschap & USP's

### Homepage (`/`)
- **Hero:** *"Duurzame vlaggen die verdwijnen. Zero plastic."*
- **Sub:** *"Zelfde kwaliteit als je huidige vlag. Alleen lost deze op in de natuur."* · *"Vlaggen die volledig oplossen in 2-3 jaar. 0% microplastics, CSRD-compliant."*
- **USP-blokken:** 96% biologisch afbreekbaar (2–3 jaar) · 0% microplastics · CSRD-compliant (documentatie inbegrepen) · levering ~3 werkdagen · proef + print in één proces.
- **CTA's:** primair *"Configureer je vlag"*, secundair *"Hoe werkt het?"*
- **Categorieblokken:** Gevelvlag · Mastvlag · Baniervlag (Populair).

### Over ons (`/over-ons/`)
- **Probleem:** *"Elke vlag laat 700.000 deeltjes microplastic achter"*; 47 miljoen vlaggen in NL; microplastics blijven 200+ jaar in de natuur.
- **Oplossing:** Flag-Ciclo™ (PHA-biopolymeer), vlaggen die *"verdwijnen zoals het hoort"*; 96% afbraak in 2–3 jaar; alleen CO₂, water en biomassa resteren; identieke prestatie als polyester.
- **Businesswaarde:** positioneert afbreekbare vlaggen als CSRD-rapporteerbaar initiatief (vanaf 2025).

### Materiaal (`/materiaal/`)
- **Technologie:** *"biologisch afbreekbaar polyester met CiCLO® technologie"* (Flag-Ciclo®).
- **Afbraak in 4 fasen:** (1) in gebruik 3–4 mnd, 2 jr UV · (2) start afbraak door micro-organismen · (3) actieve afbraak 1–2 jr · (4) *"96% opgelost. Alleen CO₂, water en biomassa over. Geen microplastics"* (totaal 2–3 jr).
- **Specs:** 96% afbreekbaar · 0% microplastic · functionele levensduur 3–4 mnd · CSRD/ESRS E2-5.
- **Certificeringen:** OEKO-TEX ECO PASSPORT · ASTM D5988 · ASTM D5511 · REACH.

### CSRD (`/csrd/`)
- Legt CSRD uit: bedrijven moeten vanaf 2025 microplastic-uitstoot rapporteren; boetes tot €10 mln.
- Kernclaims: *"Onze vlaggen lossen op. 96% verdwijnt volledig. Geen microplastics om te rapporteren."* · levert *"ESRS E2-5 documentatie"* en *"certificaten voor je rapport"*.

### Contact (`/contact/`)
- **E-mail:** info@duurzame-vlaggen.nl · **Telefoon:** 085 060 8963 · **Locatie:** Enkhuizen (magazijn/HQ genoemd).
- **Formuliervelden:** Naam* · E-mail* · Bedrijf · Telefoon · Onderwerp* (dropdown: offerte / CSRD & compliance / producten & prijzen / eigen ontwerp / overig) · Bericht*.
- **Belofte:** *"Reactie binnen 24 uur, meestal sneller"*; levering 3–4 dagen door heel NL.
- **Ontbreekt hier:** straatadres, KvK, BTW, openingstijden (zoek in footer/AV bij rebuild).

### Garantie (`/garantie/`) — bevat ook retour/klacht
- **Vlaggen:** levensduur 3–4 mnd intensief buiten · 2 jr UV-kleurgarantie · productiefouten volledig vergoed.
- **Masten:** polyester 15 jr · aluminium conisch 10 jr · aluminium cilindrisch 5 jr breukgarantie.
- **Accessoires:** 3 mnd op koppelstukken, lijn, lier.
- **Uitsluitingen:** vlag verwijderen bij windkracht 7+ (6+ cilindrisch); mast plat bij windkracht 9+.
- **Klacht/retour:** 3 stappen (contact + ordernr → probleem + foto's → reactie binnen 24 u op werkdagen).
- **NB:** expliciete verzendkosten/standaard retourtermijn ontbreken hier.

### Veelgestelde vragen (`/veelgestelde-vragen/`)
5 rubrieken, ~20 vragen: **Flag-Ciclo-technologie** (5), **CSRD & rapportage** (4), **Bestellen & levering** (4), **Producten & formaten** (3), **Duurzaamheid & milieu** (4). Kernpunten: 96% afbraak/geen microplastics · 3–4 mnd levensduur · identieke printkwaliteit · OEKO-TEX/REACH/ASTM · geen minimale afname · levering ~3 werkdagen · onafhankelijke ASTM-labtests weerleggen greenwashing-verwijt.

### Voor Bedrijven (`/voor-bedrijven/`)
CSRD-compliance-focus (ESRS E2-5) · risicoreductie microplastics · *"slechts enkele euro's meer"* dan gewoon · certificaten/documentatie inbegrepen. Zustervarianten: Voor Gemeenten, Voor Verenigingen.

### Kennisbank (`/kennisbank/`) — content-hub
Child-artikelen: Flag-CiCLO-technologie · Vlaggen kiezen · Microplastics · CSRD-compliance. Plus losse pagina `csrd-microplastics-probleem`. Goede bron voor SEO-/blogmigratie.

---

## 4. Media

> **Belangrijke waarschuwing voor media-migratie:** de `/wp-json/wp/v2/media`-library is
> gevuld met een **Probo product-catalogus-import** (materialen/substraten en algemene
> print-productfoto's), **niet** met eigen vlag-fotografie of merkassets. Er zijn **geen
> aparte logo- of hero-image-items** in de mediabibliotheek gevonden. Alle bestanden staan
> onder `wp-content/uploads/2026/05/…` en worden via Jetpack CDN (`i0.wp.com`) geserveerd.

### Wél relevante vlag-/display-beelden (uit media, waarschijnlijk Probo-catalogus)
| Type | ID's | Opmerking |
|---|---|---|
| Beachflag-varianten (straight/square/drop/wave) | 2943–2946 | mogelijk bruikbaar voor beachvlag-configurator |
| Roll-up banners (budget/premium/deluxe) | 2947–2949 | niet in huidig assortiment |
| Spandoek / PVC-vrij banner | 2941 / 2922 | — |
| Beursframe, pop-up walls, roll-up XXL, outdoor LED-frame | 2916–2920, 2942 | display-hardware |
| Plug-in-pees | 3074 | vlag-afwerkingsonderdeel |

### Voorbeeld-URL-patroon
`https://i0.wp.com/duurzame-vlaggen.nl/wp-content/uploads/2026/05/<slug>-<hash>.jpg`
bijv. `.../black-forex-74f45190a42abc63.jpg`, `.../pallet-cover-f5ffe8a9b96deb7f.jpg`.

### Materiaal-/substraat-samples (waarschijnlijk NIET migreren)
Grote reeks Probo-materialen: Dibond®/Budget/Butler Finish, Forex®/Zwart Forex®, PVC Schuimplaat,
AcousticPro®-panelen, Orajet®-folies, Blackback ReNew∞, Lentasteel, Perfax-gereedschap,
Avery cleaner, handdoeken/strandlakens, transparante stickers, neon print, DTF-accessoires,
gevelbord, paneel. → catalogus-ruis, geen merkfotografie.

**Actiepunt rebuild:** eigen vlag-productfotografie en logo/hero-assets zijn (nog) niet in de
mediabibliotheek aanwezig; deze moeten apart worden aangeleverd/geproduceerd voor de nieuwe site.

---

## 5. Overige

### Taal / markten
- **Uitsluitend Nederlands.** Geen EN/DE/FR-varianten, geen hreflang/vertaalpagina's, geen
  taal-switcher gevonden in pagina's of REST. Rebuild kan single-locale (nl-NL) starten.

### Contact- & bedrijfsinfo
| Veld | Waarde |
|---|---|
| Handelsnaam | Duurzame-Vlaggen.nl |
| Achterliggend bedrijf | Sign Company B.V. (per opdracht; **niet expliciet op contactpagina vermeld** — verifiëren in AV/footer) |
| E-mail | info@duurzame-vlaggen.nl |
| Telefoon | 085 060 8963 |
| Locatie | Enkhuizen (NL) |
| KvK / BTW | **niet gevonden** op contactpagina (mogelijk in Algemene Voorwaarden `/algemene-voorwaarden/`) |
| Levering | 3–4 dagen door heel NL |
| Reactietijd | binnen 24 u |

### Techniek-signalen huidige site
- WordPress + **Elementor** (veel `elementor-page-*` kladpagina's) + **WooCommerce** (nauwelijks gevuld).
- Jetpack actief (media via `i0.wp.com` CDN).
- Front-end en sitemaps achter bot-protection (503); REST API open.
- Product-"shop" is in de praktijk een set **Elementor-configuratoren met hardcoded prijzen/maten**
  → deze prijs-/maat-/optie-logica moet in de rebuild naar echte producten + Probo-koppeling.

### Blog / posts
Alleen de default WordPress `Hello World!`-post (ID 3). Geen echte blogcontent in `posts`;
inhoudelijke artikelen staan onder **Kennisbank** (pages, parent 965).

### Niet toegankelijk / te verifiëren
- Front-end HTML + `wp-sitemap.xml` / `sitemap.xml`: **503** (niet ophaalbaar tijdens deze scan).
- Exacte menu-labels/volgorde (menu-endpoint niet publiek).
- KvK/BTW en bedrijfsnaam Sign Company B.V. op de site zelf.
- Pagina `producten` (ID 79) bevatte afwijkende sticker-content — herkomst verifiëren.
- Certificeringen-pagina (`/certificeringen/`), Samples, Bereken besparing, Offerte aanvragen:
  bestaan wel, inhoud niet in deze scan uitgediept.
