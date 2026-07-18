import "server-only";

import type { Market } from "@/config/domains";
import { publicEnv, serverEnv } from "@/lib/env";
import type { Json, OrderRow } from "@/lib/db/types";

import type { ProboAddress, ProboOptionInput } from "@/lib/catalog/probo-mapping";
import { createPayment, getPayment } from "@/lib/mollie/payments";
import { createPaymentLink } from "@/lib/mollie/payment-links";
import { computeVat } from "@/lib/vat";
import { computeOrderTotals } from "@/lib/pricing";
import { getProduct } from "@/lib/catalog/products";
import {
  getSize,
  localLinePrice,
  localShipping,
  ontwerpserviceVoorOrder,
} from "@/lib/pricing/local-catalog";

import { randomBytes } from "node:crypto";

import {
  advanceOrderStatus,
  countPendingDesigns,
  getOrderById,
  getOrderByMolliePaymentId,
  getOrderItems,
  insertOrderWithItems,
  recordEventOnce,
} from "@/lib/orders/repository";
import { sendMateriaalpaspoortEmail, sendMailInhoud } from "@/lib/email/send";
import { factuurMail } from "@/lib/email/templates";
import { ontwerpenAanleveren } from "@/lib/email/templates";
import { generateFactuur } from "@/lib/factuur/generate";

/**
 * Order orchestration — de ruggengraat die Mollie, btw en prijzen aan het
 * datamodel en de state-machine knoopt.
 *
 * Flow:
 *   buildLocalQuote      regelprijzen uit het lokale prijsmodel, btw + totalen
 *   placeOrder           order wegschrijven, Mollie-payment → checkout-URL;
 *                        of, op rekening: Mollie-betaallink + factuurmail →
 *                        orderbevestiging (betalen kan daarna via de link)
 *   handleMolliePayment  (webhook) betaald → order op `paid` voor handmatige
 *                        afhandeling in de admin; mislukt → als failed markeren
 *                        (behalve bij een betaallink: die blijft geldig)
 *
 * Bestellen bij Probo gebeurt met de hand via hun portaal. De API-koppeling is
 * verwijderd (2026-07-15); wat een bestelling nodig heeft staat op
 * `order_items.configuration` (zie lib/catalog/probo-mapping).
 *
 * Bedragen zijn ex btw, `numeric(12,2)`.
 */

/** Geldigheid van de aanleverportaal-link (bearer-token op de order). */
export const PORTAL_TTL_DAYS = 90;

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/**
 * Eén design-toewijzing op een orderregel: een bestand (of een openstaand
 * "later aanleveren"-slot wanneer `fileUrl` null is) dat `quantity` vlaggen
 * van de regel dekt. De aantallen van een regel tellen exact op tot `amount`;
 * de checkout-action valideert dat vóór placeOrder.
 */
export interface DesignDraft {
  quantity: number;
  fileUrl: string | null;
}

export interface OrderItemDraft {
  /** Probo-productcode (bijv. "flag-ciclo") — voor de inkoop met de hand. */
  proboProductCode: string;
  /** Our own product category label (e.g. "baniervlag"). */
  productType: string;
  /** Localized product name snapshot. */
  productName?: string;
  /** Probo option selections, including the quantity (`amount`) option. */
  options: ProboOptionInput[];
  /** Quantity, mirrored from the Probo `amount` option, for our records. */
  amount: number;
  /**
   * Menselijk maatlabel uit de catalogus (bijv. "250 × 100 cm"). Gebruikt door
   * de lokale prijsberekening (`buildLocalQuote`) om de juiste `CatalogSize` te
   * vinden. Niet naar Probo gestuurd.
   */
  sizeLabel?: string;
  /**
   * Afmetingen in cm. Nodig voor een EIGEN maat: die heet "Eigen: 245 × 130 cm"
   * en staat dus niet in `product.sizes`, waardoor `getSize` niets vindt en de
   * prijs zonder deze velden terugvalt op `priceFrom`.
   */
  widthCm?: number;
  heightCm?: number;
  /**
   * Human-readable storefront selections (Dutch labels → chosen value), stored
   * on the order line for the admin. NOT sent to Probo — `options` is.
   */
  selections?: Record<string, string>;
  /**
   * Storefront choices that have no Probo equivalent (e.g. "Ontwerpservice").
   * Kept on the order line so staff can handle them manually.
   */
  unmapped?: Array<{ label: string; value: string }>;
  /**
   * Publieke URL van het aangeleverde ontwerp (order-artwork bucket).
   * Null/undefined voor offerte-only regels.
   * @deprecated Nieuwe aanroepers geven `designs` mee; dit veld blijft werken
   * als één toewijzing die de hele regel dekt.
   */
  fileUrl?: string | null;
  /** Design-toewijzingen voor deze regel (zie {@link DesignDraft}). */
  designs?: DesignDraft[];
  /** Opslag %; in de handmatige flow altijd 0 (basePrice == linePrice). */
  markupPct?: number;
}

export interface CheckoutInput {
  market: Market;
  email: string;
  phone?: string;
  isBusiness?: boolean;
  vatNumber?: string | null;
  customerId?: string | null;
  billingAddress?: ProboAddress;
  /** Ship-to address — drives Probo delivery pricing and the VAT country. */
  shippingAddress: ProboAddress;
  items: OrderItemDraft[];
  /**
   * "op_rekening": betalen op rekening (alleen met ingevulde bedrijfsnaam; de
   * action valideert dat). De order krijgt een Mollie-betaallink en wij mailen
   * direct de factuur (PDF + betaallink); de webhook zet de order op betaald
   * zodra het geld binnen is. Tot die tijd blijft hij op `awaiting_payment`
   * staan: productie start pas ná betaling, net als bij een gewone betaling.
   * Afwezig = gewone Mollie-checkout (iDEAL enz.).
   */
  paymentMethod?: "op_rekening";
}

// ---------------------------------------------------------------------------
// Quote
// ---------------------------------------------------------------------------

export interface QuoteLine {
  draft: OrderItemDraft;
  /** Probo `calculation_id` (audit; the order re-sends code+options). */
  calculationId: string;
  /** Probo purchase price for the line (our cost, ex-VAT). */
  basePrice: number;
  markupPct: number;
  /** Sell price = basePrice marked up. */
  linePrice: number;
}

export interface Quote {
  currency: string;
  lines: QuoteLine[];
  /** Eenmalige ontwerpservice (ex btw); 0 wanneer niet gekozen. */
  designService: number;
  shippingPrice: number;
  packagingPrice: number;
  vat: Awaited<ReturnType<typeof computeVat>>;
  totals: ReturnType<typeof computeOrderTotals>;
}

/**
 * Bouwt de quote voor een bestelling: regelprijzen, btw en totalen.
 *
 * Rekent volledig met het lokale prijsmodel (`@/lib/pricing/local-catalog`):
 *
 *  - regelprijs via `localLinePrice` (product uit `getProduct`, maat uit `getSize`),
 *  - verzendkosten via `localShipping(subtotaal)`, packaging altijd 0,
 *  - geen inkoopprijs en geen markup (basePrice == linePrice, markupPct 0),
 *    want er is geen live inkoopcalculatie: `calculationId` blijft leeg.
 */
export async function buildLocalQuote(input: CheckoutInput): Promise<Quote> {
  if (input.items.length === 0) {
    throw new Error("buildLocalQuote: no items");
  }

  const lines: QuoteLine[] = [];
  for (const draft of input.items) {
    const product = getProduct(draft.productType);
    if (!product) {
      throw new Error(`buildLocalQuote: onbekend product ${draft.productType}`);
    }
    const size = draft.sizeLabel ? getSize(product, draft.sizeLabel) : undefined;

    // localLinePrice vouwt het aantal al in de regelprijs (× amount). De
    // afmetingen gaan mee zodat een eigen maat per m² rekent i.p.v. terug te
    // vallen op priceFrom.
    const linePrice = localLinePrice({
      product,
      size,
      widthCm: draft.widthCm,
      heightCm: draft.heightCm,
      amount: draft.amount,
      selections: draft.selections,
    });

    lines.push({
      draft,
      // Geen Probo-calculatie in manual-modus.
      calculationId: "",
      // Geen aparte inkoopprijs lokaal → basePrice gelijk aan verkoopprijs.
      basePrice: linePrice,
      markupPct: 0,
      linePrice,
    });
  }

  // Subtotaal ex btw (afgerond op centen) → drijft de eigen verzendregel.
  const subtotaal = Math.round(lines.reduce((sum, l) => sum + l.linePrice, 0) * 100) / 100;
  const shippingPrice = localShipping(subtotaal);
  const packagingPrice = 0;

  const vat = await computeVat({
    isBusiness: Boolean(input.isBusiness),
    vatNumber: input.vatNumber ?? null,
    market: input.market,
    shippingCountry: input.shippingAddress.country ?? null,
  });

  // Eenmalig per order zodra één regel de ontwerpservice heeft. Werd de klant
  // wél getoond in de configurator, maar zat niet in `unitPriceEstimate` en dus
  // in geen enkel totaal: €85 die nooit gefactureerd werd.
  const designService = ontwerpserviceVoorOrder(
    lines.map((l) => ({ selections: l.draft.selections })),
  );

  const totals = computeOrderTotals({
    lines: [
      // linePrice is al de regeltotaal (aantal ingevouwen) → amount 1.
      ...lines.map((l) => ({ unitPrice: l.linePrice, amount: 1 })),
      ...(designService > 0 ? [{ unitPrice: designService, amount: 1 }] : []),
    ],
    shippingPrice,
    packagingPrice,
    vatRatePct: vat.rate,
  });

  return {
    currency: "EUR",
    lines,
    designService,
    shippingPrice,
    packagingPrice,
    vat,
    totals,
  };
}

/**
 * De design-toewijzingen van een regel, met legacy-terugval: aanroepers zonder
 * `designs` krijgen één toewijzing die de volledige quantity dekt (openstaand
 * wanneer er ook geen `fileUrl` is).
 */
function designDraftsFor(draft: OrderItemDraft): DesignDraft[] {
  if (draft.designs && draft.designs.length > 0) return draft.designs;
  return [{ quantity: draft.amount, fileUrl: draft.fileUrl ?? null }];
}

/** Eerste ontwerp mét bestand — wat order_items.file_url blijft dragen. */
function primaryFileUrl(draft: OrderItemDraft): string | null {
  return designDraftsFor(draft).find((d) => d.fileUrl)?.fileUrl ?? null;
}

/** Storage-key uit een publieke order-artwork-URL (`${uuid}-${naam}`). */
function artworkPathFromUrl(url: string): string | null {
  const marker = "/order-artwork/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = decodeURIComponent(url.slice(idx + marker.length));
  return path || null;
}

/** Weergavenaam: de storage-key zonder het 36-tekens-UUID-voorvoegsel. */
function artworkNameFromUrl(url: string): string | null {
  const path = artworkPathFromUrl(url);
  if (!path) return null;
  return path.slice(37) || path;
}

// ---------------------------------------------------------------------------
// Place order + create payment
// ---------------------------------------------------------------------------

export interface PlaceOrderResult {
  order: OrderRow;
  quote: Quote;
  /** Mollie hosted-checkout URL to redirect the customer to. */
  checkoutUrl: string | null;
}

/**
 * Persist a new order + items (status `cart`), create a Mollie payment (of, op
 * rekening: een Mollie-betaallink plus directe factuurmail), and move the
 * order to `awaiting_payment`. Returns the checkout URL for redirect.
 */
export async function placeOrder(input: CheckoutInput): Promise<PlaceOrderResult> {
  const quote = await buildLocalQuote(input);

  // Raak de config aan vóór de eerste schrijfactie. Beide getters throwen als de
  // variabele ontbreekt, en dat gebeurde eerder pas bij `createPayment` — dus ná
  // de insert. Resultaat: een weesorder op `cart` zonder betaling, bij élke
  // poging, terwijl de klant "er is iets misgegaan" zag. Ontbreekt er iets, dan
  // klapt het nu voordat er een rij bestaat.
  const appUrl = publicEnv.appUrl;
  void serverEnv.mollieApiKey;

  const order = await insertOrderWithItems(
    {
      market: input.market,
      currency: quote.currency,
      customer_id: input.customerId ?? null,
      email: input.email,
      phone: input.phone ?? null,
      status: "cart",
      billing_address: (input.billingAddress ?? null) as Json | null,
      shipping_address: input.shippingAddress as unknown as Json,
      is_business: Boolean(input.isBusiness),
      vat_number: input.vatNumber ?? null,
      vat_number_valid: quote.vat.vatNumberValid,
      vat_validated_at: quote.vat.vatNumberValid !== null ? new Date().toISOString() : null,
      reverse_charge: quote.vat.reverseCharge,
      vat_rate: quote.vat.rate,
      subtotal_ex_vat: quote.totals.subtotalExVat,
      shipping_cost: quote.totals.shippingCost,
      vat_amount: quote.totals.vatAmount,
      total: quote.totals.total,
      // Bearer-credentials: het no-login aanleverportaal (verloopt) en de
      // herbestel-link in de lifecycle-mails (langlopend).
      portal_token: randomBytes(32).toString("base64url"),
      portal_expires_at: new Date(
        Date.now() + PORTAL_TTL_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString(),
      reorder_token: randomBytes(32).toString("base64url"),
    },
    quote.lines.map((l) => ({
      probo_product_code: l.draft.proboProductCode,
      product_type: l.draft.productType,
      product_name: l.draft.productName ?? null,
      configuration: {
        code: l.draft.proboProductCode,
        options: l.draft.options,
        // Menselijk maatlabel — nodig om de regel later te herbestellen in het
        // klantportaal (reconstructie van maat/afmetingen/prijs).
        ...(l.draft.sizeLabel ? { sizeLabel: l.draft.sizeLabel } : {}),
        // Human-readable choices + any non-mappable selections, for the admin.
        ...(l.draft.selections ? { selections: l.draft.selections } : {}),
        ...(l.draft.unmapped && l.draft.unmapped.length
          ? { unmapped: l.draft.unmapped }
          : {}),
      } as unknown as Json,
      amount: l.draft.amount,
      // Manual-modus heeft geen Probo-calculatie → leeg wordt null.
      calculation_id: l.calculationId || null,
      // Compat: account/herbestellen/admin tonen het (eerste) ontwerp via deze
      // kolom; de designtabel is de volledige bron (welk bestand × hoeveel).
      file_url: primaryFileUrl(l.draft),
      base_price: l.basePrice,
      markup_pct: l.markupPct,
      line_price: l.linePrice,
      designs: designDraftsFor(l.draft).map((d) => ({
        quantity: d.quantity,
        file_url: d.fileUrl,
        file_path: d.fileUrl ? artworkPathFromUrl(d.fileUrl) : null,
        file_name: d.fileUrl ? artworkNameFromUrl(d.fileUrl) : null,
        uploaded_at: d.fileUrl ? new Date().toISOString() : null,
      })),
    })),
  );

  // Mollie weigert een webhook-URL die het niet kan bereiken (HTTP 422), dus
  // op localhost maken we de betaling zónder webhook aan. De status wordt dan
  // handmatig gereconcilieerd ("Ververs betaling" in de admin); in productie
  // draait de webhook gewoon.
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(appUrl);

  // Op rekening: geen gewone betaling maar een Mollie-betaallink (Payment
  // Links API) — geen korte vervaltijd, en de klant kiest op de Mollie-pagina
  // zelf de methode (iDEAL, kaart, overboeking). De Payment Links API kent
  // geen `metadata`, dus het order-id reist mee als queryparameter op de
  // webhook-URL; handleMolliePayment verifieert die hint (link-order + exact
  // bedrag) voordat hij hem vertrouwt. De order blijft op `awaiting_payment`
  // staan tot de webhook de betaling meldt: productie start pas ná betaling.
  if (input.paymentMethod === "op_rekening") {
    const link = await createPaymentLink({
      amount: quote.totals.total,
      currency: quote.currency,
      description: `Duurzame-Vlaggen ${order.order_number}`,
      redirectUrl: `${appUrl}/order/${order.id}`,
      ...(isLocalhost
        ? {}
        : { webhookUrl: `${appUrl}/api/webhooks/mollie?order=${order.id}` }),
    });

    const updated = await advanceOrderStatus(order.id, "awaiting_payment", {
      mollie_payment_link_id: link.id,
      mollie_payment_link_url: link.url,
    });

    await recordEventOnce({
      orderId: order.id,
      source: "mollie",
      eventType: "payment_link.created",
      externalId: link.id,
      data: { url: link.url },
    });

    await sendFactuurOnce(updated, quote, link.url);

    // De klant landt op de orderbevestiging; de betaallink zit in de factuur.
    return { order: updated, quote, checkoutUrl: `${appUrl}/order/${order.id}` };
  }

  const payment = await createPayment({
    amount: quote.totals.total,
    currency: quote.currency,
    description: `Duurzame-Vlaggen ${order.order_number}`,
    redirectUrl: `${appUrl}/order/${order.id}`,
    ...(isLocalhost ? {} : { webhookUrl: `${appUrl}/api/webhooks/mollie` }),
    metadata: { orderId: order.id, orderNumber: order.order_number },
  });

  const updated = await advanceOrderStatus(order.id, "awaiting_payment", {
    mollie_payment_id: payment.id,
    mollie_status: payment.status,
  });

  await recordEventOnce({
    orderId: order.id,
    source: "mollie",
    eventType: "payment.created",
    externalId: payment.id,
    data: { status: payment.status },
  });

  return { order: updated, quote, checkoutUrl: payment.checkoutUrl };
}

/**
 * Mail de factuur voor een op-rekening-order: de factuur-PDF (lib/factuur) als
 * bijlage, met de betaallink in de mail. Exact één keer per order (idempotent
 * via `recordEventOnce`) en volledig best-effort — een mailstoring mag de
 * bestelling nooit blokkeren; de admin ziet de order gewoon op
 * `awaiting_payment` staan.
 */
async function sendFactuurOnce(
  order: OrderRow,
  quote: Quote,
  betaallink: string | null,
): Promise<void> {
  try {
    const event = await recordEventOnce({
      orderId: order.id,
      source: "system",
      eventType: "factuur.sent",
      externalId: `factuur-${order.id}`,
      data: { betaallink },
    });
    if (!event.inserted) return;

    const regels = [
      ...quote.lines.map((l) => ({
        omschrijving: `${l.draft.amount}× ${
          l.draft.productName ?? l.draft.productType
        }${l.draft.sizeLabel ? ` (${l.draft.sizeLabel})` : ""}`,
        bedragExVat: l.linePrice,
      })),
      ...(quote.designService > 0
        ? [{ omschrijving: "Ontwerpservice", bedragExVat: quote.designService }]
        : []),
    ];
    const mail = factuurMail({
      order,
      regels,
      betaallink,
      vervaldatum: betaaltermijnVervaldatum(order),
    });

    // De factuur-PDF uit lib/factuur als bijlage: hetzelfde document dat de
    // klant later in /account kan downloaden, met "te voldoen"-instructie
    // zolang er niet betaald is.
    let bijlagen: Array<{ filename: string; content: Buffer }> | undefined;
    try {
      const items = await getOrderItems(order.id);
      const pdf = await generateFactuur(order, items);
      bijlagen = [
        { filename: `factuur-${order.order_number}.pdf`, content: Buffer.from(pdf) },
      ];
    } catch (err) {
      // Zonder PDF is de mail nog steeds een geldige factuur (alle wettelijke
      // velden staan in de tekst); log en verstuur zonder bijlage.
      console.error(
        `[checkout] factuur-PDF voor ${order.order_number} mislukt:`,
        err,
      );
    }

    await sendMailInhoud(order.email, mail, undefined, bijlagen);
  } catch (err) {
    console.error(
      `[checkout] factuurmail voor ${order.order_number} mislukt: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

/** Betaaltermijn op rekening: 14 dagen na plaatsing, als NL-datumtekst. */
export const BETAALTERMIJN_DAGEN = 14;

export function betaaltermijnVervaldatum(order: OrderRow): string {
  const basis = Date.parse(order.created_at) || Date.now();
  return new Date(basis + BETAALTERMIJN_DAGEN * 24 * 60 * 60 * 1000).toLocaleDateString(
    "nl-NL",
    { day: "numeric", month: "long", year: "numeric" },
  );
}

// ---------------------------------------------------------------------------
// Mollie webhook → payment status
// ---------------------------------------------------------------------------

/**
 * Handle a Mollie payment status change (called from the webhook after
 * re-fetching the payment — never trust the webhook body). Idempotent.
 *
 * paid → mark order paid, then submit the Probo order.
 * failed/canceled/expired → mark payment_failed.
 *
 * `orderIdHint`: bij op-rekening-orders bestaat de betaling (`tr_…`) pas op
 * het moment dat de klant de betaallink gebruikt, dus staat er nog geen
 * `mollie_payment_id` op de order en mist de directe lookup. De Payment Links
 * API kent geen metadata; daarom hangt `placeOrder` het order-id als
 * queryparameter aan de webhook-URL. Die hint wordt hier NIET blind vertrouwd:
 * hij telt alleen voor een order mét betaallink en alleen als het betaalde
 * bedrag exact het ordertotaal is.
 */
export async function handleMolliePayment(
  paymentId: string,
  orderIdHint?: string | null,
): Promise<void> {
  const payment = await getPayment(paymentId);
  let order = await getOrderByMolliePaymentId(paymentId);
  let viaBetaallink = false;

  if (!order && orderIdHint) {
    const kandidaat = await getOrderById(orderIdHint);
    if (
      kandidaat?.mollie_payment_link_id &&
      payment.currency === kandidaat.currency &&
      payment.amountValue === (kandidaat.total ?? 0).toFixed(2)
    ) {
      order = kandidaat;
      viaBetaallink = true;
    }
  }

  if (!order) {
    // Unknown payment — log-and-ignore (could be a stale/foreign webhook).
    return;
  }

  const event = await recordEventOnce({
    orderId: order.id,
    source: "mollie",
    eventType: `payment.${payment.status}`,
    externalId: paymentId,
    data: { status: payment.status },
  });
  // Already processed this exact event → nothing to do.
  if (!event.inserted) return;

  if (payment.status === "paid") {
    if (order.status === "awaiting_payment") {
      await advanceOrderStatus(order.id, "paid", {
        mollie_status: payment.status,
        // Op rekening: de order kende tot nu alleen de betaallink; leg de
        // betaling die hem voldeed alsnog vast.
        ...(viaBetaallink ? { mollie_payment_id: payment.id } : {}),
      });
    }

    // "Later aanleveren": mist er nog een ontwerp, dan parkeert de order op
    // awaiting_files en krijgt de klant zijn portaallink per mail. Er is geen
    // automatische vervolgstap — bestellen bij Probo gaat met de hand zodra
    // alles binnen is (Markeer besteld, geblokkeerd zolang er iets mist).
    const pending = await countPendingDesigns(order.id);
    if (pending > 0) {
      const current = await getOrderById(order.id);
      if (current?.status === "paid") {
        await advanceOrderStatus(order.id, "awaiting_files");
      }
      await sendOntwerpenAanleverenOnce(order.id, pending);
    }

    // Kernbelofte: elke betaalde bestelling krijgt een materiaalpaspoort per
    // aparte e-mail. Best-effort en idempotent — faalt stil met log, en mag de
    // betaalflow nooit blokkeren.
    await sendMateriaalpaspoortOnce(order.id);
    // Verder blijft de order staan (paid of awaiting_files): inkoop en
    // verzending gaan met de hand, vanuit de admin.
    return;
  }

  if (["failed", "canceled", "expired"].includes(payment.status)) {
    // Op rekening: een mislukte of afgebroken poging op de betaallink is
    // normaal (de link blijft geldig, de klant probeert het later gewoon
    // opnieuw). De order blijft dan op `awaiting_payment` wachten; alleen een
    // gewone checkout-betaling markeert de order als payment_failed.
    if (!viaBetaallink && order.status === "awaiting_payment") {
      await advanceOrderStatus(order.id, "payment_failed", { mollie_status: payment.status });
    }
  }
}

// ---------------------------------------------------------------------------
// Materiaalpaspoort-mail (best-effort, idempotent)
// ---------------------------------------------------------------------------

/**
 * Verstuur het materiaalpaspoort exact één keer per order. Idempotent via
 * `recordEventOnce` (source `system`), zodat een dubbele Mollie-webhook niet
 * twee mails oplevert. Volledig best-effort: elke fout wordt gelogd en
 * ingeslikt — de betaal-/Probo-flow mag hier nooit op stuklopen.
 */
export async function sendMateriaalpaspoortOnce(orderId: string): Promise<void> {
  try {
    // Claim het event vóór verzenden → geen dubbele mail bij herhaalde webhook.
    const event = await recordEventOnce({
      orderId,
      source: "system",
      eventType: "materiaalpaspoort.sent",
    });
    if (!event.inserted) return;

    const order = await getOrderById(orderId);
    if (!order) return;
    const items = await getOrderItems(orderId);
    await sendMateriaalpaspoortEmail(order, items);
  } catch (err) {
    console.error(
      `[materiaalpaspoort] Verzenden mislukt voor order ${orderId}:`,
      err,
    );
  }
}

// ---------------------------------------------------------------------------
// Aanleverportaal-mail (best-effort, idempotent)
// ---------------------------------------------------------------------------

/**
 * Mail de klant zijn persoonlijke uploadlink, exact één keer per order.
 * Idempotent via `recordEventOnce`; best-effort zoals de paspoort-mail.
 */
export async function sendOntwerpenAanleverenOnce(
  orderId: string,
  pending: number,
): Promise<void> {
  try {
    const event = await recordEventOnce({
      orderId,
      source: "system",
      eventType: "portal.link_sent",
    });
    if (!event.inserted) return;

    const order = await getOrderById(orderId);
    if (!order?.portal_token) return;

    const mail = ontwerpenAanleveren(
      order,
      pending,
      `${publicEnv.appUrl}/aanleveren/${order.portal_token}`,
      PORTAL_TTL_DAYS,
    );
    await sendMailInhoud(order.email, mail);
  } catch (err) {
    console.error(`[portal] aanlevermail mislukt voor order ${orderId}:`, err);
  }
}

// ---------------------------------------------------------------------------
// Submit to Probo
// ---------------------------------------------------------------------------
