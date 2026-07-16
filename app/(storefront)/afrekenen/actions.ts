"use server";

/**
 * Checkout server action.
 *
 * The cart lives in the browser (localStorage), so the client checkout form
 * serialises its lines into a hidden `items` field; this action rebuilds a
 * `CheckoutInput` from the form + those lines.
 *
 * Two outcomes:
 *  - Any quote-only line (`proboProductCode === null`) → we skip `placeOrder`
 *    entirely and return a "quote requested" notice (the product is not yet
 *    orderable online).
 *  - All lines orderable → `placeOrder` creates the order + Mollie payment and
 *    we `redirect` to the hosted checkout URL.
 */

import { redirect } from "next/navigation";
import type { CheckoutState } from "./checkout-state";
import { HttpError } from "@/lib/http";
import { getMessages } from "@/lib/i18n";
import {
  placeOrder,
  type CheckoutInput,
  type DesignDraft,
  type OrderItemDraft,
} from "@/lib/orders/orchestration";
import { suppressEmail } from "@/lib/orders/repository";
import type { ProboAddress } from "@/lib/catalog/probo-mapping";
import type { CheckoutLine } from "@/components/cart/types";
import { getProduct } from "@/lib/catalog/products";
import { buildProboOptions } from "@/lib/catalog/probo-mapping";
import { publicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateCustomerId } from "@/lib/orders/customer";

/**
 * The `items` payload is client-supplied (localStorage → hidden field), so a
 * tampered `fileUrl` could point Probo at any URL. Only accept URLs that live
 * in our own public artwork bucket; anything else is dropped to null.
 */
const ARTWORK_PREFIX = `${publicEnv.supabaseUrl}/storage/v1/object/public/order-artwork/`;

function safeFileUrl(url: string | null | undefined): string | null {
  return typeof url === "string" && url.startsWith(ARTWORK_PREFIX) ? url : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Address field names, without the `billing_`/`shipping_` prefix. */
const ADDRESS_FIELDS = [
  "first_name",
  "last_name",
  "street",
  "house_number",
  "postal_code",
  "city",
  "country",
] as const;

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Alles wat de klant intikte, terug te geven aan het formulier zodat React het
 * bij een fout niet wist (zie `CheckoutState.values`). `items` blijft eruit: dat
 * is de winkelmand-payload, geen invoerveld, en die staat toch al in de state
 * van de client.
 */
function echoValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "items") continue;
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

function readAddress(formData: FormData, prefix: string): ProboAddress {
  return {
    company_name: str(formData, `${prefix}company_name`) || undefined,
    first_name: str(formData, `${prefix}first_name`) || undefined,
    last_name: str(formData, `${prefix}last_name`) || undefined,
    street: str(formData, `${prefix}street`) || undefined,
    house_number: str(formData, `${prefix}house_number`) || undefined,
    addition: str(formData, `${prefix}addition`) || undefined,
    postal_code: str(formData, `${prefix}postal_code`) || undefined,
    city: str(formData, `${prefix}city`) || undefined,
    country: str(formData, `${prefix}country`) || undefined,
  };
}

/**
 * Resolve a cart line's flag dimensions (cm) — prefer the stored fields, fall
 * back to parsing the human `sizeLabel` (e.g. "250 × 100 cm") for older carts.
 */
function resolveSize(
  item: CheckoutLine,
): { widthCm: number; heightCm: number } | null {
  if (item.widthCm && item.heightCm) {
    return { widthCm: item.widthCm, heightCm: item.heightCm };
  }
  const m = /(\d+)\s*[×x]\s*(\d+)\s*cm/i.exec(item.sizeLabel);
  if (m) return { widthCm: Number(m[1]), heightCm: Number(m[2]) };
  return null;
}

/** Storefront selections (label → value) from a cart line, minus the size row. */
function selectionsOf(item: CheckoutLine): Record<string, string> {
  const out: Record<string, string> = {};
  for (const o of item.options) {
    if (o.code === "Formaat") continue;
    out[o.code] = String(o.value ?? "");
  }
  return out;
}

function parseItems(raw: string): CheckoutLine[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as CheckoutLine[];
  } catch {
    return [];
  }
}

/**
 * Valideer de design-toewijzingen van een regel en maak er drafts van. De
 * payload komt uit de client, dus alles wordt hier opnieuw gecheckt: gehele
 * aantallen van minstens 1, de som EXACT gelijk aan het bestelde aantal, en
 * bestands-URL's beperkt tot onze eigen artwork-bucket. Een design zonder
 * (geldige) URL is een openstaande "later aanleveren"-toewijzing.
 *
 * Terugval voor oude tabbladen: een payload zonder `designs` maar mét het oude
 * losse `fileUrl`-veld wordt behandeld als één toewijzing over de hele regel.
 */
function buildDesignDrafts(item: CheckoutLine): DesignDraft[] | null {
  // Hardware (vlaggenmast) heeft geen drukbestand: geen toewijzingen vereist.
  if (getProduct(item.slug)?.category === "hardware") return [];

  const legacy = (item as { fileUrl?: string | null }).fileUrl;
  const designs =
    Array.isArray(item.designs) && item.designs.length > 0
      ? item.designs
      : [{ quantity: item.amount, fileUrl: legacy ?? null }];

  let sum = 0;
  const drafts: DesignDraft[] = [];
  for (const d of designs) {
    if (!Number.isInteger(d.quantity) || d.quantity < 1) return null;
    sum += d.quantity;
    drafts.push({ quantity: d.quantity, fileUrl: safeFileUrl(d.fileUrl) });
  }
  if (sum !== item.amount) return null;
  return drafts;
}

export async function checkoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const { market, dict } = await getMessages();
  const v = dict.checkout.validation;
  const fieldErrors: Record<string, string> = {};

  const items = parseItems(str(formData, "items"));
  if (items.length === 0) {
    return {
      status: "error",
      message: dict.errors.cartEmpty,
      values: echoValues(formData),
    };
  }

  // --- Contact ---
  const email = str(formData, "email");
  if (!email) fieldErrors.email = v.required;
  else if (!EMAIL_RE.test(email)) fieldErrors.email = v.emailInvalid;

  const phone = str(formData, "phone");
  const isBusiness = formData.get("isBusiness") != null;
  const vatNumber = str(formData, "vatNumber");
  if (isBusiness && !vatNumber) fieldErrors.vatNumber = v.required;

  // --- Shipping address (required) ---
  for (const field of ADDRESS_FIELDS) {
    if (!str(formData, `shipping_${field}`)) {
      fieldErrors[`shipping_${field}`] = v.required;
    }
  }
  if (isBusiness && !str(formData, "shipping_company_name")) {
    fieldErrors.shipping_company_name = v.required;
  }

  // --- Billing address (only when different from shipping) ---
  const sameAsBilling = formData.get("sameAsBilling") != null;
  if (!sameAsBilling) {
    for (const field of ADDRESS_FIELDS) {
      if (!str(formData, `billing_${field}`)) {
        fieldErrors[`billing_${field}`] = v.required;
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      fieldErrors,
      message: dict.errors.generic,
      values: echoValues(formData),
    };
  }

  const shippingAddress = readAddress(formData, "shipping_");
  const billingAddress = sameAsBilling
    ? shippingAddress
    : readAddress(formData, "billing_");

  // Quote-only guard: any line without a Probo code cannot be ordered online.
  const quoteOnly = items.some((it) => it.proboProductCode === null);
  if (quoteOnly) {
    return {
      status: "quote",
      message:
        "Bedankt! Eén of meer producten in je winkelmand zijn nog niet online bestelbaar. We hebben je gegevens ontvangen en sturen je zo snel mogelijk een persoonlijke offerte.",
    };
  }

  // All lines orderable → translate each storefront selection into a valid Probo
  // options array (codes, not Dutch labels). The human-readable selections and
  // any non-mappable choices ride along on the order line for the admin.
  const draftItems: OrderItemDraft[] = [];
  for (const it of items) {
    const size = resolveSize(it);
    const selections = selectionsOf(it);
    const mapped = size
      ? buildProboOptions(it.slug, {
          widthCm: size.widthCm,
          heightCm: size.heightCm,
          amount: it.amount,
          selections,
        })
      : null;
    if (!mapped) {
      // A product marked orderable in the cart but without a usable mapping/size
      // is a data error — never send raw Dutch labels to Probo.
      return {
        status: "error",
        message: dict.errors.generic,
        values: echoValues(formData),
      };
    }
    // Afrekenen kan pas als de toewijzingen van elke regel exact optellen tot
    // het aantal (uploads of "later aanleveren").
    const designs = buildDesignDrafts(it);
    if (!designs) {
      return {
        status: "error",
        message: dict.errors.designsIncomplete,
        values: echoValues(formData),
      };
    }
    draftItems.push({
      // The mapping decides the effective code (a Squareflag size routes to
      // `beachflag-square` while the cart carries the catalogue default).
      proboProductCode: mapped.productCode,
      productType: it.slug,
      productName: it.name,
      amount: it.amount,
      // Maatlabel meesturen zodat buildLocalQuote de juiste CatalogSize vindt.
      sizeLabel: it.sizeLabel,
      // En de afmetingen, want een eigen maat ("Eigen: 245 × 130 cm") staat niet
      // in de catalogus: zonder deze velden valt de prijs terug op priceFrom.
      widthCm: size?.widthCm,
      heightCm: size?.heightCm,
      options: mapped.options,
      selections,
      unmapped: mapped.unmapped,
      designs,
    });
  }

  // Ingelogde klant? Koppel de order aan zijn customer-record, zodat de
  // bestelling in het klantportaal (/account) verschijnt. Geen sessie → gast
  // (customer_id blijft null; het portaal matcht die order later op e-mail).
  // Raakt de prijs-/betaal-logica NIET.
  let customerId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id && user.email) {
      customerId = await getOrCreateCustomerId(user.id, user.email);
    }
  } catch {
    // Auth/DB niet beschikbaar → gewoon als gast doorgaan.
    customerId = null;
  }

  const input: CheckoutInput = {
    market,
    email,
    phone: phone || undefined,
    isBusiness,
    vatNumber: vatNumber || null,
    customerId,
    billingAddress,
    shippingAddress,
    items: draftItems,
  };

  let checkoutUrl: string | null = null;
  try {
    const result = await placeOrder(input);
    checkoutUrl = result.checkoutUrl;

    // AVG: de klant maakte bij het afrekenen bezwaar tegen de
    // vervangingsherinneringen (soft opt-in vereist die keuze op het moment dat
    // we het adres verzamelen). Best-effort; blokkeert de betaling nooit.
    if (formData.get("noMarketing") != null) {
      await suppressEmail(email, "checkout_opt_out").catch(() => {});
    }
  } catch (err) {
    // Log de échte oorzaak, altijd. Dit stond hier als kale `catch {}`, en dan
    // ziet een mislukte betaling er in de logs uit alsof er niets gebeurde —
    // terwijl de klant een generieke foutmelding krijgt.
    //
    // `err.message` van een HttpError is alleen "POST … → HTTP 422"; de reden
    // (verkeerde sleutel, onbereikbare webhook-URL, geen methodes actief) zit in
    // `body`. Die moet dus mee, anders is deze log alsnog nutteloos.
    const detail =
      err instanceof HttpError
        ? { status: err.status, mollie: err.body }
        : {
            fout:
              err instanceof Error
                ? `${err.name}: ${err.message}`
                : String(err),
          };
    console.error("[checkout] placeOrder faalde", {
      market,
      regels: draftItems.length,
      ...detail,
    });
    return {
      status: "error",
      message: dict.errors.generic,
      values: echoValues(formData),
    };
  }

  // redirect() throws — must live outside the try/catch above.
  if (checkoutUrl) redirect(checkoutUrl);

  return {
    status: "error",
    message: dict.errors.paymentFailed,
    values: echoValues(formData),
  };
}
