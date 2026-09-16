import { beforeEach, describe, expect, it, vi } from "vitest";

const mails: Array<{ to: string; onderwerp: string; html: string; tekst: string }> = [];
let mollieFaalt = false;
const mollieCalls: Array<{ amount: number; description: string; webhookUrl?: string }> = [];

process.env.EMAIL_LINK_SECRET ??= "test-secret-akkoord";
process.env.NEXT_PUBLIC_APP_URL ??= "https://duurzame-vlaggen.nl";

vi.mock("@/lib/email/client", () => ({ isEmailConfigured: () => true }));
vi.mock("@/lib/email/send", () => ({
  sendMailInhoud: vi.fn(async (to: string, mail: { onderwerp: string; html: string; tekst: string }) => {
    mails.push({ to, ...mail });
    return { sent: true };
  }),
}));
vi.mock("@/lib/mollie/payment-links", () => ({
  createPaymentLink: vi.fn(async (input: { amount: number; description: string; webhookUrl?: string }) => {
    mollieCalls.push(input);
    if (mollieFaalt) throw new Error("Mollie down");
    return { id: "pl_test", url: "https://payment-links.mollie.com/payment/test", paidAt: null, raw: {} };
  }),
}));

const { POST } = await import("./route");
const { signOfferteToken } = await import("@/lib/offerte/token");
const { serverEnv } = await import("@/lib/env");

function token(over: Record<string, unknown> = {}) {
  return signOfferteToken(
    {
      n: "OF-260916-PRSY",
      s: "Beachvlag",
      t: 90.15,
      g: new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10),
      o: "Gemeente Enkhuizen",
      nm: "Sanne de Vries",
      e: "sanne@gemeente.example",
      ...over,
    },
    serverEnv.emailLinkSecret,
  );
}

let ip = 0;
const verzoek = (body: unknown) =>
  new Request("http://localhost/api/offerte/akkoord", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `10.1.0.${++ip}` },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  mails.length = 0;
  mollieCalls.length = 0;
  mollieFaalt = false;
});

describe("POST /api/offerte/akkoord", () => {
  it("maakt een betaallink voor het offertebedrag, mailt de klant en meldt Antony", async () => {
    const res = await POST(verzoek({ t: token(), naam: "Sanne de Vries", email: "inkoop@gemeente.example" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.betaalUrl).toContain("mollie.com");

    expect(mollieCalls).toHaveLength(1);
    expect(mollieCalls[0].amount).toBe(90.15);
    expect(mollieCalls[0].description).toContain("OF-260916-PRSY");
    expect(mollieCalls[0].webhookUrl).toContain("/api/offerte/webhook?n=OF-260916-PRSY");

    const [klant, melding] = mails;
    expect(klant.to).toBe("inkoop@gemeente.example");
    expect(klant.html).toContain("https://payment-links.mollie.com/payment/test");
    expect(melding.to).toBe("antony@signcompany.nl");
    expect(melding.onderwerp).toContain("Akkoord op offerte OF-260916-PRSY");
    expect(melding.tekst).toContain("Betaallink is naar de klant gemaild.");
  });

  it("weigert een aangepast bedrag (handtekening klopt niet)", async () => {
    const [payload, sig] = token().split(".");
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    const vervalst = `${Buffer.from(JSON.stringify({ ...data, t: 1 })).toString("base64url")}.${sig}`;
    const res = await POST(verzoek({ t: vervalst, naam: "Test", email: "a@b.nl" }));
    expect(res.status).toBe(400);
    expect(mollieCalls).toHaveLength(0);
    expect(mails).toHaveLength(0);
  });

  it("weigert een verlopen offerte", async () => {
    const res = await POST(verzoek({ t: token({ g: "2020-01-01" }), naam: "Test", email: "a@b.nl" }));
    expect(res.status).toBe(410);
    expect(mollieCalls).toHaveLength(0);
  });

  it("maakt geen betaallink bij 'prijs volgt', maar meldt Antony wel", async () => {
    const res = await POST(verzoek({ t: token({ h: true }), naam: "Test", email: "a@b.nl" }));
    expect(res.status).toBe(200);
    expect(mollieCalls).toHaveLength(0);
    expect(mails.map((m) => m.to)).toEqual(["a@b.nl", "antony@signcompany.nl"]);
    expect(mails[1].tekst).toContain("prijs volgt");
  });

  it("laat het akkoord niet verdampen als Mollie faalt", async () => {
    mollieFaalt = true;
    const res = await POST(verzoek({ t: token(), naam: "Test", email: "a@b.nl" }));
    expect(res.status).toBe(200);
    expect(mails[0].html).toContain("binnen één werkdag");
    expect(mails[1].tekst).toContain("MISLUKT");
  });
});
