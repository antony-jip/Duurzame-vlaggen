import "server-only";
import type { OrderRow } from "@/lib/db/types";
import { mailLayout, alinea, fijn, blok, platteTekst } from "./layout";
import {
  HOOFDTEST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";
import { SITE_URL } from "@/lib/seo";

/** Percentage in Nederlandse notatie (94.2 → "94,2"). */

/**
 * De onderbouwde afbraakregel, in één zin. Een percentage mag nooit los in de
 * copy staan: altijd met omgeving, termijn en norm erbij, en met de link naar
 * de claimpagina. Zie lib/claims/afbreekbaarheid.ts.
 */
const AFBRAAK_ZIN = `In zeewater brak ${pctNl(HOOFDTEST.afbraakPct)}% van het doek af in ${HOOFDTEST.duur}, gemeten volgens ${HOOFDTEST.norm}.`;
const AFBRAAK_URL = `${SITE_URL}${ONDERBOUWING_PAD}`;

/**
 * Klantmails per fase. Spiegelt de snelknoppen op de order-detailpagina.
 *
 * Toon: direct en stellig, zoals de site. Geen em-dashes (huisstijl), geen
 * uitroeptekens, geen "wij zijn verheugd". Beloftes die we niet waarmaken staan
 * er niet in: we noemen alleen wat vaststaat.
 */

export type MailSoort = "in_productie" | "verzonden" | "vraag";

export interface MailInhoud {
  onderwerp: string;
  html: string;
  tekst: string;
}

function voornaam(order: OrderRow): string {
  const bron = (order.shipping_address ?? order.billing_address ?? {}) as {
    first_name?: string;
  };
  return bron.first_name?.trim() || "";
}

function aanhef(order: OrderRow): string {
  const naam = voornaam(order);
  return naam ? `Hoi ${naam},` : "Hoi,";
}

/** "Wordt voor je gemaakt" — verstuurd zodra de order in productie is. */
function inProductie(order: OrderRow): MailInhoud {
  const heeftLink = Boolean(order.tracking_url);
  return {
    onderwerp: `Je vlaggen worden gemaakt · ${order.order_number}`,
    html: mailLayout({
      titel: "Je vlaggen worden gemaakt",
      ondertitel: order.order_number,
      inhoud:
        alinea(aanhef(order)) +
        alinea(
          "Je bestelling staat in productie. Zodra hij de deur uit gaat, laten we het weten.",
        ) +
        blok(
          `<strong>Ordernummer</strong><br/>${order.order_number}<br/><br/>` +
            `<strong>Levering</strong><br/>Doorgaans binnen 3 werkdagen na productie.`,
        ) +
        fijn(
          "Klopt er iets niet? Reageer op deze mail, dan kijken we er direct naar.",
        ),
      knop: heeftLink
        ? { label: "Volg je bestelling", url: order.tracking_url! }
        : undefined,
    }),
    tekst: platteTekst([
      aanhef(order),
      "",
      "Je bestelling staat in productie. Zodra hij de deur uit gaat, laten we het weten.",
      "",
      `Ordernummer: ${order.order_number}`,
      heeftLink ? `Volgen: ${order.tracking_url}` : "",
      "",
      "Klopt er iets niet? Reageer op deze mail.",
    ]),
  };
}

/** "Onderweg" — met track & trace als die er is. */
function verzonden(order: OrderRow): MailInhoud {
  const heeftLink = Boolean(order.tracking_url);
  return {
    onderwerp: `Je bestelling is onderweg · ${order.order_number}`,
    html: mailLayout({
      titel: "Je bestelling is onderweg",
      ondertitel: order.order_number,
      inhoud:
        alinea(aanhef(order)) +
        alinea(
          heeftLink
            ? "Je vlaggen zijn verzonden. Met onderstaande knop volg je het pakket."
            : "Je vlaggen zijn verzonden en komen eraan.",
        ) +
        blok(
          `<strong>Ordernummer</strong><br/>${order.order_number}` +
            (order.carrier
              ? `<br/><br/><strong>Vervoerder</strong><br/>${order.carrier}`
              : ""),
        ) +
        fijn(
          `Bij je bestelling zit een materiaalpaspoort: samenstelling, herkomst en de vier ASTM-testrapporten. ${AFBRAAK_ZIN}`,
        ),
      knop: heeftLink
        ? { label: "Volg je pakket", url: order.tracking_url! }
        : undefined,
    }),
    tekst: platteTekst([
      aanhef(order),
      "",
      "Je vlaggen zijn verzonden.",
      "",
      `Ordernummer: ${order.order_number}`,
      order.carrier ? `Vervoerder: ${order.carrier}` : "",
      heeftLink ? `Volgen: ${order.tracking_url}` : "",
    ]),
  };
}

/** Open vraag aan de klant — het bericht vult Antony zelf. */
function vraag(order: OrderRow, bericht: string): MailInhoud {
  return {
    onderwerp: `Vraag over je bestelling · ${order.order_number}`,
    html: mailLayout({
      titel: "Een vraag over je bestelling",
      ondertitel: order.order_number,
      inhoud:
        alinea(aanhef(order)) +
        // Handmatig bericht: newlines naar <br/>, en HTML in de invoer wordt
        // door de aanroeper geëscaped (zie escapeHtml in de server action).
        alinea(bericht.replace(/\n/g, "<br/>")) +
        fijn("Reageer gerust op deze mail, dan pakken we het op."),
    }),
    tekst: platteTekst([aanhef(order), "", bericht]),
  };
}

/**
 * Bouw een mail. `bericht` is alleen voor `vraag`; de andere twee schrijven
 * zichzelf uit de order.
 */
export function bouwMail(
  soort: MailSoort,
  order: OrderRow,
  bericht = "",
): MailInhoud {
  switch (soort) {
    case "in_productie":
      return inProductie(order);
    case "verzonden":
      return verzonden(order);
    case "vraag":
      return vraag(order, bericht);
  }
}

/** Labels voor de snelknoppen in de admin. */
export const MAIL_LABELS: Record<MailSoort, string> = {
  in_productie: "In productie",
  verzonden: "Verzonden",
  vraag: "Vraag",
};

// ---------------------------------------------------------------------------
// Aanleverportaal ("later aanleveren")
// ---------------------------------------------------------------------------

function escapeHtmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * "Lever je ontwerpen aan" — automatisch verstuurd zodra een betaalde order
 * design-toewijzingen zonder bestand heeft. De portaallink is een bearer-token:
 * wie de link heeft kan aanleveren, dus de mail benoemt de geldigheidsduur.
 */
export function ontwerpenAanleveren(
  order: OrderRow,
  pending: number,
  portalUrl: string,
  portalDays: number,
): MailInhoud {
  const wat = pending === 1 ? "1 ontwerp" : `${pending} ontwerpen`;
  return {
    onderwerp: `Nog ${wat} aan te leveren · ${order.order_number}`,
    html: mailLayout({
      titel: "Lever je ontwerpen aan",
      ondertitel: order.order_number,
      inhoud:
        alinea(aanhef(order)) +
        alinea(
          `Je betaling is binnen. Voor ${wat} van je bestelling hebben we nog geen bestand.`,
        ) +
        alinea(
          "Upload ze wanneer het jou uitkomt via jouw persoonlijke uploadpagina. Daar kun je ook een al aangeleverd ontwerp vervangen, tot we je bestelling in productie nemen.",
        ) +
        blok(
          `<strong>Ordernummer</strong><br/>${order.order_number}<br/><br/>` +
            `<strong>Uploadlink</strong><br/>De link hieronder is ${portalDays} dagen geldig en werkt zonder inloggen. Deel hem niet.`,
        ) +
        fijn("We starten de productie zodra alles binnen is."),
      knop: { label: "Ontwerpen aanleveren", url: portalUrl },
    }),
    tekst: platteTekst([
      aanhef(order),
      "",
      `Je betaling is binnen. Voor ${wat} van je bestelling hebben we nog geen bestand.`,
      `Lever aan via jouw persoonlijke uploadpagina (${portalDays} dagen geldig, zonder inloggen):`,
      portalUrl,
      "",
      "We starten de productie zodra alles binnen is.",
    ]),
  };
}

/**
 * Interne notificatie: een klant leverde of verving een ontwerp via het
 * portaal. Bij `remainingPending === 0` is dit het sein dat de order compleet
 * is en handmatig bij Probo besteld kan worden.
 */
export function portaalNotificatie(input: {
  order: OrderRow;
  kind: "delivered" | "replaced";
  fileName: string;
  itemLabel: string;
  remainingPending: number;
  adminUrl: string;
}): MailInhoud {
  const actie = input.kind === "delivered" ? "aangeleverd" : "vervangen";
  const compleet = input.remainingPending === 0;
  const status = compleet
    ? "Alle ontwerpen zijn nu binnen. De order kan bij Probo besteld worden (Markeer besteld in de admin)."
    : input.remainingPending === 1
      ? "Er wacht nog 1 ontwerp op aanlevering."
      : `Er wachten nog ${input.remainingPending} ontwerpen op aanlevering.`;

  return {
    onderwerp: compleet
      ? `Alle ontwerpen binnen · ${input.order.order_number}`
      : `Ontwerp ${actie} · ${input.order.order_number}`,
    html: mailLayout({
      titel: compleet ? "Alle ontwerpen binnen" : `Ontwerp ${actie}`,
      ondertitel: input.order.order_number,
      inhoud:
        alinea(
          `Klant <strong>${escapeHtmlText(input.order.email)}</strong> heeft via het aanleverportaal een ontwerp ${actie} voor <strong>${escapeHtmlText(input.itemLabel)}</strong>.`,
        ) +
        blok(
          `<strong>Bestand</strong><br/>${escapeHtmlText(input.fileName)}<br/><br/>` +
            `<strong>Status</strong><br/>${status}`,
        ),
      knop: { label: "Bekijk de order in de admin", url: input.adminUrl },
    }),
    tekst: platteTekst([
      `Klant ${input.order.email} heeft een ontwerp ${actie} voor ${input.itemLabel} (order ${input.order.order_number}).`,
      `Bestand: ${input.fileName}`,
      status,
      input.adminUrl,
    ]),
  };
}

// ---------------------------------------------------------------------------
// Lifecycle: vervangingsherinneringen (4 en 8 maanden na verzending)
// ---------------------------------------------------------------------------

/**
 * Copy-regels: functionele levensduur 3 tot 4 maanden, tot 2 jaar UV-kleurvast,
 * en de afbraak altijd als meting (percentage + omgeving + termijn + norm) uit
 * lib/claims/afbreekbaarheid.ts, met de link naar /afbreekbaarheid erbij. NOOIT
 * "100%", nooit een microplastic-claim: CiCLO versnelt de afbraak van vezels
 * die zijn afgegeven, het vermindert de afgifte niet. Dit is marketingmail, dus
 * verplicht een uitschrijflink in de voet.
 */
export type LifecycleStageKey = "4m" | "8m";

export function lifecycleMail(input: {
  order: OrderRow;
  stage: LifecycleStageKey;
  flagNames: string[];
  reorderUrl: string;
  unsubscribeUrl: string;
}): MailInhoud {
  const vlaggen =
    input.flagNames.length > 0 ? input.flagNames.join(" · ") : "je vlaggen";

  const inhoud4m =
    alinea(aanhef(input.order)) +
    alinea(
      `Je vlaggen van bestelling ${input.order.order_number} wapperen nu zo'n vier maanden. Precies de functionele levensduur van Flag-CiCLO® doek: 3 tot 4 maanden intensief buiten.`,
    ) +
    alinea(
      "Daarna wordt het doek moe. Kleuren vervagen, randen rafelen. En een vermoeide vlag hangt precies op de plek waar jij zichtbaar wilt zijn.",
    ) +
    alinea(
      `Vervangen doe je hier met een gerust hart: je oude vlag is biologisch afbreekbaar. ${AFBRAAK_ZIN} <a href="${AFBRAAK_URL}" style="color:#2C5F4F;">Zo is dat gemeten</a>.`,
    );

  const inhoud8m =
    alinea(aanhef(input.order)) +
    alinea(
      `Je vlaggen van bestelling ${input.order.order_number} zijn nu acht maanden oud. Dat is ruim voorbij de functionele levensduur van 3 tot 4 maanden.`,
    ) +
    alinea(
      "Het doek is tot 2 jaar UV-kleurvast, maar na acht maanden buiten vertelt je vlag een ander verhaal dan je merk.",
    ) +
    alinea(
      `Een frisse vlag, zonder spijt: het oude doek is biologisch afbreekbaar. ${AFBRAAK_ZIN} <a href="${AFBRAAK_URL}" style="color:#2C5F4F;">Zo is dat gemeten</a>.`,
    );

  const onderwerp =
    input.stage === "4m"
      ? "Je vlag heeft vier maanden gewapperd."
      : "Hangt hij er nog?";

  return {
    onderwerp,
    html: mailLayout({
      titel:
        input.stage === "4m"
          ? "Vier maanden wind, zon en regen."
          : "Acht maanden. Tijd voor een eerlijke blik.",
      ondertitel: escapeHtmlText(vlaggen),
      inhoud:
        (input.stage === "4m" ? inhoud4m : inhoud8m) +
        fijn(
          "Zelfde maat, zelfde ontwerp, twee klikken. Liever een nieuw ontwerp? Dat vervang je zo in de winkelmand.",
        ) +
        fijn(
          `Geen herinneringen meer ontvangen? <a href="${input.unsubscribeUrl}" style="color:#8B8D7A;">Schrijf je uit</a> met één klik.`,
        ),
      knop: { label: "Bestel dezelfde vlag opnieuw", url: input.reorderUrl },
    }),
    tekst: platteTekst([
      aanhef(input.order),
      "",
      input.stage === "4m"
        ? `Je vlaggen van bestelling ${input.order.order_number} wapperen nu zo'n vier maanden. Dat is de functionele levensduur van Flag-CiCLO® doek: 3 tot 4 maanden intensief buiten.`
        : `Je vlaggen van bestelling ${input.order.order_number} zijn nu acht maanden oud. Dat is ruim voorbij de functionele levensduur van 3 tot 4 maanden.`,
      `Vervangen doe je met een gerust hart: het oude doek is biologisch afbreekbaar. ${AFBRAAK_ZIN}`,
      `Zo is dat gemeten: ${AFBRAAK_URL}`,
      "",
      `Bestel dezelfde vlag opnieuw: ${input.reorderUrl}`,
      "Zelfde maat, zelfde ontwerp, twee klikken. Een nieuw ontwerp uploaden kan ook, gewoon in de winkelmand.",
      "",
      `Geen herinneringen meer? Schrijf je uit: ${input.unsubscribeUrl}`,
    ]),
  };
}
