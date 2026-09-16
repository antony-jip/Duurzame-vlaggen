/**
 * Mollie-webhook voor offerte-betaallinks: meldt Antony zodra er betaald is.
 *
 * Mollie POST een `id` (de onderliggende betaling, `tr_…`) bij elke
 * statuswijziging. Webhooks zijn ongetekend, dus we vertrouwen de body niet:
 * we halen de betaling op bij Mollie en melden alleen als die echt `paid` is en
 * de omschrijving het offertenummer uit de URL bevat.
 *
 * Offertes staan niet in een database, dus dubbele meldingen bij een herhaalde
 * webhook voor dezelfde betaalde betaling zijn mogelijk (zeldzaam). Altijd 200,
 * behalve bij een tijdelijke fout bij Mollie: dan 500 zodat Mollie opnieuw
 * probeert.
 */

import { BEDRIJF } from "@/lib/bedrijf";
import { sendMailInhoud } from "@/lib/email/send";
import { getPayment, parseWebhookBody } from "@/lib/mollie/payments";
import { OFFERTE_MELDING_AAN } from "@/lib/offerte/adressen";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  let id: string;
  try {
    ({ id } = parseWebhookBody(rawBody));
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!id.startsWith("tr_")) return new Response(null, { status: 200 });

  const nummer = new URL(request.url).searchParams.get("n") ?? "";
  if (!/^OF-\d{6}-[A-Z2-9]{4}$/.test(nummer)) return new Response(null, { status: 200 });

  let betaling: Awaited<ReturnType<typeof getPayment>>;
  try {
    betaling = await getPayment(id);
  } catch (err) {
    console.error(`[offerte-webhook] Betaling ${id} ophalen mislukt:`, err);
    return new Response(null, { status: 500 });
  }

  const omschrijving = (betaling.raw as { description?: string }).description ?? "";
  if (betaling.status !== "paid" || !omschrijving.includes(nummer)) {
    return new Response(null, { status: 200 });
  }

  const bedrag = `€ ${betaling.amountValue.replace(".", ",")}`;
  const result = await sendMailInhoud(OFFERTE_MELDING_AAN, {
    onderwerp: `Betaald: offerte ${nummer} · ${bedrag}`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#212421;line-height:1.55;">
      <h1 style="color:#2c5f4f;font-size:20px;margin:0 0 12px;">Offerte ${nummer} is betaald</h1>
      <p>${bedrag} ontvangen via Mollie (${BEDRIJF.handelsnaam}), betaling ${id}.</p>
      <p>Zet de order klaar en vraag het ontwerp op als dat nog niet binnen is.</p>
    </div>`,
    tekst: `Offerte ${nummer} is betaald: ${bedrag} via Mollie, betaling ${id}.`,
  });
  if (!result.sent) {
    console.error(`[offerte-webhook] Betaalmelding ${nummer} mislukt (${result.reason}).`);
  }
  return new Response(null, { status: 200 });
}
