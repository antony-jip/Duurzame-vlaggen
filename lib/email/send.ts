import "server-only";

import { serverEnv } from "@/lib/env";
import type { OrderRow, OrderItemRow } from "@/lib/db/types";
import { generateMateriaalpaspoort } from "@/lib/materiaalpaspoort/generate";

import { getResendClient } from "./client";
import { bouwMail, type MailSoort } from "./templates";

/**
 * Transactionele e-mails. Alles best-effort: ontbreekt de mailconfig of faalt
 * de provider, dan LOGGEN we en gaan verder — de order-flow mag nooit breken.
 */

/** Resultaat van een verzendpoging. */
export interface SendResult {
  sent: boolean;
  reason?: string;
}

function plainName(order: OrderRow): string {
  const addr = (order.shipping_address ?? {}) as { first_name?: string };
  return addr.first_name?.trim() || "";
}

/**
 * Stuur het materiaalpaspoort als aparte e-mail met PDF-bijlage naar de klant.
 *
 * Idempotentie/dubbel-verzenden voorkomen doet de aanroeper (via
 * `recordEventOnce`); deze functie verstuurt gewoon wat haar gevraagd wordt.
 */
export async function sendMateriaalpaspoortEmail(
  order: OrderRow,
  items: OrderItemRow[],
): Promise<SendResult> {
  const resend = getResendClient();
  if (!resend) {
    console.info(
      `[email] Materiaalpaspoort overgeslagen voor order ${order.order_number}: RESEND_API_KEY ontbreekt.`,
    );
    return { sent: false, reason: "not_configured" };
  }

  try {
    const pdf = await generateMateriaalpaspoort(order, items);
    const greeting = plainName(order) ? `Beste ${plainName(order)},` : "Beste klant,";
    const filename = `materiaalpaspoort-${order.order_number}.pdf`;

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#212421;line-height:1.55;max-width:560px;">
        <h1 style="color:#2c5f4f;font-size:20px;margin:0 0 16px;">Je materiaalpaspoort</h1>
        <p style="margin:0 0 12px;">${greeting}</p>
        <p style="margin:0 0 12px;">
          Bedankt voor je bestelling <strong>${order.order_number}</strong>. Zoals beloofd
          ontvang je bij elke bestelling een <strong>CO2- en materiaalpaspoort</strong>.
        </p>
        <p style="margin:0 0 12px;">
          In de bijgevoegde PDF vind je per product het gebruikte materiaal
          (Flag-CiCLO&reg; biologisch afbreekbaar doek), de duurzaamheidskerncijfers,
          een indicatieve CO2-schatting en een korte CSRD/ESRS-toelichting die je
          voor je eigen duurzaamheidsrapportage kunt gebruiken.
        </p>
        <p style="margin:0 0 12px;color:#6b6f6b;font-size:13px;">
          De cijfers zijn indicatief. Vragen? Mail ons gerust op hello@duurzame-vlaggen.nl.
        </p>
        <p style="margin:16px 0 0;">Met groene groet,<br/>Duurzame Vlaggen</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: serverEnv.mailFrom,
      to: order.email,
      subject: `Je materiaalpaspoort · order ${order.order_number}`,
      html,
      attachments: [
        {
          filename,
          content: Buffer.from(pdf),
        },
      ],
    });

    if (error) {
      console.error(
        `[email] Resend-fout bij materiaalpaspoort voor order ${order.order_number}:`,
        error,
      );
      return { sent: false, reason: "provider_error" };
    }

    console.info(
      `[email] Materiaalpaspoort verstuurd naar ${order.email} voor order ${order.order_number}.`,
    );
    return { sent: true };
  } catch (err) {
    console.error(
      `[email] Onverwachte fout bij materiaalpaspoort voor order ${order.order_number}:`,
      err,
    );
    return { sent: false, reason: "exception" };
  }
}

/**
 * Stuur een klantmail vanuit de order-detailpagina.
 *
 * Anders dan het materiaalpaspoort is dit een EXPLICIETE actie: Antony klikt op
 * verstuur. Daarom geeft deze functie een echte fout terug in plaats van stil te
 * loggen — je wilt weten of je mail is aangekomen.
 */
export async function sendKlantMail(
  order: OrderRow,
  soort: MailSoort,
  bericht = "",
): Promise<SendResult> {
  const resend = getResendClient();
  if (!resend) return { sent: false, reason: "not_configured" };

  const mail = bouwMail(soort, order, bericht);

  try {
    const { error } = await resend.emails.send({
      from: serverEnv.mailFrom,
      to: order.email,
      subject: mail.onderwerp,
      html: mail.html,
      text: mail.tekst,
    });
    if (error) {
      console.error(`[email] Resend-fout bij ${soort} voor ${order.order_number}:`, error);
      return { sent: false, reason: error.message ?? "provider_error" };
    }
    console.info(`[email] ${soort} verstuurd naar ${order.email} (${order.order_number}).`);
    return { sent: true };
  } catch (err) {
    console.error(`[email] Onverwachte fout bij ${soort} voor ${order.order_number}:`, err);
    return { sent: false, reason: err instanceof Error ? err.message : "exception" };
  }
}

/**
 * Generieke best-effort verzending voor de automatische mails (portaal,
 * lifecycle). Faalt stil met log; de aanroepende flow mag er nooit op breken.
 */
export async function sendMailInhoud(
  to: string,
  mail: { onderwerp: string; html: string; tekst: string },
  headers?: Record<string, string>,
  bijlagen?: Array<{ filename: string; content: Buffer }>,
): Promise<SendResult> {
  const resend = getResendClient();
  if (!resend) {
    console.info(`[email] "${mail.onderwerp}" naar ${to} overgeslagen: RESEND_API_KEY ontbreekt.`);
    return { sent: false, reason: "not_configured" };
  }
  try {
    const { error } = await resend.emails.send({
      from: serverEnv.mailFrom,
      to,
      subject: mail.onderwerp,
      html: mail.html,
      text: mail.tekst,
      ...(headers ? { headers } : {}),
      ...(bijlagen && bijlagen.length ? { attachments: bijlagen } : {}),
    });
    if (error) {
      console.error(`[email] Resend-fout bij "${mail.onderwerp}" naar ${to}:`, error);
      return { sent: false, reason: error.message ?? "provider_error" };
    }
    console.info(`[email] "${mail.onderwerp}" verstuurd naar ${to}.`);
    return { sent: true };
  } catch (err) {
    console.error(`[email] Onverwachte fout bij "${mail.onderwerp}" naar ${to}:`, err);
    return { sent: false, reason: err instanceof Error ? err.message : "exception" };
  }
}
