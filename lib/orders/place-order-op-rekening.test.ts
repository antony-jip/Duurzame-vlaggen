import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderRow } from "@/lib/db/types";

/**
 * Unit-test van de op-rekening-tak van `placeOrder`: er wordt een
 * Mollie-BETAALLINK aangemaakt (geen gewone betaling), de order parkeert op
 * `awaiting_payment` met de linkgegevens, de factuurmail gaat direct en
 * eenmalig de deur uit (met PDF-bijlage en betaallink), en de klant landt op
 * de orderbevestiging. Externe randen (repository, Mollie, PDF, mail) zijn
 * gemockt; de mailtemplate is echt.
 */

const orderRow = {
  id: "order-opr-1",
  order_number: "DV-2026-0042",
  email: "zakelijk@example.com",
  status: "cart",
  created_at: "2026-07-18T08:00:00.000Z",
  total: 121,
  vat_rate: 21,
  vat_amount: 21,
  shipping_cost: 0,
  reverse_charge: false,
  shipping_address: { first_name: "Antony", company_name: "Sign Company VOF" },
} as unknown as OrderRow;

vi.mock("@/lib/orders/repository", () => ({
  insertOrderWithItems: vi.fn(async () => orderRow),
  advanceOrderStatus: vi.fn(async (_id: string, status: string, extra: object) => ({
    ...orderRow,
    status,
    ...extra,
  })),
  recordEventOnce: vi.fn(async () => ({ inserted: true })),
  getOrderById: vi.fn(async () => orderRow),
  getOrderByMolliePaymentId: vi.fn(async () => null),
  getOrderItems: vi.fn(async () => []),
  countPendingDesigns: vi.fn(async () => 0),
}));

vi.mock("@/lib/mollie/payments", () => ({
  createPayment: vi.fn(),
  getPayment: vi.fn(),
}));

vi.mock("@/lib/mollie/payment-links", () => ({
  createPaymentLink: vi.fn(async () => ({
    id: "pl_test_1",
    url: "https://payment-link.mollie.com/payment/pl_test_1",
    paidAt: null,
    raw: {},
  })),
}));

vi.mock("@/lib/factuur/generate", () => ({
  generateFactuur: vi.fn(async () => new Uint8Array([37, 80, 68, 70])),
}));

vi.mock("@/lib/email/send", () => ({
  sendMailInhoud: vi.fn(async () => ({ sent: true })),
  sendMateriaalpaspoortEmail: vi.fn(async () => ({ sent: true })),
}));

import { placeOrder } from "./orchestration";
import { advanceOrderStatus, recordEventOnce } from "@/lib/orders/repository";
import { createPayment } from "@/lib/mollie/payments";
import { createPaymentLink } from "@/lib/mollie/payment-links";
import { sendMailInhoud } from "@/lib/email/send";

const invoer = {
  market: "nl-NL" as const,
  email: "zakelijk@example.com",
  isBusiness: true,
  paymentMethod: "op_rekening" as const,
  shippingAddress: {
    company_name: "Sign Company VOF",
    first_name: "Antony",
    last_name: "Bootsma",
    street: "De Drie Kronen",
    house_number: "115",
    postal_code: "1601 MT",
    city: "Enkhuizen",
    country: "NL",
  },
  items: [
    {
      proboProductCode: "flag-ciclo",
      productType: "mastvlag",
      productName: "Mastvlag",
      options: [],
      amount: 1,
      sizeLabel: "225 × 150 cm",
      selections: { Formaat: "225 × 150 cm" },
      designs: [{ quantity: 1, fileUrl: null }],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("placeOrder op rekening", () => {
  it("maakt een betaallink, parkeert op awaiting_payment en mailt de factuur", async () => {
    const resultaat = await placeOrder(invoer);

    // Betaallink in plaats van een gewone betaling.
    expect(createPayment).not.toHaveBeenCalled();
    expect(createPaymentLink).toHaveBeenCalledTimes(1);
    const linkInput = vi.mocked(createPaymentLink).mock.calls[0][0];
    expect(linkInput.description).toBe("Duurzame-Vlaggen DV-2026-0042");
    expect(linkInput.redirectUrl).toMatch(/\/order\/order-opr-1$/);
    // Localhost-app-URL → geen webhookUrl (Mollie weigert onbereikbare URL's);
    // in productie draagt de webhook-URL het order-id als queryparameter.
    if (linkInput.webhookUrl) {
      expect(linkInput.webhookUrl).toContain(
        "/api/webhooks/mollie?order=order-opr-1",
      );
    }

    // Order wacht op betaling, mét de linkgegevens; productie start pas later.
    expect(advanceOrderStatus).toHaveBeenCalledWith("order-opr-1", "awaiting_payment", {
      mollie_payment_link_id: "pl_test_1",
      mollie_payment_link_url: "https://payment-link.mollie.com/payment/pl_test_1",
    });

    // Klant landt op de orderbevestiging, niet op Mollie.
    expect(resultaat.checkoutUrl).toMatch(/\/order\/order-opr-1$/);

    // Factuurmail: eenmalig geclaimd, met betaallink en PDF-bijlage.
    expect(recordEventOnce).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "factuur.sent" }),
    );
    expect(sendMailInhoud).toHaveBeenCalledTimes(1);
    const [aan, mail, , bijlagen] = vi.mocked(sendMailInhoud).mock.calls[0];
    expect(aan).toBe("zakelijk@example.com");
    expect(mail.onderwerp).toContain("Factuur DV-2026-0042");
    expect(mail.html).toContain("https://payment-link.mollie.com/payment/pl_test_1");
    expect(mail.tekst).toContain(
      "Zodra je betaling binnen is, starten we de productie van je vlaggen.",
    );
    expect(bijlagen?.[0]?.filename).toBe("factuur-DV-2026-0042.pdf");
  });

  it("verstuurt de factuur niet nog eens wanneer het event al bestaat", async () => {
    vi.mocked(recordEventOnce).mockResolvedValue({ inserted: false });
    await placeOrder(invoer);
    expect(sendMailInhoud).not.toHaveBeenCalled();
  });
});
