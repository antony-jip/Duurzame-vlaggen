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
import { getMessages } from "@/lib/i18n";
import {
  placeOrder,
  type CheckoutInput,
  type OrderItemDraft,
} from "@/lib/orders/orchestration";
import type { ProboAddress } from "@/lib/probo/products";
import type { CartItem } from "@/components/cart/types";

export interface CheckoutState {
  status: "idle" | "error" | "quote";
  /** General banner message. */
  message?: string;
  /** Per-field validation errors, keyed by form field name. */
  fieldErrors?: Record<string, string>;
}

export const initialCheckoutState: CheckoutState = { status: "idle" };

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

function parseItems(raw: string): CartItem[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as CartItem[];
  } catch {
    return [];
  }
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
    return { status: "error", message: dict.errors.cartEmpty };
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
    return { status: "error", fieldErrors, message: dict.errors.generic };
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

  // All lines orderable → build the order input.
  const draftItems: OrderItemDraft[] = items.map((it) => ({
    // Guarded above: every line has a non-null Probo code here.
    proboProductCode: it.proboProductCode as string,
    productType: it.slug,
    productName: it.name,
    amount: it.amount,
    options: it.options.map((o) => ({ code: o.code, value: o.value })),
  }));

  const input: CheckoutInput = {
    market,
    email,
    phone: phone || undefined,
    isBusiness,
    vatNumber: vatNumber || null,
    billingAddress,
    shippingAddress,
    items: draftItems,
  };

  let checkoutUrl: string | null = null;
  try {
    const result = await placeOrder(input);
    checkoutUrl = result.checkoutUrl;
  } catch {
    return { status: "error", message: dict.errors.generic };
  }

  // redirect() throws — must live outside the try/catch above.
  if (checkoutUrl) redirect(checkoutUrl);

  return { status: "error", message: dict.errors.paymentFailed };
}
