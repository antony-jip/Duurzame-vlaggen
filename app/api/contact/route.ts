/**
 * Contactformulier-API.
 *
 * De site voert geen mailadres meer naar buiten: het is een webshop, en alle
 * klantcontact loopt via dit formulier. Dat maakt deze route het ENIGE kanaal
 * waarlangs een bezoeker ons bereikt — en dat bepaalt het hele ontwerp:
 *
 *  - Faalt de verzending, dan zeggen we dat ook. Een formulier dat "verzonden!"
 *    meldt terwijl er niets vertrekt, verliest de lead stil; dat is erger dan de
 *    mailto:-stub die hier eerst stond, want die faalde tenminste zichtbaar.
 *    Vandaar dat we `sendMailInhoud`'s resultaat controleren i.p.v. best-effort
 *    te vuren zoals de order-flow doet (die mag nooit breken op een mail; dit
 *    IS de mail).
 *  - Reply-To staat op de bezoeker, zodat antwoorden gewoon "beantwoorden" is.
 *
 * Spam: honeypot + een lengtegrens op elk veld. Bewust geen captcha — dat kost
 * conversie op een formulier dat toch al door een mens gelezen wordt.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { serverEnv } from "@/lib/env";
import { sendMailInhoud } from "@/lib/email/send";
import { isEmailConfigured } from "@/lib/email/client";

export const runtime = "nodejs";

/** Onderwerpen zoals het formulier ze aanbiedt. Buiten deze set: ongeldig. */
const ONDERWERPEN = {
  offerte: "Offerte aanvragen",
  csrd: "CSRD & compliance",
  producten: "Producten & prijzen",
  ontwerp: "Eigen ontwerp",
  overig: "Overig",
} as const;

const schema = z.object({
  name: z.string().trim().min(2, "Naam is te kort").max(120),
  email: z.email("Vul een geldig e-mailadres in").max(200),
  phone: z.string().trim().max(40).optional().default(""),
  company: z.string().trim().max(160).optional().default(""),
  subject: z.enum(
    Object.keys(ONDERWERPEN) as [keyof typeof ONDERWERPEN],
    "Kies een onderwerp",
  ),
  message: z.string().trim().min(10, "Vertel iets meer").max(5000),
  product: z.string().trim().max(160).optional().default(""),
  /**
   * Honeypot: onzichtbaar veld. Ingevuld ⇒ bot.
   *
   * Bewust GEEN .max(0) hier: dan weigert zod het veld al met een validatiefout,
   * en die vertelt de bot precies dat hij gesnapt is. De afhandeling hoort in de
   * route, die net doet alsof het bericht aankwam.
   */
  website: z.string().max(500).optional().default(""),
});

/** HTML-escape — de inhoud komt van een vreemde en gaat in een mail-body. */
function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const eerste = parsed.error.issues[0];
    return NextResponse.json(
      { error: eerste?.message ?? "Controleer je gegevens." },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Honeypot geraakt: doe alsof het goed ging. Een bot hoeft niet te leren dat
  // hij door de mand viel, en een mens komt hier nooit.
  if (data.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  // Niet geconfigureerd ⇒ nu stoppen. Dit is het enige contactkanaal van de
  // site, dus stil overslaan (zoals de order-mails doen) zou de aanvraag laten
  // verdampen zonder dat iemand het merkt.
  if (!isEmailConfigured()) {
    console.error(
      "[contact] Aanvraag NIET verstuurd: RESEND_API_KEY ontbreekt. " +
        `Van ${data.email} · onderwerp ${data.subject}.`,
    );
    return NextResponse.json(
      {
        error:
          "We kunnen je bericht nu niet versturen. Bel ons op 085 060 8963, dan helpen we je direct.",
      },
      { status: 503 },
    );
  }

  const onderwerpLabel = ONDERWERPEN[data.subject];
  const titel = data.product
    ? `${onderwerpLabel}: ${data.product}`
    : onderwerpLabel;

  const regels: Array<[string, string]> = [
    ["Naam", data.name],
    ["E-mail", data.email],
    ["Telefoon", data.phone || "—"],
    ["Bedrijf", data.company || "—"],
    ["Onderwerp", onderwerpLabel],
  ];
  if (data.product) regels.push(["Product", data.product]);

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#212421;line-height:1.55;max-width:560px;">
      <h1 style="color:#2c5f4f;font-size:20px;margin:0 0 16px;">${escape(titel)}</h1>
      <table style="border-collapse:collapse;margin:0 0 16px;">
        ${regels
          .map(
            ([label, waarde]) => `
          <tr>
            <td style="padding:4px 16px 4px 0;color:#6b6f6b;vertical-align:top;">${label}</td>
            <td style="padding:4px 0;"><strong>${escape(waarde)}</strong></td>
          </tr>`,
          )
          .join("")}
      </table>
      <div style="border-left:3px solid #2c5f4f;padding:4px 0 4px 12px;white-space:pre-wrap;">${escape(
        data.message,
      )}</div>
    </div>
  `;

  const tekst = [
    titel,
    "",
    ...regels.map(([label, waarde]) => `${label}: ${waarde}`),
    "",
    data.message,
  ].join("\n");

  const result = await sendMailInhoud(
    serverEnv.contactInbox,
    { onderwerp: `Contactformulier · ${titel}`, html, tekst },
    // Antwoorden gaat zo rechtstreeks naar de bezoeker, niet naar onszelf.
    { "Reply-To": data.email },
  );

  if (!result.sent) {
    console.error(
      `[contact] Verzenden mislukt (${result.reason}) voor ${data.email}.`,
    );
    return NextResponse.json(
      {
        error:
          "Versturen lukte niet. Probeer het zo nog eens, of bel 085 060 8963.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
