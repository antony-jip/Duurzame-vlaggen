import { afterAll, describe, expect, it } from "vitest";

/**
 * End-to-end van de betaalflow tegen een lokale mock-Mollie: order aanmaken
 * (echte Supabase), betaling of betaallink aanmaken (de mock valideert de
 * payloads), webhook-afhandeling en statusovergangen.
 *
 * Draait ALLEEN wanneer MOLLIE_BASE_URL naar localhost wijst (de mock uit
 * test/mock-mollie.mjs); in de gewone suite wordt hij geskipt zodat er
 * geen testorders in de database belanden en niets het echte Mollie raakt.
 * De op-rekening-case vereist bovendien dat migratie 20260718110000
 * (betaallink-kolommen) op de test-DB staat.
 *
 *   node test/mock-mollie.mjs &   # poort 3200
 *   RESEND_API_KEY= MOLLIE_BASE_URL=http://localhost:3200/v2 \
 *     npx vitest run lib/orders/flow.e2e.test.ts
 *
 * (RESEND_API_KEY leeg → de factuurmail wordt netjes overgeslagen in plaats
 * van echt verstuurd.)
 */

const mockActief = (process.env.MOLLIE_BASE_URL ?? "").includes("localhost");
const beschrijf = mockActief ? describe : describe.skip;

const aangemaakteOrders: string[] = [];

beschrijf("betaalflow (mock-Mollie)", () => {
  it("iDEAL-route: order → betaling → webhook → paid", async () => {
    const { placeOrder, handleMolliePayment } = await import("./orchestration");
    const { getOrderById } = await import("./repository");

    const resultaat = await placeOrder({
      market: "nl-NL",
      email: "flowtest@example.com",
      isBusiness: false,
      shippingAddress: {
        first_name: "Flow",
        last_name: "Test",
        street: "Teststraat",
        house_number: "1",
        postal_code: "1601 MT",
        city: "Enkhuizen",
        country: "NL",
      },
      items: [
        {
          proboProductCode: "facade-flag",
          productType: "gevelvlag",
          productName: "Gevelvlag",
          options: [],
          amount: 2,
          sizeLabel: "100 × 70 cm",
          selections: { Formaat: "100 × 70 cm" },
          designs: [{ quantity: 2, fileUrl: null }],
        },
      ],
    });
    aangemaakteOrders.push(resultaat.order.id);

    // Betaling aangemaakt bij (mock-)Mollie, order wacht op betaling.
    expect(resultaat.checkoutUrl).toMatch(/^http:\/\/localhost:3200\/checkout\//);
    expect(resultaat.order.status).toBe("awaiting_payment");
    expect(resultaat.order.mollie_payment_id).toMatch(/^tr_mock/);

    const paymentId = resultaat.order.mollie_payment_id as string;

    // Webhook terwijl de betaling nog open staat: status blijft staan.
    await handleMolliePayment(paymentId);
    expect((await getOrderById(resultaat.order.id))?.status).toBe(
      "awaiting_payment",
    );

    // Klant betaalt → webhook → paid; en omdat het ontwerp "later aanleveren"
    // is, parkeert de order daarna op awaiting_files.
    await fetch(`http://localhost:3200/flip/${paymentId}/paid`, {
      method: "POST",
    });
    await handleMolliePayment(paymentId);
    expect((await getOrderById(resultaat.order.id))?.status).toBe(
      "awaiting_files",
    );

    // Idempotent: dezelfde webhook nog eens verandert niets.
    await handleMolliePayment(paymentId);
    expect((await getOrderById(resultaat.order.id))?.status).toBe(
      "awaiting_files",
    );
  });

  it("op-rekening-route: betaallink, klant naar orderpagina, webhook via hint", async () => {
    const { placeOrder, handleMolliePayment } = await import("./orchestration");
    const { getOrderById } = await import("./repository");

    const resultaat = await placeOrder({
      market: "nl-NL",
      email: "flowtest-oprekening@example.com",
      isBusiness: true,
      vatNumber: "NL006284267B01",
      paymentMethod: "op_rekening",
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
          amount: 4,
          sizeLabel: "225 × 150 cm",
          selections: { Formaat: "225 × 150 cm" },
          designs: [{ quantity: 4, fileUrl: null }],
        },
      ],
    });
    aangemaakteOrders.push(resultaat.order.id);

    // De klant gaat naar de orderbevestiging; de betaallink zit in de factuur.
    expect(resultaat.checkoutUrl).toBe(
      `http://localhost:3000/order/${resultaat.order.id}`,
    );
    expect(resultaat.order.status).toBe("awaiting_payment");
    // Betaallink aangemaakt; nog géén betaling (die ontstaat pas als de klant
    // de link gebruikt).
    expect(resultaat.order.mollie_payment_link_id).toMatch(/^pl_mock/);
    expect(resultaat.order.mollie_payment_link_url).toMatch(
      /^http:\/\/localhost:3200\/betaallink\//,
    );
    expect(resultaat.order.mollie_payment_id).toBeNull();

    const linkId = resultaat.order.mollie_payment_link_id as string;

    // Mislukte poging op de link: de order blijft gewoon wachten (de link
    // blijft geldig; de klant probeert het later opnieuw).
    const mislukt = (await (
      await fetch(`http://localhost:3200/pay-link/${linkId}?status=failed`, {
        method: "POST",
      })
    ).json()) as { paymentId: string };
    await handleMolliePayment(mislukt.paymentId, resultaat.order.id);
    expect((await getOrderById(resultaat.order.id))?.status).toBe(
      "awaiting_payment",
    );

    // Klant betaalt de link → Mollie roept de webhook aan met het id van de
    // onderliggende betaling en ?order=<id> → paid → awaiting_files
    // (later-slot). De betaling wordt alsnog op de order vastgelegd.
    const betaald = (await (
      await fetch(`http://localhost:3200/pay-link/${linkId}`, { method: "POST" })
    ).json()) as { paymentId: string };
    await handleMolliePayment(betaald.paymentId, resultaat.order.id);

    const na = await getOrderById(resultaat.order.id);
    expect(na?.status).toBe("awaiting_files");
    expect(na?.mollie_payment_id).toBe(betaald.paymentId);

    // Idempotent: dezelfde webhook nog eens verandert niets.
    await handleMolliePayment(betaald.paymentId, resultaat.order.id);
    expect((await getOrderById(resultaat.order.id))?.status).toBe(
      "awaiting_files",
    );
  });
});

afterAll(async () => {
  if (!mockActief) return;
  const { deleteOrder } = await import("./repository");
  for (const id of aangemaakteOrders) {
    await deleteOrder(id).catch(() => {});
  }
});
