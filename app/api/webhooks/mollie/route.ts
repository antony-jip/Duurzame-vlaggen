/**
 * Mollie payment webhook (App Router route handler, Next.js 16).
 *
 * Mollie POSTs `application/x-www-form-urlencoded` with a single `id` field when
 * a payment's status changes. The webhook is a mere notification: we re-fetch the
 * payment from Mollie (the source of truth) inside `handleMolliePayment` and mutate
 * the order idempotently.
 *
 * v16 notes:
 * - `runtime = "nodejs"` is required — the payment/order pipeline uses Node APIs.
 * - The raw body can only be consumed once, so we read it with `await request.text()`
 *   (never `.json()`) and parse the urlencoded form ourselves.
 *
 * Responses:
 * - 200 on success, including when the order is unknown (handled silently) so Mollie
 *   stops retrying.
 * - 400 when the body is malformed (missing `id`).
 * - 500 on an unexpected/transient failure so Mollie re-delivers the webhook.
 */
import { handleMolliePayment } from "@/lib/orders/orchestration";
import { parseWebhookBody } from "@/lib/mollie/payments";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();

  let id: string;
  try {
    ({ id } = parseWebhookBody(rawBody));
  } catch {
    // Malformed body (missing/invalid `id`): don't ask Mollie to retry.
    return new Response(null, { status: 400 });
  }

  // Betaallink-object-id in plaats van een betaling: volgens de Mollie-docs
  // stuurt de payment-link-webhook het id van de ONDERLIGGENDE betaling
  // (`tr_…`), maar mocht er toch ooit een `pl_…` binnenkomen, dan is dat geen
  // betaling om op te vragen. 200 teruggeven, anders blijft Mollie herhalen.
  if (id.startsWith("pl_")) {
    console.info(`[mollie-webhook] payment-link-id ${id} genegeerd (geen betaling).`);
    return new Response(null, { status: 200 });
  }

  // Op-rekening-orders: de betaallink-webhook draagt het order-id als
  // queryparameter (de Payment Links API kent geen metadata). De hint wordt in
  // handleMolliePayment geverifieerd, nooit blind vertrouwd.
  const orderIdHint = new URL(request.url).searchParams.get("order");

  try {
    await handleMolliePayment(id, orderIdHint);
  } catch (err) {
    // Transient failure (DB/Mollie down): 500 makes Mollie re-deliver.
    console.error("[mollie-webhook]", err);
    return new Response(null, { status: 500 });
  }

  return new Response(null, { status: 200 });
}
