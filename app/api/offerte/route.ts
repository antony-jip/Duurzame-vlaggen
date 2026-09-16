/**
 * Offerte-API: samenstelling of winkelmand → offerte-PDF in de mail.
 *
 * Gemeenten en instellingen stellen samen, vragen een offerte en laten die
 * intern goedkeuren. Deze route:
 *
 *  1. valideert de gegevens (zod) en weert bots (honeypot + rate limit),
 *  2. rekent de regels opnieuw uit met het prijsmodel van de checkout
 *     (`berekenOfferte`), nooit met bedragen uit de browser,
 *  3. maakt de PDF op het briefpapier van Duurzame Vlaggen,
 *  4. mailt die naar de klant, met een BCC naar Antony (zelfde mail en PDF).
 *
 * De klantmail IS het product van deze route. Lukt die niet, dan zeggen we dat
 * ook (zelfde houding als /api/contact).
 *
 * Misbruik: deze route mailt een PDF naar een adres dat de bezoeker opgeeft.
 * Om te voorkomen dat hij als spamkanon dient, staat er geen vrije tekst van de
 * bezoeker in de klantmail zelf (alleen in de PDF, begrensd) en geldt een
 * rate limit per IP en per ontvanger.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { serverEnv } from "@/lib/env";
import { isEmailConfigured } from "@/lib/email/client";
import { sendMailInhoud } from "@/lib/email/send";
import { alinea, blok, fijn, mailLayout, platteTekst } from "@/lib/email/layout";
import { BEDRIJF } from "@/lib/bedrijf";
import {
  OFFERTE_GELDIG_DAGEN,
  OFFERTE_MAX_REGELS,
  berekenOfferte,
  nieuwOffertenummer,
  type OfferteBerekening,
} from "@/lib/offerte/bereken";
import { generateOfferte } from "@/lib/offerte/generate";

export const runtime = "nodejs";

/** Elke offerte gaat als BCC naar Antony: dezelfde mail en PDF als de klant. */
const OFFERTE_BCC = "antony@signcompany.nl";

// --- Rate limiting -----------------------------------------------------------
// Best-effort in-memory, per serverless-instantie (zelfde aanpak als
// /api/artwork). Genoeg om een script af te remmen, geen harde garantie.
const IP_MAX = 8;
const ONTVANGER_MAX = 5;
const VENSTER_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(key: string, max: number): boolean {
  const nu = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => nu - t < VENSTER_MS);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(nu);
  hits.set(key, recent);
  return false;
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// --- Validatie ---------------------------------------------------------------

const regelSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  sizeLabel: z.string().max(160).default(""),
  widthCm: z.number().positive().max(10_000).optional(),
  heightCm: z.number().positive().max(10_000).optional(),
  amount: z.number().int().min(1).max(10_000),
  options: z
    .array(
      z.object({
        code: z.string().max(80),
        value: z.union([z.string().max(600), z.number()]).optional(),
      }),
    )
    .max(30)
    .default([]),
});

const schema = z.object({
  organisatie: z.string().trim().min(2, "Vul je organisatie in").max(160),
  naam: z.string().trim().min(2, "Vul je naam in").max(120),
  email: z.email("Vul een geldig e-mailadres in").max(200),
  telefoon: z.string().trim().max(40).optional().default(""),
  referentie: z.string().trim().max(60).optional().default(""),
  opmerking: z.string().trim().max(1000).optional().default(""),
  regels: z.array(regelSchema).min(1, "Er is nog niets samengesteld").max(OFFERTE_MAX_REGELS),
  /** Honeypot: ingevuld = bot. Geen .max(0), zie /api/contact. */
  website: z.string().max(500).optional().default(""),
});

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const euro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

function regelsHtml(offerte: OfferteBerekening): string {
  return offerte.regels
    .map(
      (r) =>
        `<strong>${r.aantal}× ${escape(r.omschrijving)}</strong> · ${
          r.totaal === null ? "prijs volgt" : euro(r.totaal)
        }<br/><span style="color:#8B8D7A;font-size:13px;">${escape(r.detail)}</span>`,
    )
    .join("<br/><br/>");
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

  // Honeypot: doe alsof het lukte.
  if (data.website.length > 0) {
    return NextResponse.json({ ok: true, nummer: nieuwOffertenummer() });
  }

  if (
    rateLimited(`ip:${clientIp(request)}`, IP_MAX) ||
    rateLimited(`to:${data.email.toLowerCase()}`, ONTVANGER_MAX)
  ) {
    return NextResponse.json(
      { error: `Je hebt net al offertes aangevraagd. Probeer het over een uur opnieuw, of bel ${BEDRIJF.telefoon}.` },
      { status: 429 },
    );
  }

  const berekening = berekenOfferte(data.regels);
  if (!berekening.ok) {
    return NextResponse.json({ error: berekening.fout }, { status: 400 });
  }
  const offerte = berekening.offerte;

  if (!isEmailConfigured()) {
    console.error(
      `[offerte] NIET verstuurd: RESEND_API_KEY ontbreekt. ${data.organisatie} · ${data.email}.`,
    );
    return NextResponse.json(
      { error: `We kunnen de offerte nu niet mailen. Bel ons op ${BEDRIJF.telefoon}, dan helpen we je direct.` },
      { status: 503 },
    );
  }

  const nummer = nieuwOffertenummer();
  const datum = new Date();

  let pdf: Uint8Array;
  try {
    pdf = await generateOfferte({
      nummer,
      datum,
      klant: {
        organisatie: data.organisatie,
        naam: data.naam,
        email: data.email,
        telefoon: data.telefoon,
        referentie: data.referentie,
      },
      offerte,
      opmerking: data.opmerking,
    });
  } catch (err) {
    console.error(`[offerte] PDF maken mislukt voor ${data.email}:`, err);
    return NextResponse.json(
      { error: `Het maken van de offerte lukte niet. Probeer het zo nog eens, of bel ${BEDRIJF.telefoon}.` },
      { status: 500 },
    );
  }

  const bijlage = [{ filename: `offerte-${nummer}.pdf`, content: Buffer.from(pdf) }];
  const voornaam = escape(data.naam.split(" ")[0]);
  const totaalRegel = `Totaal ${euro(offerte.totaal)} incl. ${offerte.btwPct}% btw (${euro(
    offerte.subtotaal + offerte.verzending,
  )} excl. btw)`;

  // --- Klantmail: bewust zonder vrije tekst van de bezoeker, behalve de naam.
  const klantHtml = mailLayout({
    titel: "Je offerte",
    ondertitel: `Offerte ${nummer} · geldig ${OFFERTE_GELDIG_DAGEN} dagen`,
    inhoud: [
      alinea(`Beste ${voornaam},`),
      alinea(
        "Bedankt voor je aanvraag. In de bijlage vind je de offerte voor wat je op onze site hebt samengesteld, met dezelfde bedragen als in de winkelmand.",
      ),
      blok(`${regelsHtml(offerte)}<br/><br/><strong>${escape(totaalRegel)}</strong>`),
      offerte.handwerk
        ? alinea("Niet alle regels zijn online te prijzen. Die prijs sturen we je binnen één werkdag.")
        : "",
      alinea(
        `Akkoord? Beantwoord deze mail met offertenummer <strong>${nummer}</strong> en je inkoopnummer als je dat gebruikt. Dan zetten wij de order klaar en sturen we de factuur.`,
      ),
      fijn(`Vragen over de offerte? Bel ${BEDRIJF.telefoon}.`),
    ].join(""),
  });
  const klantTekst = platteTekst([
    `Beste ${data.naam.split(" ")[0]},`,
    "",
    "In de bijlage vind je de offerte voor wat je op onze site hebt samengesteld.",
    "",
    ...offerte.regels.map(
      (r) => `${r.aantal}× ${r.omschrijving} · ${r.totaal === null ? "prijs volgt" : euro(r.totaal)}`,
    ),
    totaalRegel,
    "",
    `Akkoord? Beantwoord deze mail met offertenummer ${nummer}.`,
  ]);

  const klant = await sendMailInhoud(
    data.email,
    { onderwerp: `Offerte ${nummer} · ${offerte.onderwerp}`, html: klantHtml, tekst: klantTekst },
    // Antwoorden van de klant komen bij ons binnen, niet bij de afzender.
    { "Reply-To": serverEnv.contactInbox },
    bijlage,
    OFFERTE_BCC,
  );
  if (!klant.sent) {
    console.error(`[offerte] Klantmail ${nummer} mislukt (${klant.reason}) voor ${data.email}.`);
    return NextResponse.json(
      { error: `Versturen lukte niet. Controleer je e-mailadres of bel ${BEDRIJF.telefoon}.` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, nummer });
}
