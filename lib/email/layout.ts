import "server-only";
import { SITE_URL } from "@/lib/seo";
import { BEDRIJF } from "@/lib/bedrijf";

/**
 * Huisstijl-layout voor transactionele e-mail.
 *
 * E-mail is geen web. Drie beperkingen bepalen dit bestand:
 *
 *  1. **Geen webfonts.** Gmail en Outlook laden `@font-face` niet, dus Sora en
 *     Manrope komen niet aan. We gebruiken een systeem-stack; kleur, opbouw en
 *     toon dragen de huisstijl.
 *  2. **Tabellen, geen flex/grid.** Outlook (Word-renderer) kent moderne layout
 *     niet. Alles is `<table>` met inline styles — geen `<style>`-blok, want
 *     Gmail strijkt dat deels weg.
 *  3. **Absolute URL's.** Het logo moet publiek bereikbaar zijn, vandaar
 *     `SITE_URL` (volgt NEXT_PUBLIC_APP_URL). Lokaal wijst dat naar localhost;
 *     in een echte mail laadt het logo dan niet. Dat is alleen in dev zo.
 */

// V5.0-palet (docs/STYLEGUIDE.md).
const FOREST = "#2C5F4F";
const TERRACOTTA = "#C66B4E";
const SAGE_BLUE = "#5C8A9D";
const OFFWHITE = "#F7F5F2";
const CHARCOAL = "#3A3A3A";
const STONE = "#8B8D7A";
const WHITE = "#FFFFFF";

/** Systeem-stack die op elke client leesbaar is en geometrisch aandoet. */
const FONT =
  "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif";

export interface KnopLink {
  label: string;
  url: string;
}

export interface LayoutOpties {
  /** Titel in de kopband. */
  titel: string;
  /** Kleine regel onder de titel. */
  ondertitel?: string;
  /** HTML van de body — gebruik `alinea()` en `blok()` om dit te bouwen. */
  inhoud: string;
  /** Optionele primaire knop onderaan de inhoud. */
  knop?: KnopLink;
}

/** Eén tekstalinea in de juiste maat en kleur. */
export function alinea(html: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${CHARCOAL};">${html}</p>`;
}

/** Ingetogen bijschrift. */
export function fijn(html: string): string {
  return `<p style="margin:0 0 14px;font-size:13px;line-height:1.55;color:${STONE};">${html}</p>`;
}

/** Off-white blok voor een uitgelicht detail (ordernummer, track & trace). */
export function blok(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
    <tr><td style="background:${OFFWHITE};border-left:3px solid ${SAGE_BLUE};padding:14px 16px;font-size:14px;line-height:1.55;color:${CHARCOAL};">${html}</td></tr>
  </table>`;
}

/**
 * Wikkelt inhoud in het briefpapier: forest kopband met logo, terracotta
 * accentlijn, en een voet met de bedrijfsgegevens. Spiegelt bewust de PDF-
 * factuur, zodat mail en document herkenbaar één merk zijn.
 */
export function mailLayout({ titel, ondertitel, inhoud, knop }: LayoutOpties): string {
  const logoUrl = `${SITE_URL}/logo-mark.png`;

  const knopHtml = knop
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;">
         <tr><td style="background:${TERRACOTTA};border-radius:8px;">
           <a href="${knop.url}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:15px;font-weight:700;color:${WHITE};text-decoration:none;">${knop.label}</a>
         </td></tr>
       </table>`
    : "";

  const adres = [BEDRIJF.adres.straat, `${BEDRIJF.adres.postcode ?? ""} ${BEDRIJF.adres.plaats}`.trim()]
    .filter(Boolean)
    .join(" · ");

  return `<!doctype html>
<html lang="nl">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${titel}</title></head>
<body style="margin:0;padding:0;background:${OFFWHITE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${OFFWHITE};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${WHITE};border-radius:14px;overflow:hidden;">

        <!-- Kopband -->
        <tr><td style="background:${FOREST};padding:26px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <div style="font-family:${FONT};font-size:22px;font-weight:700;color:${WHITE};line-height:1.25;">${titel}</div>
                ${ondertitel ? `<div style="font-family:${FONT};font-size:13px;color:${OFFWHITE};margin-top:4px;">${ondertitel}</div>` : ""}
              </td>
              <td align="right" style="vertical-align:middle;width:52px;">
                <img src="${logoUrl}" width="44" height="44" alt="Duurzame Vlaggen" style="display:block;border:0;"/>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Terracotta accentlijn, zoals op de factuur -->
        <tr><td style="background:${TERRACOTTA};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>

        <!-- Inhoud -->
        <tr><td style="padding:26px 28px 8px;font-family:${FONT};">
          ${inhoud}
          ${knopHtml}
        </td></tr>

        <!-- Voet -->
        <tr><td style="padding:18px 28px 24px;border-top:1px solid #EDEBE7;font-family:${FONT};">
          <div style="font-size:12px;line-height:1.6;color:${STONE};">
            <strong style="color:${CHARCOAL};">${BEDRIJF.handelsnaam}</strong> · onderdeel van ${BEDRIJF.rechtspersoon}<br/>
            ${adres ? `${adres}<br/>` : ""}
            <a href="mailto:${BEDRIJF.email}" style="color:${FOREST};text-decoration:none;">${BEDRIJF.email}</a> · ${BEDRIJF.telefoon}
          </div>
        </td></tr>

      </table>

      <div style="font-family:${FONT};font-size:11px;color:${STONE};margin-top:14px;">
        Vlaggen die verdwijnen. Zero plastic.
      </div>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Platte-tekstversie. Sommige clients tonen die, en spamfilters wegen 'm mee. */
export function platteTekst(regels: string[]): string {
  return [
    ...regels,
    "",
    `${BEDRIJF.handelsnaam} · onderdeel van ${BEDRIJF.rechtspersoon}`,
    `${BEDRIJF.email} · ${BEDRIJF.telefoon}`,
  ].join("\n");
}
