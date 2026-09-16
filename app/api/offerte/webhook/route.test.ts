import { beforeEach, describe, expect, it, vi } from "vitest";

const mails: Array<{ to: string; onderwerp: string }> = [];
let betaling = { status: "paid", description: "Offerte OF-260916-PRSY · Duurzame Vlaggen" };

vi.mock("@/lib/email/send", () => ({
  sendMailInhoud: vi.fn(async (to: string, mail: { onderwerp: string }) => {
    mails.push({ to, onderwerp: mail.onderwerp });
    return { sent: true };
  }),
}));
vi.mock("@/lib/mollie/payments", async (orig) => ({
  ...(await orig<typeof import("@/lib/mollie/payments")>()),
  getPayment: vi.fn(async (id: string) => ({
    id,
    status: betaling.status,
    amountValue: "90.15",
    currency: "EUR",
    metadata: null,
    raw: { description: betaling.description },
  })),
}));

const { POST } = await import("./route");

const webhook = (n: string, id = "tr_abc") =>
  new Request(`https://duurzame-vlaggen.nl/api/offerte/webhook?n=${n}`, {
    method: "POST",
    body: `id=${id}`,
  });

beforeEach(() => {
  mails.length = 0;
  betaling = { status: "paid", description: "Offerte OF-260916-PRSY · Duurzame Vlaggen" };
});

describe("POST /api/offerte/webhook", () => {
  it("meldt Antony als de betaling echt betaald is", async () => {
    const res = await POST(webhook("OF-260916-PRSY"));
    expect(res.status).toBe(200);
    expect(mails).toEqual([{ to: "antony@signcompany.nl", onderwerp: "Betaald: offerte OF-260916-PRSY · € 90,15" }]);
  });

  it("meldt niets bij een open betaling", async () => {
    betaling.status = "open";
    await POST(webhook("OF-260916-PRSY"));
    expect(mails).toHaveLength(0);
  });

  it("meldt niets als het offertenummer niet bij de betaling hoort", async () => {
    await POST(webhook("OF-260916-ZZZZ"));
    expect(mails).toHaveLength(0);
  });
});
