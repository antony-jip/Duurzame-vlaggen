import { describe, expect, it } from "vitest";
import { PDFDocument, PDFDict, PDFName, PDFString } from "pdf-lib";
import type { OrderRow, OrderItemRow } from "@/lib/db/types";
import { generateFactuur } from "./generate";

/**
 * Factuur-PDF: dekt het online-betaalblok. Kernregel is dat een openstaande
 * op-rekening-order (mollie-betaallink, nog niet betaald) een klikbare
 * betaallink op de factuur krijgt, en dat een betaalde order dat NIET krijgt —
 * de factuur die de klant dan downloadt mag niet meer tot betalen uitnodigen.
 */

const BETAALLINK = "https://payment-link.mollie.com/payment/dv-test-1234";

function orderFixture(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: "order-1",
    order_number: "DV-20260718-TEST",
    market: "nl",
    currency: "EUR",
    email: "klant@example.com",
    status: "awaiting_payment",
    created_at: "2026-07-18T10:00:00.000Z",
    paid_at: null,
    reverse_charge: false,
    vat_rate: 21,
    subtotal_ex_vat: 100,
    shipping_cost: 0,
    vat_amount: 21,
    total: 121,
    vat_number: null,
    mollie_payment_link_url: BETAALLINK,
    billing_address: { first_name: "Antony", last_name: "Bootsma", city: "Utrecht" },
    shipping_address: { first_name: "Antony", last_name: "Bootsma", city: "Utrecht" },
    ...overrides,
  } as unknown as OrderRow;
}

const items: OrderItemRow[] = [
  {
    product_type: "baniervlag",
    product_name: "Baniervlag",
    amount: 1,
    line_price: 100,
    configuration: { sizeLabel: "100 × 300 cm" },
  } as unknown as OrderItemRow,
];

/** Leest de URI's uit alle link-annotaties van de eerste pagina. */
async function linkUris(order: OrderRow): Promise<string[]> {
  const bytes = await generateFactuur(order, items);
  const doc = await PDFDocument.load(bytes);
  const annots = doc.getPage(0).node.Annots();
  if (!annots) return [];
  const uris: string[] = [];
  for (let i = 0; i < annots.size(); i++) {
    const annot = annots.lookup(i, PDFDict);
    const action = annot.lookupMaybe(PDFName.of("A"), PDFDict);
    const uri = action?.lookup(PDFName.of("URI"));
    if (uri instanceof PDFString) uris.push(uri.asString());
  }
  return uris;
}

describe("generateFactuur — online betalen", () => {
  it("zet een klikbare betaallink op een openstaande op-rekening-factuur", async () => {
    expect(await linkUris(orderFixture())).toContain(BETAALLINK);
  });

  it("laat het betaalblok weg zodra de order betaald is", async () => {
    const paid = orderFixture({
      status: "paid",
      paid_at: "2026-07-18T12:00:00.000Z",
    });
    expect(await linkUris(paid)).not.toContain(BETAALLINK);
  });

  it("laat het betaalblok weg als er geen betaallink is", async () => {
    expect(await linkUris(orderFixture({ mollie_payment_link_url: null }))).toHaveLength(0);
  });
});
