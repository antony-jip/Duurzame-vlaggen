import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

/**
 * Mock-Mollie voor de flow-e2e (lib/orders/flow.e2e.test.ts).
 *
 * Implementeert het stukje Mollie dat de shop raakt, en valideert de payloads
 * streng zodat de test iets bewijst:
 *
 *   POST /v2/payments            → tr_mock…, status open, checkout-URL
 *   GET  /v2/payments/:id
 *   POST /v2/payment-links       → pl_mock…, _links.paymentLink (géén metadata:
 *                                  de echte Payment Links API kent dat veld niet)
 *   GET  /v2/payment-links/:id
 *   POST /flip/:id/:status       → testknop: zet een betaling op paid/failed/…
 *   POST /pay-link/:id           → testknop: "klant betaalt de link" — maakt de
 *                                  onderliggende betaling (tr_…) aan als paid en
 *                                  geeft { paymentId } terug, zoals Mollie de
 *                                  webhook met dat betalings-id zou aanroepen
 *
 * Start: `node test/mock-mollie.mjs` (poort 3200), daarna
 * `MOLLIE_BASE_URL=http://localhost:3200/v2 npx vitest run lib/orders/flow.e2e.test.ts`.
 */

const POORT = 3200;
const payments = new Map();
const paymentLinks = new Map();

const id = (prefix) => `${prefix}_mock${randomBytes(8).toString("hex")}`;

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function fout(res, status, detail) {
  json(res, status, { status, title: "Mock-Mollie", detail });
}

const AMOUNT_RE = /^\d+\.\d{2}$/;

function valideerAmount(res, amount) {
  if (!amount || typeof amount.value !== "string" || !AMOUNT_RE.test(amount.value)) {
    fout(res, 422, "amount.value moet een string met twee decimalen zijn");
    return false;
  }
  if (typeof amount.currency !== "string" || amount.currency.length !== 3) {
    fout(res, 422, "amount.currency moet een ISO-4217-code zijn");
    return false;
  }
  return true;
}

async function leesBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${POORT}`);
  const delen = url.pathname.split("/").filter(Boolean);

  try {
    // --- Betalingen -------------------------------------------------------
    if (req.method === "POST" && url.pathname === "/v2/payments") {
      const body = await leesBody(req);
      if (!valideerAmount(res, body.amount)) return;
      if (!body.description) return fout(res, 422, "description is verplicht");
      if (!body.redirectUrl) return fout(res, 422, "redirectUrl is verplicht");
      const paymentId = id("tr");
      const payment = {
        id: paymentId,
        status: "open",
        amount: body.amount,
        metadata: body.metadata ?? null,
        request: body,
        _links: { checkout: { href: `http://localhost:${POORT}/checkout/${paymentId}` } },
      };
      payments.set(paymentId, payment);
      return json(res, 201, payment);
    }

    if (req.method === "GET" && delen[0] === "v2" && delen[1] === "payments" && delen[2]) {
      const payment = payments.get(delen[2]);
      if (!payment) return fout(res, 404, "Onbekende betaling");
      return json(res, 200, payment);
    }

    // --- Betaallinks ------------------------------------------------------
    if (req.method === "POST" && url.pathname === "/v2/payment-links") {
      const body = await leesBody(req);
      if (!valideerAmount(res, body.amount)) return;
      if (!body.description) return fout(res, 422, "description is verplicht");
      // De echte Payment Links API kent geen metadata/method; streng blijven.
      if ("metadata" in body) return fout(res, 422, "payment-links kennen geen metadata");
      if ("method" in body) return fout(res, 422, "payment-links kennen geen method");
      const linkId = id("pl");
      const link = {
        id: linkId,
        description: body.description,
        amount: body.amount,
        paidAt: null,
        expiresAt: body.expiresAt ?? null,
        request: body,
        _links: { paymentLink: { href: `http://localhost:${POORT}/betaallink/${linkId}` } },
      };
      paymentLinks.set(linkId, link);
      return json(res, 201, link);
    }

    if (req.method === "GET" && delen[0] === "v2" && delen[1] === "payment-links" && delen[2]) {
      const link = paymentLinks.get(delen[2]);
      if (!link) return fout(res, 404, "Onbekende betaallink");
      return json(res, 200, link);
    }

    // --- Testknoppen ------------------------------------------------------
    if (req.method === "POST" && delen[0] === "flip" && delen[1] && delen[2]) {
      const payment = payments.get(delen[1]);
      if (!payment) return fout(res, 404, "Onbekende betaling");
      payment.status = delen[2];
      return json(res, 200, payment);
    }

    if (req.method === "POST" && delen[0] === "pay-link" && delen[1]) {
      const link = paymentLinks.get(delen[1]);
      if (!link) return fout(res, 404, "Onbekende betaallink");
      // Klant betaalt de link: onderliggende betaling ontstaat als paid, en de
      // status ervan kan daarna nog met /flip worden bijgesteld.
      const status = url.searchParams.get("status") ?? "paid";
      const paymentId = id("tr");
      payments.set(paymentId, {
        id: paymentId,
        status,
        amount: link.amount,
        metadata: null,
        request: { viaPaymentLink: link.id },
        _links: {},
      });
      if (status === "paid") link.paidAt = new Date().toISOString();
      return json(res, 200, { paymentId, paymentLinkId: link.id });
    }

    return fout(res, 404, `Geen route voor ${req.method} ${url.pathname}`);
  } catch (err) {
    return fout(res, 500, String(err));
  }
});

server.listen(POORT, () => {
  console.log(`mock-mollie luistert op http://localhost:${POORT}`);
});
