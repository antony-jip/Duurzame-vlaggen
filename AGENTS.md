<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Milieuclaims: lees dit vóór je copy schrijft

Deze site verkoopt één doek, Flag-CiCLO®, en staat of valt bij claims die kloppen.
EU-richtlijn 2024/825 (Empowering Consumers) geldt vanaf **27 september 2026** en verbiedt
generieke milieuclaims zonder onderbouwing. De ACM handhaaft hier al op.

**Eén bron voor alle cijfers: `lib/claims/afbreekbaarheid.ts`.** Importeer eruit, hardcodeer niets.
Gebruik `pctNl()` voor de Nederlandse komma.

**De regel.** Een percentage staat nooit alleen. Altijd met de omgeving en de termijn erbij, en op
elke pagina met zo'n cijfer één link naar `/afbreekbaarheid` met de tekst "Zo is dat gemeten".
Dan is het geen claim meer maar een meting.

**Nooit schrijven, dit zijn feitelijke onjuistheden:**

| Fout | Waarom |
|---|---|
| "0% microplastics", "geen microplastics", "zero plastic" | CiCLO vermindert de **afgifte** van vezels niet. Het versnelt de **afbraak** van vezels die zijn afgegeven. |
| "100% biologisch afbreekbaar" | De hoogste gemeten uitkomst is 94,2% in zeewater. |
| "96%" | Nergens op terug te voeren. Gebruik de gemeten uitkomsten. |
| "composteerbaar" | Door de licentiegever van CiCLO uitdrukkelijk verboden. |
| "CSRD-proof", "CSRD-compliant" | Na het Omnibus-pakket (december 2025) geldt de CSRD alleen boven 1.000 medewerkers **én** 450 mln omzet. Noem het "inkoopdossier". |

`lib/claims/claims.test.ts` is een linter die de hele broncode hierop scant. Valt hij om, herschrijf
dan de copy. Zet niets op de uitzonderingenlijst om hem stil te krijgen.

**En let op de andere kant.** De woorden "biologisch afbreekbaar" en "duurzaam" moeten in titles,
metadata, H1's en koppen blijven staan: de site staat op #2 voor "duurzame vlag" en #3 voor
"biologisch afbreekbare vlag". Voeg onderbouwing toe, verwijder de zoekterm niet.
