# Go-live checklist — Duurzame-Vlaggen

Wat er nog moet gebeuren om van de huidige build (server-laag + storefront) naar
een échte, verkopende webshop te gaan. Gegroepeerd naar **wie** het moet doen.

## 🔴 Blokkers voor online verkopen (input van Antony nodig)

### 1. Probo product-codes per vlagtype
De catalogus (`lib/catalog/products.ts`) heeft 5 vlagtypes met `proboProductCode: null`.
Zolang die null is, is een product **quote-only** (geen live prijs/checkout). Nodig per
vlagtype: het **Probo product-`code`** + de **optie-mapping** (welke Probo-opties horen bij
welke maat/afwerking/keuze). Dit is de grootste blokker: pas hierna werkt de configurator +
online bestellen per vlagtype. (De flow zelf is bewezen met `window-decal` in de e2e-test.)

### 2. Probo-account: verkoopmarge op 0%
Controleer in het Probo-portaal dat jullie eigen marge op **0%** staat — anders komt onze
50% markup bovenop Probo's marge (dubbele marge). We rekenen met `products_purchase_price`.

### 3. Probo callback-token + webhook
- Lever `PROBO_SECURITY_TOKEN` aan → webhook-verificatie aanzetten (nu dev-modus, accepteert alles).
- Zet `callback_url` in het Probo-account (of bevestig dat het per order meegestuurd mag worden).

### 4. VAT/OSS met accountant
Bevestig de btw-aanpak: OSS-registratie, tarieven per markt (nu NL21/BE21/DE19/FR20 als default
in `lib/vat/rates.ts`), en hoe de **`en`/.com-markt** belast wordt (nu 0% export bij onbekend land).

## 🟠 Content & merkassets (input nodig)

### 5. Beeldmateriaal
De 740 WP-media zijn een **Probo-catalogus-import** (materialen), **geen** eigen vlagfotografie.
Er is **geen logo of hero-image** gevonden. Nodig: echte productfoto's, een logo en hero-beeld.
→ Beslissing: welke media migreren we (nu placeholder-gradients in de UI)?

### 6. Teksten & vertalingen
- Homepage/product-copy is nu professioneel ingevulde **placeholder**-NL — laat nalezen/aanscherpen.
- de/fr/en zijn machine-/modelvertaald (`messages/*.json`) → **native review** vóór go-live.

### 7. Juridisch
Algemene voorwaarden, privacy- en cookiebeleid (AVG), retour/annulering. Bevestig KvK/btw-nummer
en of "Sign Company B.V." de handelsnaam op de site wordt.

## 🟡 Techniek / deploy (doe ik / samen)

### 8. Live credentials (Vercel, per omgeving)
- Mollie `test_` → **`live_`** key (Production).
- `PROBO_ORDER_TYPE=normal` (nu default `test` = niet-factureerbare test-orders).
- `PROBO_SECURITY_TOKEN` (uit #3), Probo productie-key indien anders dan test.
- `NEXT_PUBLIC_APP_URL` per omgeving op de publieke URL (Mollie weigert een localhost webhookUrl).

### 9. Domeinen & DNS
5 marktdomeinen + redirect-domeinen aan het Vercel-project koppelen; DNS zetten; TLS/hreflang
controleren. **`.com`-beslissing** definitief maken (nu 301 → .nl in `config/domains.ts`).

### 10. Uploader (klant-artwork)
Het Probo-uploader-endpoint is nog onbevestigd (`lib/probo/uploader.ts` is een stub die throwt).
Nodig voor producten waar de klant een ontwerp uploadt. Bevestigen met Probo + inbouwen in de configurator.

### 11. Hardening
Monitoring/logging, rate-limiting op de webhooks, error-alerting, en de Probo status-callback-veldnamen
verifiëren zodra de eerste echte order is verzonden (nu tolerant geparsed).

### 12. Contactformulier-backend
Het contactformulier heeft nu een placeholder-submit → koppelen aan e-mail (bijv. Resend) of een
inbox.
