import "server-only";
import { getAllProducts } from "@/lib/catalog/products";
import { allePublicRoutes } from "@/lib/routes";
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
 * Wat de rankende pagina betekent voor de opdracht.
 *
 * De vorige versie kende maar twee gevallen: goede pagina of "verkeerde pagina".
 * Dat leverde schadelijk advies op. De 12-maands-meting loopt namelijk grotendeels
 * over de OUDE WordPress-site, die maar een handvol pagina's had. Elke term die
 * toen iets deed, deed dat noodgedwongen op `/` of op een WP-URL die nu niet meer
 * bestaat. "Laat die pagina de term loslaten" is dan precies verkeerd: je zou de
 * homepage verzwakken op de enige term die we echt bezitten.
 *
 * Drie gevallen die elk een ánder soort werk vragen:
 */
export type PaginaSituatie =
  /** De bedoelde pagina pakt 'm al, of er is nog geen rankende pagina. */
  | "geen-conflict"
  /** De homepage pakt 'm. Normaal voor een net-live site. Nooit verzwakken. */
  | "homepage"
  /** Een ándere bestaande pagina pakt 'm. Dit is echte zelfconcurrentie. */
  | "kannibalisatie"
  /** Een pad dat de nieuwe site niet kent: een URL van de oude WordPress-site. */
  | "oude-site";

/** Trailing slash negeren: WP serveert /materiaal/, Next /materiaal. */
function schoonPad(p: string): string {
  return p.replace(/\/+$/, "") || "/";
}

export function paginaSituatie(doel: DoelStand): PaginaSituatie {
  if (!doel.rankendePagina || !doel.verkeerdePagina) return "geen-conflict";

  const rankend = schoonPad(doel.rankendePagina);
  if (rankend === "/") return "homepage";

  const bestaatNog = allePublicRoutes().some((r) => schoonPad(r) === rankend);
  return bestaatNog ? "kannibalisatie" : "oude-site";
}

/**
 * De regel die de opdracht over de rankende pagina meegeeft. Per situatie een
 * andere actie, want ze vragen echt verschillend werk.
 */
function paginaInstructie(doel: DoelStand): string | null {
  switch (paginaSituatie(doel)) {
    case "geen-conflict":
      return null;
    case "homepage":
      return `De homepage pakt deze term nu, niet \`${doel.pagina}\`. Dat is normaal voor een site die net live is: op de oude site was \`/\` vaak de enige pagina die er was. Laat de homepage die term dus NIET los. Zorg in plaats daarvan dat \`${doel.pagina}\` 'm verdient en link er vanaf de homepage naartoe met "${doel.woord}" als ankertekst.`;
    case "kannibalisatie":
      return `\`${doel.rankendePagina}\` pakt deze term nu, niet \`${doel.pagina}\`. Dat is echte zelfconcurrentie tussen twee bestaande pagina's: bepaal welke van de twee 'm hoort te winnen, laat de ander 'm loslaten en link met "${doel.woord}" als ankertekst naar de winnaar.`;
    case "oude-site":
      return `De vertoningen staan op \`${doel.rankendePagina}\`, een URL van de oude WordPress-site die de nieuwe site niet meer kent. Er valt hier niets te "ontkannibaliseren". Controleer of dat pad een 301 naar \`${doel.pagina}\` heeft (zie next.config.ts en config/domains.ts) en bouw de term verder op \`${doel.pagina}\`.`;
  }
}

/**
 * Huisstijl-regels die in elke prompt mee moeten. Losse constante omdat ze in
 * elke prompt identiek zijn en op één plek onderhouden horen te worden.
 * Bron: docs/STYLEGUIDE.md en de bestaande copy.
 */
const HUISSTIJL = [
  "Schrijf Nederlands, in de toon van de bestaande pagina's: direct en stellig, geen marketing-superlatieven.",
  "Geen em-dashes. Gebruik punten of komma's; voor opsommingen een middelpunt (·).",
  "Claims moeten kloppen met docs/STYLEGUIDE.md en de bestaande teksten: 96% afbreekbaar in 2-3 jaar, 0% microplastics, CSRD/ESRS E2-5. Verzin geen certificeringen of cijfers.",
  "Dit is lead-gen en verkoop van vlaggen, geen algemene webshop-taal.",
  "Raak de prijslogica in lib/pricing/local-catalog.ts niet aan.",
].join("\n- ");

/**
 * Werkwijze-regels voor deze repo. Stonden er niet in, terwijl AGENTS.md er
 * expliciet om vraagt: dit is een Next.js-versie waarvan de conventies afwijken
 * van wat een model uit zijn hoofd kent.
 */
const WERKWIJZE = [
  "Lees AGENTS.md voordat je code aanraakt. Dit is niet de Next.js die je kent; raadpleeg node_modules/next/dist/docs/ voor de API's die je gebruikt.",
  "Productinhoud staat in `lib/catalog/products.ts`, niet in de paginabestanden.",
  "SEO-bouwstenen (metadata, JSON-LD, canonicals) staan in `lib/seo.ts`. Let op het titel-budget: de root-layout hangt ` | Duurzame Vlaggen` (19 tekens) achter elke paginatitel, dus een title moet ≤ 41 tekens blijven.",
  "Publieke routes staan in `lib/routes.ts`; de sitemap leest daaruit. Voeg je een route toe, zet 'm daar neer.",
  "Draai na afloop `npm run lint` en `npm test`. Meld wat er stukging in plaats van het te omzeilen.",
].join("\n- ");

/**
 * De meetperiode expliciet benoemen. Zonder dit leest een model "positie 9.7" als
 * de stand van vandaag, terwijl het grotendeels historie van de oude site is.
 */
export interface Venster {
  since: string;
  totEnMet: string;
}

function vensterRegel(venster?: Venster): string {
  const periode = venster ? `${venster.since} t/m ${venster.totEnMet}` : "de laatste 12 maanden";
  return `Alle cijfers hieronder komen uit Google Search Console over ${periode}. Dat venster loopt grotendeels over de OUDE WordPress-site, die maandenlang 503 gaf en maar een handvol pagina's had. Lees ze dus als "wat het domein ooit deed", niet als de stand van vandaag. De nieuwe site is net live en moet vrijwel alles opnieuw opbouwen.`;
}

function stand(doel: DoelStand): string {
  if (doel.positie === null) {
    const waarom =
      doel.groep === "Product"
        ? "terwijl we dit product wel verkopen"
        : "terwijl we hier wel een pagina voor hebben";
    return `Wij komen op dit zoekwoord niet voor in Google: geen enkele vertoning in het venster, ${waarom}.`;
  }
  const instructie = paginaInstructie(doel);
  const mis = instructie ? `\n\nLet op: ${instructie}` : "";
  return `Wij stonden op positie ${doel.positie} met ${doel.impressies} vertoningen en ${doel.clicks} klikken. Die positie is een gemiddelde over alle pagina's die de term pakten, dus niet de positie van één specifieke pagina.${mis}`;
}

/** De opdracht voor één doelwoord uit de Naar #1-meter. */
export function bouwDoelPrompt(doel: DoelStand, venster?: Venster): string {
  const bestand = bestandVanPad(doel.pagina);
  const doelStelling =
    doel.positie === null
      ? `Zorg dat \`${doel.pagina}\` voor "${doel.woord}" gevonden kan worden.`
      : `Zorg dat \`${doel.pagina}\` de term "${doel.woord}" verdient en houdt.`;

  const instructie = paginaInstructie(doel);

  return `# SEO-opdracht: "${doel.woord}"

${doelStelling}

## Hoe je deze cijfers moet lezen
${vensterRegel(venster)}

## Stand
${stand(doel)}

## Doelpagina
\`${doel.pagina}\` — ${bestand}

## Wat ik van je wil
1. Lees de doelpagina en beoordeel of die het zoekwoord echt verdient: staat het in de title, de H1, de eerste alinea en de metadata-omschrijving?
2. Pas de inhoud aan zodat de pagina duidelijk over "${doel.woord}" gaat. Niet keyword-stuffen: schrijf iets dat een koper wil lezen en beantwoord de vraag achter het zoekwoord.
3. Controleer de interne links: linkt er iets naar deze pagina met relevante ankertekst? Zo niet, voeg dat toe vanaf een logische plek.
4. Controleer de JSON-LD op de pagina (zie lib/seo.ts voor de bouwstenen).${
    instructie ? `\n5. ${instructie}` : ""
  }

## Werkwijze
- ${WERKWIJZE}

## Huisstijl
- ${HUISSTIJL}

## Niet doen
- Geen nieuwe pagina's aanmaken zonder dat te melden.
- Geen claims verzinnen over duurzaamheid of certificering.
- Niet de homepage verzwakken. \`/\` staat op "duurzame vlaggen" en dat is de enige positie die dit domein echt bezit.
- Geen dunne pagina's bijbouwen puur om een zoekwoord af te vinken.`;
}

/**
 * Eén opdracht voor een hele set doelen — de werklijst-knop.
 *
 * Gegroepeerd per DOELPAGINA, niet per zoekwoord. De vorige versie gaf een platte
 * lijst van 30 woorden waarin `/collectie` vier keer voorkwam en
 * `/collectie/beachvlag` ook: dat nodigt uit tot vier losse bewerkrondes op
 * hetzelfde bestand, die elkaars werk overschrijven. Eén pagina is één opdracht,
 * met alle termen die 'm moeten winnen erbij.
 */
export function bouwWerklijstPrompt(doelen: DoelStand[], venster?: Venster): string {
  // Groeperen op pagina, met behoud van de binnenkomende sortering (op kans).
  const perPagina = new Map<string, DoelStand[]>();
  for (const d of doelen) {
    const lijst = perPagina.get(d.pagina) ?? [];
    lijst.push(d);
    perPagina.set(d.pagina, lijst);
  }

  /** Beste (laagste) positie van een pagina; pagina's zonder data achteraan. */
  const besteRang = (lijst: DoelStand[]) =>
    Math.min(...lijst.map((d) => d.positie ?? Number.POSITIVE_INFINITY));

  const blokken = [...perPagina.entries()].sort((a, b) => {
    const ra = besteRang(a[1]);
    const rb = besteRang(b[1]);
    if (ra !== rb) return ra - rb;
    // Beide zonder data: de pagina met de meeste doelwoorden eerst — daar zit de
    // meeste hefboom per bewerkronde.
    return b[1].length - a[1].length;
  });

  const blok = ([pagina, lijst]: [string, DoelStand[]]) => {
    const termen = lijst
      .map((d) => {
        const situatie = paginaSituatie(d);
        const notitie =
          situatie === "geen-conflict"
            ? ""
            : situatie === "homepage"
              ? " · de homepage pakt 'm nu (niet verzwakken, wel naartoe linken)"
              : situatie === "kannibalisatie"
                ? ` · **${d.rankendePagina} pakt 'm nu: echte zelfconcurrentie**`
                : ` · stond op ${d.rankendePagina}, een oude WP-URL (controleer de 301)`;
        const cijfers =
          d.positie !== null
            ? `positie ${d.positie}, ${d.impressies} vertoningen`
            : "geen vertoningen";
        return `  - "${d.woord}" · ${cijfers}${notitie}`;
      })
      .join("\n");
    return `### \`${pagina}\`\n${bestandVanPad(pagina)}\n\n${termen}`;
  };

  return `# SEO-werklijst — duurzame-vlaggen.nl

${blokken.length} pagina's, ${doelen.length} zoekwoorden. Werk per pagina, niet per zoekwoord: één pagina bedient meerdere termen en losse rondes over hetzelfde bestand overschrijven elkaar.

## Hoe je deze cijfers moet lezen
${vensterRegel(venster)}

Daarom is de volgorde hieronder een hint, geen ranglijst. Pagina's waar al iets rankte staan boven; de rest heeft geen meetbaar verschil, dus daar bepaalt jouw oordeel over koopintentie de volgorde.

## De pagina's
${blokken.map(blok).join("\n\n") || "(geen)"}

## Aanpak per pagina
1. Lees de pagina. Verdient hij de termen die eronder staan? Kijk naar title, H1, eerste alinea, metadata-omschrijving en JSON-LD.
2. Schrijf voor de koper, niet voor de crawler. Beantwoord de vraag achter het zoekwoord; één pagina mag meerdere verwante termen bedienen zonder ze allemaal letterlijk te herhalen.
3. Zorg voor minstens één interne link naar de pagina met een van deze termen als ankertekst.
4. Meld per pagina wat je hebt gewijzigd en waarom. Als een term niet bij de pagina past, zeg dat in plaats van 'm er alsnog in te wringen.

## Werkwijze
- ${WERKWIJZE}

## Huisstijl
- ${HUISSTIJL}

## Niet doen
- Niet de homepage verzwakken. \`/\` staat op "duurzame vlaggen" en dat is de enige positie die dit domein echt bezit.
- Geen nieuwe pagina's aanmaken zonder dat te melden.
- Geen claims verzinnen over duurzaamheid of certificering.
- De prijslogica in \`lib/pricing/local-catalog.ts\` blijft ongemoeid.`;
}
