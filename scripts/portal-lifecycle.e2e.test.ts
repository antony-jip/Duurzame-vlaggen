import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { deflateSync } from "node:zlib";

/**
 * E2E-bewijs voor de multi-design/portaal/lifecycle-keten, tegen de ECHTE
 * Supabase (tabellen + Storage). Extern zijn alleen Mollie en e-mail gemockt:
 *
 *  - `@/lib/mollie/payments`: createPayment/getPayment nep, zodat de flow geen
 *    echte betaling nodig heeft (zelfde aanpak als handle-mollie-payment.test).
 *  - `@/lib/email/send`: verzenden gemockt en GECAPTURED, zodat we de inhoud
 *    van de aanlever-, notificatie- en lifecycle-mails kunnen asserteren
 *    zonder Resend-key.
 *
 * Bewezen keten: placeOrder met gemengde designs → paid-webhook parkeert op
 * awaiting_files + portaallink-mail → portaal-attach (echte Storage-check)
 * vult het laatste ontwerp → notificatie "alles binnen", status blijft
 * awaiting_files (bestellen gaat met de hand) → token-scope/verval/afsluiting
 * → herbestellen reconstrueert de verdeling → lifecycle-cron selecteert,
 * verstuurt één keer, en respecteert uitschrijven. Ruimt zichzelf op.
 */

const hasKeys =
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

// HMAC-secret voor uitschrijflinks: in deze test zelf gezet (staat nog niet in
// .env.local; productie krijgt zijn eigen waarde).
process.env.EMAIL_LINK_SECRET ??= "e2e-test-secret";

// --- Mocks (gehoist) -----------------------------------------------------------

const { FAKE_PAYMENT_ID, sentMails } = vi.hoisted(() => ({
  FAKE_PAYMENT_ID: `tr_e2e_${Math.random().toString(36).slice(2, 10)}`,
  sentMails: [] as Array<{ to: string; onderwerp: string; html: string; tekst: string }>,
}));

vi.mock("@/lib/mollie/payments", () => ({
  createPayment: vi.fn(async () => ({
    id: FAKE_PAYMENT_ID,
    status: "open",
    checkoutUrl: "https://mollie.test/checkout",
  })),
  getPayment: vi.fn(async (id: string) => ({
    id,
    status: "paid",
    amountValue: "10.00",
    currency: "EUR",
    metadata: null,
    raw: {},
  })),
}));

vi.mock("@/lib/email/send", () => ({
  sendMailInhoud: vi.fn(
    async (to: string, mail: { onderwerp: string; html: string; tekst: string }) => {
      sentMails.push({ to, ...mail });
      return { sent: true };
    },
  ),
  sendMateriaalpaspoortEmail: vi.fn(async () => ({ sent: true })),
  sendKlantMail: vi.fn(async () => ({ sent: true })),
}));

// Imports ná de mocks.
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  placeOrder,
  handleMolliePayment,
  PORTAL_TTL_DAYS,
} from "@/lib/orders/orchestration";
import {
  advanceOrderStatus,
  countPendingDesigns,
  getOrderById,
  getOrderDesigns,
  getOrderItems,
  hasEvent,
  isEmailSuppressed,
  suppressEmail,
  updateOrder,
} from "@/lib/orders/repository";
import { orderItemsToCartLines } from "@/lib/orders/reorder";
import { runLifecycle } from "@/lib/orders/lifecycle";
import { signEmailToken } from "@/lib/email/links";
import { getProduct } from "@/lib/catalog/products";
import { POST as portalPOST } from "@/app/api/portal/route";
import { DELETE as artworkDELETE } from "@/app/api/artwork/route";
import { POST as unsubscribePOST } from "@/app/api/unsubscribe/route";
import type { OrderRow } from "@/lib/db/types";

// --- Test-PNG (geldige magic bytes + IDAT, ~800 bytes) ---------------------------

function makePng(rgb: [number, number, number]): Buffer {
  const w = 50;
  const h = 20;
  const crcTable: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc32 = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const be32 = (n: number) => {
    const b = Buffer.alloc(4);
    b.writeUInt32BE(n >>> 0);
    return b;
  };
  const chunk = (tag: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(tag, "ascii"), data]);
    return Buffer.concat([be32(data.length), body, be32(crc32(body))]);
  };
  const ihdr = Buffer.concat([be32(w), be32(h), Buffer.from([8, 2, 0, 0, 0])]);
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, Buffer.from(rgb))]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const BUCKET = "order-artwork";

function publicUrlFor(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function uploadPng(name: string, rgb: [number, number, number]): Promise<string> {
  const path = `${randomUUID()}-${name}`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, makePng(rgb), { contentType: "image/png" });
  if (error) throw new Error(`upload ${name} faalde: ${error.message}`);
  return path;
}

async function storageExists(path: string): Promise<boolean> {
  const res = await fetch(publicUrlFor(path), { method: "HEAD", cache: "no-store" });
  return res.ok;
}

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// --- De test ---------------------------------------------------------------------

const CUSTOMER_EMAIL = `e2e-portal-${Math.random().toString(36).slice(2, 8)}@example.com`;

const uploaded: string[] = [];
let order: OrderRow;

describe.skipIf(!hasKeys)("multi-design → portaal → lifecycle (e2e)", () => {
  beforeAll(async () => {
    for (const [name, rgb] of [
      ["ontwerp-a.png", [44, 95, 79]],
      ["ontwerp-b.png", [198, 107, 78]],
      ["ontwerp-c.png", [92, 138, 157]],
    ] as const) {
      uploaded.push(await uploadPng(name, [...rgb] as [number, number, number]));
    }
  }, 30_000);

  afterAll(async () => {
    const supabase = createSupabaseAdminClient();
    if (order) {
      await supabase.from("orders").delete().eq("id", order.id); // cascade: items/designs/events
    }
    await supabase.storage.from(BUCKET).remove(uploaded);
    await supabase.from("marketing_suppressions").delete().eq("email", CUSTOMER_EMAIL);
  }, 30_000);

  it("(a+b) placeOrder: fast path (1×) en split (2+4 waarvan 4 pending), tokens gezet", async () => {
    const banier = getProduct("baniervlag")!;
    const maat = banier.sizes[0];

    const result = await placeOrder({
      market: "nl-NL",
      email: CUSTOMER_EMAIL,
      shippingAddress: {
        first_name: "E2e",
        last_name: "Test",
        street: "Teststraat",
        house_number: "1",
        postal_code: "1000AA",
        city: "Amsterdam",
        country: "NL",
      },
      items: [
        {
          proboProductCode: "flag-ciclo",
          productType: "baniervlag",
          productName: "Baniervlag",
          options: [],
          amount: 6,
          sizeLabel: maat.label,
          designs: [
            { quantity: 2, fileUrl: publicUrlFor(uploaded[0]) },
            { quantity: 4, fileUrl: null }, // later aanleveren
          ],
        },
        {
          proboProductCode: "flag-ciclo",
          productType: "baniervlag",
          productName: "Baniervlag",
          options: [],
          amount: 1,
          sizeLabel: maat.label,
          designs: [{ quantity: 1, fileUrl: publicUrlFor(uploaded[1]) }],
        },
      ],
    });
    order = result.order;

    expect(order.portal_token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(order.reorder_token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    const ttlDays =
      (Date.parse(order.portal_expires_at!) - Date.parse(order.created_at)) / 86_400_000;
    expect(Math.round(ttlDays)).toBe(PORTAL_TTL_DAYS);

    const items = await getOrderItems(order.id);
    const designs = await getOrderDesigns(order.id);
    const zes = items.find((it) => it.amount === 6)!;
    const een = items.find((it) => it.amount === 1)!;
    expect(designs.get(zes.id)).toHaveLength(2);
    expect(designs.get(een.id)).toHaveLength(1);
    expect(zes.file_url).toBe(publicUrlFor(uploaded[0])); // eerste ontwerp mét bestand
    expect(een.file_url).toBe(publicUrlFor(uploaded[1]));
    expect(await countPendingDesigns(order.id)).toBe(1);
  }, 30_000);

  it("(c) betaald mét pending → awaiting_files + portaallink-mail", async () => {
    await handleMolliePayment(FAKE_PAYMENT_ID);

    const fresh = (await getOrderById(order.id))!;
    expect(fresh.status).toBe("awaiting_files");

    const mail = sentMails.find((m) => m.to === CUSTOMER_EMAIL);
    expect(mail?.onderwerp).toContain("aan te leveren");
    expect(mail?.html).toContain(`/aanleveren/${order.portal_token}`);
    expect(
      await hasEvent({ orderId: order.id, source: "system", eventType: "portal.link_sent" }),
    ).toBe(true);
  }, 30_000);

  it("(d) portaal-attach: laatste bestand erin, event + notificatie, GEEN auto-advance", async () => {
    const designs = await getOrderDesigns(order.id);
    const pendingDesign = Array.from(designs.values())
      .flat()
      .find((d) => d.file_url === null)!;

    const res = await portalPOST(
      jsonRequest("http://localhost/api/portal", {
        action: "attach",
        token: order.portal_token,
        designId: pendingDesign.id,
        path: uploaded[2],
        warnings: [],
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; pending: number };
    expect(body).toMatchObject({ ok: true, pending: 0 });

    // Status blijft awaiting_files: bestellen bij Probo gaat met de hand.
    expect((await getOrderById(order.id))!.status).toBe("awaiting_files");
    expect(
      await hasEvent({
        orderId: order.id,
        source: "portal",
        eventType: "design.delivered",
        externalId: pendingDesign.id,
      }),
    ).toBe(true);

    // Interne notificatie meldt dat alles binnen is.
    const notify = sentMails.find((m) => m.onderwerp.includes("Alle ontwerpen binnen"));
    expect(notify).toBeDefined();
    expect(notify!.html).toContain("Markeer besteld");
  }, 30_000);

  it("(d) vervangen via portaal: nieuw bestand, oud object opgeruimd", async () => {
    const designs = await getOrderDesigns(order.id);
    const target = Array.from(designs.values())
      .flat()
      .find((d) => d.file_path === uploaded[2])!;

    const vervanger = await uploadPng("ontwerp-d.png", [139, 123, 168]);
    uploaded.push(vervanger);

    const res = await portalPOST(
      jsonRequest("http://localhost/api/portal", {
        action: "attach",
        token: order.portal_token,
        designId: target.id,
        path: vervanger,
      }),
    );
    expect(res.status).toBe(200);

    expect(
      await hasEvent({
        orderId: order.id,
        source: "portal",
        eventType: "design.replaced",
        externalId: target.id,
      }),
    ).toBe(true);
    // Het vervangen object is nergens meer gerefereerd → weg uit Storage.
    expect(await storageExists(uploaded[2])).toBe(false);
  }, 30_000);

  it("(e) token-scope: fout token 404, verlopen 410, artwork-delete van gerefereerd bestand 409", async () => {
    const designs = await getOrderDesigns(order.id);
    const anyDesign = Array.from(designs.values()).flat()[0];

    const fout = await portalPOST(
      jsonRequest("http://localhost/api/portal", {
        action: "attach",
        token: "onzin-token",
        designId: anyDesign.id,
        path: uploaded[0],
      }),
    );
    expect(fout.status).toBe(404);

    await updateOrder(order.id, {
      portal_expires_at: new Date(Date.now() - 1000).toISOString(),
    });
    const verlopen = await portalPOST(
      jsonRequest("http://localhost/api/portal", {
        action: "attach",
        token: order.portal_token,
        designId: anyDesign.id,
        path: uploaded[0],
      }),
    );
    expect(verlopen.status).toBe(410);
    await updateOrder(order.id, {
      portal_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    });

    // Beschermd bestand (gerefereerd door een design) is niet te wissen.
    const del = await artworkDELETE(
      new Request("http://localhost/api/artwork", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: uploaded[0] }),
      }),
    );
    expect(del.status).toBe(409);
  }, 30_000);

  it("(d) na 'Markeer besteld' (awaiting_files → sent_to_probo) is het portaal dicht", async () => {
    // De gate die markeerBesteldAction hanteert: geen pending designs meer.
    expect(await countPendingDesigns(order.id)).toBe(0);
    await advanceOrderStatus(order.id, "sent_to_probo");

    const designs = await getOrderDesigns(order.id);
    const anyDesign = Array.from(designs.values()).flat()[0];
    const dicht = await portalPOST(
      jsonRequest("http://localhost/api/portal", {
        action: "attach",
        token: order.portal_token,
        designId: anyDesign.id,
        path: uploaded[0],
      }),
    );
    expect(dicht.status).toBe(409);
  }, 30_000);

  it("(f) herbestellen reconstrueert de design-verdeling", async () => {
    const items = await getOrderItems(order.id);
    const designs = await getOrderDesigns(order.id);
    const lines = orderItemsToCartLines(items, true, designs);

    expect(lines).toHaveLength(2);
    const zes = lines.find((l) => l.amount === 6)!;
    expect(zes.designs).toHaveLength(2);
    expect(zes.designs!.reduce((s, d) => s + d.quantity, 0)).toBe(6);
    expect(zes.designs!.every((d) => d.fileUrl)).toBe(true);
  });

  it("(f) lifecycle: 4m-mail één keer, met herbestel- en uitschrijflink", async () => {
    // Verzonden, 4,5 maand geleden → in het 4m-venster, buiten het 8m-venster.
    const shippedAt = new Date();
    shippedAt.setUTCMonth(shippedAt.getUTCMonth() - 4);
    shippedAt.setUTCDate(shippedAt.getUTCDate() - 14);
    await advanceOrderStatus(order.id, "shipped", {
      shipped_at: shippedAt.toISOString(),
    });

    sentMails.length = 0;
    const eerste = await runLifecycle();
    const vierM = eerste.find((r) => r.stage === "4m")!;
    expect(vierM.sent).toBeGreaterThanOrEqual(1);

    const mail = sentMails.find((m) => m.to === CUSTOMER_EMAIL);
    expect(mail).toBeDefined();
    expect(mail!.html).toContain(`/opnieuw/${order.reorder_token}`);
    expect(mail!.html).toContain("/uitschrijven/");
    expect(mail!.tekst).not.toMatch(/100\s?%/);
    expect(mail!.tekst).toContain("96%");

    // Tweede run: dedupe, geen tweede mail voor deze order.
    sentMails.length = 0;
    await runLifecycle();
    expect(sentMails.find((m) => m.to === CUSTOMER_EMAIL)).toBeUndefined();
  }, 60_000);

  it("(f) uitschrijven (one-click) onderdrukt lifecycle-mail", async () => {
    const token = signEmailToken(CUSTOMER_EMAIL, process.env.EMAIL_LINK_SECRET!);
    const res = await unsubscribePOST(
      new Request(
        `http://localhost/api/unsubscribe?token=${encodeURIComponent(token)}`,
        { method: "POST" },
      ),
    );
    expect(res.status).toBe(200);
    expect(await isEmailSuppressed(CUSTOMER_EMAIL)).toBe(true);

    // Dedupe-event weghalen: nu zou hij WEER mogen mailen, maar de suppressie
    // moet dat tegenhouden.
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("order_events")
      .delete()
      .eq("order_id", order.id)
      .eq("event_type", "lifecycle.reorder_4m");

    sentMails.length = 0;
    const run = await runLifecycle();
    const vierM = run.find((r) => r.stage === "4m")!;
    expect(vierM.skippedSuppressed).toBeGreaterThanOrEqual(1);
    expect(sentMails.find((m) => m.to === CUSTOMER_EMAIL)).toBeUndefined();
  }, 60_000);

  it("checkout-opt-out schrijft dezelfde suppressie (idempotent)", async () => {
    await suppressEmail(CUSTOMER_EMAIL, "checkout_opt_out");
    expect(await isEmailSuppressed(CUSTOMER_EMAIL)).toBe(true);
  });
});
