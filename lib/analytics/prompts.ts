import "server-only";
import { getAllProducts } from "@/lib/catalog/products";
import type { DoelStand } from "./naar-nummer1";

/**
 * Kans → opdracht voor Claude Code.
 *
 * Overgenomen van signcompany, waar elke kansregel een "kopieer prompt"-knop
 * heeft. Wat die aanpak laat werken is niet de prompt-tekst maar twee dingen
 * eromheen: het bestand erbij zetten, en de huisstijlregels meesturen. Zonder
 * bestandspad gaat het model zoeken; zonder stijlregels schrijft het iets dat
 * niet bij de site past.
 */

/**
 * Pad → het bestand dat je moet openen.
 *
 * Bij signcompany kan dit mechanisch (statische site: /pad/ → pad/index.html).
 * Hier niet: dit is een App Router met een route-group en één dynamische route
 * voor alle producten. Vandaar een expliciete afbeelding.
 */
export function bestandVanPad(pad: string): string {
  const schoon = pad.replace(/\/+$/, "") || "/";

  if (schoon === "/") return "app/(storefront)/page.tsx";

  // Productpagina's delen één template; de inhoud zit in de catalogus.
  const product = schoon.match(/^\/collectie\/(.+)$/);
  if (product) {
    const slug = product[1];
    const bestaat = getAllProducts().some((p) => p.slug === slug);
    return bestaat
      ? `lib/catalog/products.ts (het "${slug}"-blok) — template: app/(storefront)/collectie/[slug]/page.tsx`
      : `lib/catalog/products.ts — LET OP: er is nog geen product met slug "${slug}"`;
  }

  return `app/(storefront)${schoon}/page.tsx`;
}

/**
 * Huisstijl-regels die in elke prompt mee moeten. Losse constante omdat ze in
 * elke prompt identiek zijn en op één plek onderhouden horen te worden.
 * Bron: docs/STYLEGUIDE.md en de bestaande copy.
 */
const HUISSTIJL = [
  "Schrijf Nederlands, in de toon van de bestaande pagina's: direct en stellig, geen marketing-superlatieven.",
  "Geen em-dashes. Gebruik punten of komma's; voor opsommingen een middelpunt (·).",
  'Milieuclaims komen uit lib/claims/afbreekbaarheid.ts en nergens anders vandaan. Een percentage staat nooit los: altijd met de omgeving, de termijn en de ASTM-norm erbij, plus een link naar /afbreekbaarheid met de linktekst "Zo is dat gemeten". De hoofdclaim is 94,2% afgebroken in zeewater in ruim drie en een half jaar (ASTM D6691), tegen 3,8% voor onbehandeld polyester in dezelfde test.',
  'Schrijf NOOIT dat de vlag geen, nul of 0% microplastics achterlaat, en ook niet dat hij composteerbaar is. CiCLO versnelt de afbraak van vezels die zijn afgegeven; het vermindert de afgifte niet. De juiste formulering is "laat minder microplastic achter": vezels die tijdens gebruik loslaten breken af in plaats van te blijven liggen.',
  'Noem het meegeleverde document "inkoopdossier" of "materiaalpaspoort", nooit "CSRD-proof", "CSRD-compliant" of "CSRD-materiaalpaspoort". Sinds het Omnibus-pakket (december 2025) geldt de CSRD alleen boven 1.000 medewerkers én 450 miljoen euro omzet; kleinere bedrijven krijgen de vraag via grote opdrachtgevers in hun keten.',
  'Onderbouw of schrap: "recyclebaar", "PVC-vrij", "circulair geproduceerd", "CO₂-neutraal bezorgd" en "volledig duurzaam". Bij twijfel schrappen. Verzin geen certificeringen of cijfers.',
  'De woorden "biologisch afbreekbaar" en "duurzaam/duurzame" moeten in titles, metadata-omschrijvingen, H1\'s en koppen blijven staan: daar rankt de site op. Verwijder ze nooit, voeg de onderbouwing eromheen toe.',
  "Dit is lead-gen en verkoop van vlaggen, geen algemene webshop-taal.",
  "Raak de prijslogica in lib/pricing/local-catalog.ts niet aan.",
].join("\n- ");

function stand(doel: DoelStand): string {
  if (doel.positie === null) {
    return `Wij komen op dit zoekwoord NIET voor in Google (geen enkele vertoning in 12 maanden), terwijl we het product wel verkopen.`;
  }
  const mis = doel.verkeerdePagina
    ? `\nLet op: op dit moment rankt \`${doel.rankendePagina}\` ervoor, niet \`${doel.pagina}\`. De verkeerde pagina pakt de term.`
    : "";
  return `Wij staan nu op positie ${doel.positie} met ${doel.impressies} vertoningen en ${doel.clicks} klikken (12 maanden).${mis}`;
}

/** De opdracht voor één doelwoord uit de Naar #1-meter. */
export function bouwDoelPrompt(doel: DoelStand): string {
  const bestand = bestandVanPad(doel.pagina);
  const doelStelling =
    doel.positie === null
      ? `Zorg dat we voor "${doel.woord}" überhaupt gevonden gaan worden.`
      : `Breng "${doel.woord}" van positie ${doel.positie} richting de top 3.`;

  return `# SEO-opdracht: "${doel.woord}"

${doelStelling}

## Stand
${stand(doel)}

## Doelpagina
\`${doel.pagina}\` — ${bestand}

## Wat ik van je wil
1. Lees de doelpagina en beoordeel of die het zoekwoord echt verdient: staat het in de title, de H1, de eerste alinea en de metadata-omschrijving?
2. Pas de inhoud aan zodat de pagina duidelijk over "${doel.woord}" gaat. Niet keyword-stuffen: schrijf iets dat een koper wil lezen en beantwoord de vraag achter het zoekwoord.
3. Controleer de interne links: linkt er iets naar deze pagina met relevante ankertekst? Zo niet, voeg dat toe vanaf een logische plek.
4. Controleer de JSON-LD op de pagina (zie lib/seo.ts voor de bouwstenen).${
    doel.verkeerdePagina
      ? `\n5. Los op dat \`${doel.rankendePagina}\` deze term nu pakt: die pagina moet 'm juist LOSLATEN en naar \`${doel.pagina}\` verwijzen.`
      : ""
  }

## Huisstijl
- ${HUISSTIJL}

## Niet doen
- Geen nieuwe pagina's aanmaken zonder dat te melden.
- Geen claims verzinnen over duurzaamheid of certificering.
- De sitemap volgt uit lib/routes.ts; pas die aan als je een route toevoegt.`;
}

/** Eén opdracht voor een hele set doelen — de werklijst-knop. */
export function bouwWerklijstPrompt(doelen: DoelStand[]): string {
  const rankend = doelen.filter((d) => d.positie !== null);
  const witruimte = doelen.filter((d) => d.positie === null);

  const regel = (d: DoelStand) =>
    `- **${d.woord}** → \`${d.pagina}\` (${bestandVanPad(d.pagina)})` +
    (d.positie !== null
      ? ` · nu positie ${d.positie}, ${d.impressies} vertoningen${d.verkeerdePagina ? ` · **verkeerde pagina rankt: ${d.rankendePagina}**` : ""}`
      : ` · nog geen enkele vertoning`);

  return `# SEO-werklijst — duurzame-vlaggen.nl

Doel: hoger ranken op onderstaande zoekwoorden. Pak ze één voor één op; begin bij de bovenste.

## We ranken al, maar te laag (${rankend.length})
${rankend.map(regel).join("\n") || "- (geen)"}

## Nog niet in beeld (${witruimte.length})
Voor deze woorden hebben we nul vertoningen terwijl we het product wel verkopen.
${witruimte.map(regel).join("\n") || "- (geen)"}

## Aanpak per zoekwoord
1. Verdient de doelpagina de term? Kijk naar title, H1, eerste alinea, metadata-omschrijving.
2. Schrijf voor de koper, niet voor de crawler. Beantwoord de vraag achter het zoekwoord.
3. Zorg voor een interne link met relevante ankertekst.
4. Rankt er een ándere pagina voor de term? Laat die 'm loslaten en doorverwijzen.

## Huisstijl
- ${HUISSTIJL}

## Context
- Productinhoud staat in \`lib/catalog/products.ts\`, niet in de paginabestanden.
- Publieke routes staan in \`lib/routes.ts\` (sitemap leest daaruit).
- SEO-bouwstenen: \`lib/seo.ts\`.
- Stijl: \`docs/STYLEGUIDE.md\`.`;
}
