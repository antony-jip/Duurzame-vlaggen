/**
 * Contactformulier-backend. Vervangt de oude `mailto:`-stub in `ContactForm`.
 *
 * Valideert server-side (zod), weert bots met een honeypot-veld en stuurt de
 * aanvraag via de bestaande Resend-integratie (`sendMailInhoud`) naar de interne
 * inbox (`ORDER_NOTIFY_EMAIL`, valt terug op het eerste `ADMIN_EMAILS`-adres).
 * Best-effort verzending: faalt de provider, dan krijgt de bezoeker een nette
 * foutmelding i.p.v. een stille `mailto:` die op mobiel niets doet.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { serverEnv } from "@/lib/env";
import { sendMailInhoud } from "@/lib/email/send";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().max(200).refine((v) => EMAIL_RE.test(v)),
  phone: z.string().trim().max(50).optional().default(""),
  company: z.string().trim().max(200).optional().default(""),
  subject: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(1).max(5000),
  // Honeypot — verborgen veld dat mensen leeg laten en bots invullen.
  website: z.string().optional().default(""),
});

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Controleer de ingevulde velden." },
      { status: 400 },
    );
  }
  const { name, email, phone, company, subject, message, website } =
    parsed.data;

  // Honeypot gevuld → doe alsof het gelukt is, verstuur niets.
  if (website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const to = serverEnv.orderNotifyEmail;
  if (!to) {
    console.error(
      "[contact] Geen ORDER_NOTIFY_EMAIL/ADMIN_EMAILS geconfigureerd — bericht niet verstuurd.",
    );
    return NextResponse.json(
      { error: "Contact is tijdelijk niet beschikbaar." },
      { status: 503 },
    );
  }

  const rows: Array<[string, string]> = [
    ["Naam", name],
    ["E-mail", email],
    ["Telefoon", phone],
    ["Bedrijf", company],
    ["Onderwerp", subject],
  ];
  const filled = rows.filter(([, v]) => v.trim() !== "");

  const onderwerp = `Contact via site${subject ? ` · ${subject}` : ""} — ${name}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#212421;line-height:1.55;max-width:560px;">
      <h1 style="color:#2c5f4f;font-size:18px;margin:0 0 16px;">Nieuw contactbericht</h1>
      <table style="border-collapse:collapse;margin:0 0 16px;">
        ${filled
          .map(
            ([k, v]) =>
              `<tr><td style="padding:2px 12px 2px 0;color:#6b6f6b;">${k}</td><td style="padding:2px 0;"><strong>${escapeHtml(v)}</strong></td></tr>`,
          )
          .join("")}
      </table>
      <p style="margin:0 0 6px;color:#6b6f6b;">Bericht:</p>
      <pre style="white-space:pre-wrap;font-family:inherit;margin:0;padding:12px;background:#f3f5f2;border-radius:8px;">${escapeHtml(message)}</pre>
    </div>
  `.trim();
  const tekst = `${filled.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nBericht:\n${message}\n`;

  const result = await sendMailInhoud(to, { onderwerp, html, tekst });
  if (!result.sent) {
    return NextResponse.json(
      { error: "Versturen mislukt. Probeer het later opnieuw of mail ons direct." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
