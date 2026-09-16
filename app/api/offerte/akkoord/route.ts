/**
 * Offerte accepteren: naam + e-mail bevestigen → betaallink in de mail.
 *
 * De klant komt hier via de knop "Offerte accepteren" in de offertemail. De
 * link is ondertekend (lib/offerte/token.ts): nummer, bedrag en geldigheid
 * komen uit het token, nooit uit het formulier. Deze route:
 *
 *  1. controleert token en geldigheid,
 *  2. maakt een Mollie-betaallink (account Duurzame Vlaggen) voor het
 *     offertebedrag, met een webhook die Antony meldt zodra er betaald is,
 *  3. mailt de betaallink naar de klant,
 *  4. meldt het akkoord aan Antony.
 *
 * Staan er "prijs volgt"-regels op de offerte, dan maken we geen betaallink:
 * het bedrag is dan niet compleet. Antony krijgt wel de melding.
 *
 * Lukt Mollie niet, dan gaat het akkoord niet verloren: Antony krijgt de melding
 * met de opdracht de link met de hand te sturen, en de klant hoort dat de
 * betaallink binnen één werkdag komt.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { BEDRIJF } from "@/lib/bedrijf";
import { isEmailConfigured } from "@/lib/email/client";
import { alinea, blok, fijn, mailLayout, platteTekst } from "@/lib/email/layout";
import { sendMailInhoud } from "@/lib/email/send";
import { publicEnv, serverEnv } from "@/lib/env";
import { createPaymentLink } from "@/lib/mollie/payment-links";
import { OFFERTE_MELDING_AAN } from "@/lib/offerte/adressen";
import { offerteVerlopen, verifyOfferteToken } from "@/lib/offerte/token";

export const runtime = "nodejs";


const schema = z.object({
  t: z.string().min(10).max(4000),
  naam: z.string().trim().min(2, "Vul je naam in").max(120),
  email: z.email("Vul een geldig e-mailadres in").max(200),
});

const IP_MAX = 10;
const VENSTER_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();
function rateLimited(key: string): boolean {
  const nu = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => nu - t < VENSTER_MS);
  const vol = recent.length >= IP_MAX;
  if (!vol) recent.push(nu);
  hits.set(key, recent);
  return vol;
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const euro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Controleer je gegevens." },
      { status: 400 },
    );
  }
  const { t, naam, email } = parsed.data;

  const offerte = verifyOfferteToken(t, serverEnv.emailLinkSecret);
  if (!offerte) {
    return NextResponse.json({ error: "Deze link is niet geldig." }, { status: 400 });
  }
  if (offerteVerlopen(offerte)) {
    return NextResponse.json(
      { error: `Deze offerte is verlopen. Vraag een nieuwe aan op de site of bel ${BEDRIJF.telefoon}.` },
      { status: 410 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (rateLimited(`ip:${ip}`)) {
    return NextResponse.json(
      { error: `Te veel pogingen. Probeer het later opnieuw of bel ${BEDRIJF.telefoon}.` },
      { status: 429 },
    );
  }

  if (!isEmailConfigured()) {
    console.error(`[offerte-akkoord] ${offerte.n} NIET verwerkt: RESEND_API_KEY ontbreekt.`);
    return NextResponse.json(
      { error: `We kunnen je akkoord nu niet verwerken. Bel ons op ${BEDRIJF.telefoon}.` },
      { status: 503 },
    );
  }

  // --- Betaallink ------------------------------------------------------------
  let betaalUrl: string | null = null;
  let mollieFout: string | null = null;
  if (!offerte.h) {
    try {
      const base = publicEnv.appUrl;
      const link = await createPaymentLink({
        amount: offerte.t,
        description: `Offerte ${offerte.n} · ${BEDRIJF.handelsnaam}`,
        redirectUrl: `${base}/offerte/betaald?n=${encodeURIComponent(offerte.n)}`,
        webhookUrl: `${base}/api/offerte/webhook?n=${encodeURIComponent(offerte.n)}`,
      });
      betaalUrl = link.url;
      if (!betaalUrl) mollieFout = "Mollie gaf geen betaal-URL terug";
    } catch (err) {
      mollieFout = err instanceof Error ? err.message : "onbekende fout";
      console.error(`[offerte-akkoord] Betaallink ${offerte.n} mislukt:`, err);
    }
  }

  // --- Mail naar de klant ----------------------------------------------------
  const voornaam = escape(naam.split(" ")[0]);
  const samenvatting = blok(
    `<strong>Offerte ${escape(offerte.n)}</strong><br/>${escape(offerte.s)}<br/>Totaal ${euro(offerte.t)} incl. btw`,
  );
  const klantMail = betaalUrl
    ? {
        onderwerp: `Betaallink voor offerte ${offerte.n}`,
        html: mailLayout({
          titel: "Bedankt voor je akkoord",
          ondertitel: `Offerte ${offerte.n}`,
          inhoud: [
            alinea(`Beste ${voornaam},`),
            alinea("Bedankt voor je akkoord. Met de knop hieronder betaal je de offerte via iDEAL, creditcard of overboeking."),
            samenvatting,
            fijn(`Na betaling gaan we voor je aan de slag. Vragen? Bel ${BEDRIJF.telefoon}.`),
          ].join(""),
          knop: { label: `Betaal ${euro(offerte.t)}`, url: betaalUrl },
        }),
        tekst: platteTekst([
          `Beste ${naam.split(" ")[0]},`,
          "",
          `Bedankt voor je akkoord op offerte ${offerte.n} (${euro(offerte.t)} incl. btw).`,
          `Betaal via: ${betaalUrl}`,
        ]),
      }
    : {
        onderwerp: `Akkoord ontvangen voor offerte ${offerte.n}`,
        html: mailLayout({
          titel: "Bedankt voor je akkoord",
          ondertitel: `Offerte ${offerte.n}`,
          inhoud: [
            alinea(`Beste ${voornaam},`),
            alinea("Bedankt voor je akkoord. We sturen je de betaallink binnen één werkdag."),
            samenvatting,
            fijn(`Vragen? Bel ${BEDRIJF.telefoon}.`),
          ].join(""),
        }),
        tekst: platteTekst([
          `Beste ${naam.split(" ")[0]},`,
          "",
          `Bedankt voor je akkoord op offerte ${offerte.n}. We sturen je de betaallink binnen één werkdag.`,
        ]),
      };

  const klant = await sendMailInhoud(email, klantMail, { "Reply-To": serverEnv.contactInbox });

  // --- Melding aan Antony ----------------------------------------------------
  // Altijd, ook als de klantmail faalde: het akkoord mag nooit verdampen.
  const actie = offerte.h
    ? "Er staan regels met 'prijs volgt' op. Maak de prijs compleet en stuur zelf een betaallink."
    : mollieFout
      ? `Betaallink maken MISLUKT (${mollieFout}). Stuur de klant zelf een betaallink.`
      : klant.sent
        ? "Betaallink is naar de klant gemaild."
        : `Betaallink gemaakt, maar de mail naar de klant MISLUKTE (${klant.reason}). Stuur hem zelf door.`;

  const regels: Array<[string, string]> = [
    ["Offerte", offerte.n],
    ["Onderwerp", offerte.s],
    ["Totaal", `${euro(offerte.t)} incl. btw`],
    ["Organisatie", offerte.o],
    ["Naam (akkoord)", naam],
    ["E-mail (akkoord)", email],
    ["Aangevraagd door", `${offerte.nm} · ${offerte.e}`],
    ["Referentie", offerte.r || "-"],
    ["Betaallink", betaalUrl ?? "-"],
  ];
  const melding = await sendMailInhoud(
    OFFERTE_MELDING_AAN,
    {
      onderwerp: `Akkoord op offerte ${offerte.n} · ${offerte.o} · ${euro(offerte.t)}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#212421;line-height:1.55;max-width:600px;">
          <h1 style="color:#2c5f4f;font-size:20px;margin:0 0 12px;">Akkoord op offerte ${escape(offerte.n)}</h1>
          <p style="margin:0 0 16px;"><strong>${escape(actie)}</strong></p>
          <table style="border-collapse:collapse;">
            ${regels
              .map(
                ([l, w]) =>
                  `<tr><td style="padding:4px 16px 4px 0;color:#6b6f6b;vertical-align:top;">${l}</td><td><strong>${escape(w)}</strong></td></tr>`,
              )
              .join("")}
          </table>
        </div>`,
      tekst: [`Akkoord op offerte ${offerte.n}`, actie, "", ...regels.map(([l, w]) => `${l}: ${w}`)].join("\n"),
    },
    { "Reply-To": email },
  );
  if (!melding.sent) {
    console.error(`[offerte-akkoord] Melding ${offerte.n} aan Antony mislukt (${melding.reason}).`);
  }

  if (!klant.sent && !melding.sent) {
    return NextResponse.json(
      { error: `Versturen lukte niet. Bel ons op ${BEDRIJF.telefoon}, dan regelen we het direct.` },
      { status: 502 },
    );
  }

  // De betaallink ook direct op de pagina: de klant hoeft niet naar zijn mail.
  return NextResponse.json({ ok: true, betaalUrl });
}
