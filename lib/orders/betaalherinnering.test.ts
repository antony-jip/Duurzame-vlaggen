import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderRow } from "@/lib/db/types";

/**
 * Unit-test van de betaalherinnering-sweep: het 7-dagenvenster, de
 * claim-vóór-verzenden-volgorde (hoogstens één herinnering) en de inhoud van
 * de mail die de deur uit gaat. Repository en mailverzending zijn gemockt; de
 * template is echt, zodat de test ook de copy met betaallink dekt.
 */

vi.mock("@/lib/orders/repository", () => ({
  listOpRekeningReminderCandidates: vi.fn(async () => []),
  claimBetaalherinnering: vi.fn(async () => true),
  recordEvent: vi.fn(async () => {}),
}));

vi.mock("@/lib/email/send", () => ({
  sendMailInhoud: vi.fn(async () => ({ sent: true })),
}));

import { runBetaalherinnering, HERINNERING_NA_DAGEN } from "./betaalherinnering";
import {
  claimBetaalherinnering,
  listOpRekeningReminderCandidates,
  recordEvent,
} from "@/lib/orders/repository";
import { sendMailInhoud } from "@/lib/email/send";

const lijst = vi.mocked(listOpRekeningReminderCandidates);
const claim = vi.mocked(claimBetaalherinnering);
const verzend = vi.mocked(sendMailInhoud);

function orderFixture(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: "order-1",
    order_number: "DV-2026-0001",
    email: "klant@example.com",
    status: "awaiting_payment",
    created_at: "2026-07-01T10:00:00.000Z",
    total: 121,
    mollie_payment_link_id: "pl_test",
    mollie_payment_link_url: "https://payment-link.mollie.com/payment/test",
    payment_reminder_sent_at: null,
    shipping_address: { first_name: "Antony" },
    ...overrides,
  } as unknown as OrderRow;
}

beforeEach(() => {
  vi.clearAllMocks();
  claim.mockResolvedValue(true);
  lijst.mockResolvedValue([]);
});

describe("runBetaalherinnering", () => {
  it("zoekt kandidaten van 7 dagen of ouder", async () => {
    const nu = new Date("2026-07-18T09:00:00.000Z");
    await runBetaalherinnering(nu);
    const verwacht = new Date(
      nu.getTime() - HERINNERING_NA_DAGEN * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(lijst).toHaveBeenCalledWith(verwacht);
  });

  it("claimt vóór verzenden en mailt de betaallink met de juiste boodschap", async () => {
    lijst.mockResolvedValue([orderFixture()]);

    const result = await runBetaalherinnering();
    expect(result).toEqual({
      candidates: 1,
      sent: 1,
      skippedClaimed: 0,
      errors: 0,
    });

    // Claim vóór verzenden: bij een crash tussenin liever géén mail dan twee.
    expect(claim.mock.invocationCallOrder[0]).toBeLessThan(
      verzend.mock.invocationCallOrder[0],
    );

    const [aan, mail] = verzend.mock.calls[0];
    expect(aan).toBe("klant@example.com");
    expect(mail.onderwerp).toContain("DV-2026-0001");
    expect(mail.html).toContain("https://payment-link.mollie.com/payment/test");
    // Kernbelofte van de flow: productie start pas na betaling.
    expect(mail.tekst).toContain(
      "We maken en versturen je vlaggen zodra je betaling binnen is.",
    );
    expect(recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "betaalherinnering.sent" }),
    );
  });

  it("slaat orders over die al geclaimd zijn (herinnering gaat maar één keer)", async () => {
    lijst.mockResolvedValue([orderFixture()]);
    claim.mockResolvedValue(false);

    const result = await runBetaalherinnering();
    expect(result).toEqual({
      candidates: 1,
      sent: 0,
      skippedClaimed: 1,
      errors: 0,
    });
    expect(verzend).not.toHaveBeenCalled();
  });

  it("telt een mislukte order als fout en gaat door met de rest", async () => {
    lijst.mockResolvedValue([
      orderFixture({ id: "order-a" } as Partial<OrderRow>),
      orderFixture({ id: "order-b", order_number: "DV-2026-0002" } as Partial<OrderRow>),
    ]);
    claim.mockRejectedValueOnce(new Error("db weg"));

    const result = await runBetaalherinnering();
    expect(result).toEqual({
      candidates: 2,
      sent: 1,
      skippedClaimed: 0,
      errors: 1,
    });
  });
});
