import { beforeEach, describe, expect, it, vi } from "vitest";

const verstuurd: Array<{
  to: string;
  onderwerp: string;
  html: string;
  headers?: Record<string, string>;
  bijlagen?: Array<{ filename: string; content: Buffer }>;
  bcc?: string | string[];
}> = [];
let mailLukt = true;

vi.mock("@/lib/email/client", () => ({ isEmailConfigured: () => true }));
vi.mock("@/lib/email/send", () => ({
  sendMailInhoud: vi.fn(
    async (
      to: string,
      mail: { onderwerp: string; html: string },
      headers?: Record<string, string>,
      bijlagen?: Array<{ filename: string; content: Buffer }>,
      bcc?: string | string[],
    ) => {
      verstuurd.push({ to, onderwerp: mail.onderwerp, html: mail.html, headers, bijlagen, bcc });
      return mailLukt ? { sent: true } : { sent: false, reason: "provider_error" };
    },
  ),
}));

const { POST } = await import("./route");
const { serverEnv } = await import("@/lib/env");
const { berekenOfferte } = await import("@/lib/offerte/bereken");

const MAAT = "Straight Medium S — 65 × 315 cm";
const regel = {
  slug: "beachvlag",
  sizeLabel: MAAT,
  widthCm: 65,
  heightCm: 315,
  amount: 12,
  options: [
    { code: "Formaat", value: MAAT },
    { code: "Mastzijde", value: "Links" },
    { code: "Samenstelling", value: "Vlag + stok" },
    { code: "Accessoires", value: "12× Kruisvoet" },
  ],
};

let ipTeller = 0;
function verzoek(body: unknown, ip = `10.0.0.${++ipTeller}`) {
  return new Request("http://localhost/api/offerte", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const geldig = (email = `inkoop${ipTeller}@gemeente.example`) => ({
  organisatie: "Gemeente Enkhuizen",
  naam: "Sanne de Vries",
  email,
  referentie: "PO-2026-0412",
  regels: [regel],
});

beforeEach(() => {
  verstuurd.length = 0;
  mailLukt = true;
});

describe("POST /api/offerte", () => {
  it("mailt de PDF naar de klant met BCC naar Antony, met het mandbedrag", async () => {
    const body = geldig("sanne@gemeente.example");
    const res = await POST(verzoek(body));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.nummer).toMatch(/^OF-\d{6}-[A-Z2-9]{4}$/);
    // Eén mail: naar de klant, Antony onzichtbaar in BCC.
    expect(verstuurd).toHaveLength(1);

    const [klant] = verstuurd;
    expect(klant.to).toBe("sanne@gemeente.example");
    expect(klant.bcc).toBe("antony@signcompany.nl");
    expect(klant.headers?.["Reply-To"]).toBe(serverEnv.contactInbox);
    expect(klant.onderwerp).toContain(json.nummer);
    expect(klant.bijlagen?.[0].filename).toBe(`offerte-${json.nummer}.pdf`);
    expect(klant.bijlagen?.[0].content.subarray(0, 5).toString()).toBe("%PDF-");

    // Bedrag in de mail = server-berekening, niet iets uit de browser.
    const r = berekenOfferte([regel]);
    if (!r.ok) throw new Error(r.fout);
    const totaal = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
      r.offerte.totaal,
    );
    expect(klant.html).toContain(totaal);
  });

  it("zegt het eerlijk als de klantmail niet aankomt", async () => {
    mailLukt = false;
    const res = await POST(verzoek(geldig()));
    expect(res.status).toBe(502);
    expect(verstuurd).toHaveLength(1);
  });

  it("weigert een vervalste keuze zonder te mailen", async () => {
    const res = await POST(
      verzoek({ ...geldig(), regels: [{ ...regel, options: [{ code: "Mastzijde", value: "Gratis" }] }] }),
    );
    expect(res.status).toBe(400);
    expect(verstuurd).toHaveLength(0);
  });

  it("stuurt bij de honeypot niets maar doet alsof het lukte", async () => {
    const res = await POST(verzoek({ ...geldig(), website: "spam.example" }));
    expect(res.status).toBe(200);
    expect(verstuurd).toHaveLength(0);
  });

  it("remt herhaald aanvragen naar hetzelfde adres af", async () => {
    const statussen: number[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await POST(verzoek(geldig("zelfde@gemeente.example")));
      statussen.push(res.status);
    }
    expect(statussen.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statussen.slice(5)).toEqual([429, 429]);
  });
});
