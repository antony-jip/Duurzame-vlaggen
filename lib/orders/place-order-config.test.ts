import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Regressietest: `placeOrder` mag NIETS wegschrijven als de configuratie niet
 * compleet is.
 *
 * Aanleiding (2026-07-15): op productie ontbrak `MOLLIE_API_KEY`. De getter
 * `serverEnv.mollieApiKey` throwt dan, maar dat gebeurde pas bij `createPayment`
 * — ná `insertOrderWithItems`. Gevolg: elke betaalpoging liet een order op
 * status `cart` achter zonder betaling, terwijl de klant alleen "er is iets
 * misgegaan" zag. In de Vercel-logs was dat zichtbaar als een POST naar
 * `orders` (201) zonder enige call naar Mollie.
 *
 * De fix is een aanraking van beide env-getters bovenaan `placeOrder`. Deze test
 * bewaakt dat: ontbreekt de sleutel, dan volgt een throw en blijft de repository
 * onaangeroerd.
 */

const inserts: string[] = [];

vi.mock("@/lib/orders/repository", () => ({
  insertOrderWithItems: vi.fn(async () => {
    inserts.push("INSERT");
    return { id: "order-1" };
  }),
  getOrderById: vi.fn(),
  getOrderByMolliePaymentId: vi.fn(),
  getOrderItems: vi.fn(),
  advanceOrderStatus: vi.fn(),
  recordEventOnce: vi.fn(),
}));

vi.mock("@/lib/mollie/payments", () => ({
  createPayment: vi.fn(),
  getPayment: vi.fn(),
}));

import { placeOrder } from "@/lib/orders/orchestration";

const invoer = {
  market: "nl-NL" as const,
  email: "test@example.com",
  shippingAddress: { country: "NL" },
  items: [
    {
      proboProductCode: "flag-ciclo",
      productType: "baniervlag",
      productName: "Baniervlag",
      amount: 1,
      sizeLabel: "100 × 300 cm",
      options: [],
    },
  ],
};

describe("placeOrder: configuratie-check vóór de eerste schrijfactie", () => {
  beforeEach(() => {
    inserts.length = 0;
  });

  it("laat geen weesorder achter als MOLLIE_API_KEY ontbreekt", async () => {
    const oud = process.env.MOLLIE_API_KEY;
    delete process.env.MOLLIE_API_KEY;
    try {
      await expect(placeOrder(invoer)).rejects.toThrow(/MOLLIE_API_KEY/);
      expect(inserts).toEqual([]);
    } finally {
      if (oud === undefined) delete process.env.MOLLIE_API_KEY;
      else process.env.MOLLIE_API_KEY = oud;
    }
  });

  it("laat geen weesorder achter als NEXT_PUBLIC_APP_URL ontbreekt", async () => {
    const oud = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    try {
      await expect(placeOrder(invoer)).rejects.toThrow(/NEXT_PUBLIC_APP_URL/);
      expect(inserts).toEqual([]);
    } finally {
      if (oud === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = oud;
    }
  });
});
