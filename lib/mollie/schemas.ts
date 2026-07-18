import "server-only";

import { z } from "zod";

/**
 * Zod schemas for the Mollie payloads this module touches. All object schemas
 * are tolerant (`.passthrough()`) because Mollie frequently adds fields; we only
 * assert the ones we depend on. Parse failures surface as clear zod errors.
 */

/** A Mollie money object: a 2-decimal string value plus a currency code. */
export const mollieAmountSchema = z
  .object({
    value: z.string(),
    currency: z.string(),
  })
  .passthrough();

export type MollieAmountShape = z.infer<typeof mollieAmountSchema>;

/**
 * The subset of a Mollie Payment resource we rely on. Covers both the
 * `POST /payments` (create) and `GET /payments/:id` responses.
 */
export const molliePaymentSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    amount: mollieAmountSchema,
    metadata: z.unknown().optional(),
    _links: z
      .object({
        checkout: z
          .object({ href: z.string() })
          .passthrough()
          .nullish(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type MolliePayment = z.infer<typeof molliePaymentSchema>;

/**
 * The subset of a Mollie Payment Link resource we rely on (Payment Links API,
 * `POST /payment-links` and `GET /payment-links/:id`). `_links.paymentLink` is
 * the URL the customer pays on; `paidAt` is set once the link is paid.
 */
export const molliePaymentLinkSchema = z
  .object({
    id: z.string(),
    paidAt: z.string().nullish(),
    expiresAt: z.string().nullish(),
    _links: z
      .object({
        paymentLink: z
          .object({ href: z.string() })
          .passthrough()
          .nullish(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type MolliePaymentLink = z.infer<typeof molliePaymentLinkSchema>;

/**
 * The webhook payload Mollie POSTs (form-urlencoded, parsed into an object).
 * Mollie sends only the payment `id`; never trust anything else from it.
 */
export const mollieWebhookSchema = z.object({
  id: z.string().min(1),
});

export type MollieWebhookPayload = z.infer<typeof mollieWebhookSchema>;
