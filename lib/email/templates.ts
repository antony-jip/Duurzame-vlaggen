import "server-only";
import type { OrderRow } from "@/lib/db/types";
import { mailLayout, alinea, fijn, blok, platteTekst } from "./layout";

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
            (order.carrier ? `<br/><br/><strong>Vervoerder</strong><br/>${order.carrier}` : ""),
        ) +
        fijn(
          "Bij je bestelling zit een materiaalpaspoort met de duurzaamheidscijfers, bruikbaar voor je eigen rapportage.",
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
