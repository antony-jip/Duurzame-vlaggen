import { afterAll, describe, expect, it } from "vitest";

/**
 * End-to-end van de betaalflow tegen een lokale mock-Mollie: order aanmaken
 * (echte Supabase), betaling aanmaken (mock valideert de payload, streng voor
 * Billie), webhook-afhandeling en statusovergangen.
 *
 * Draait ALLEEN wanneer MOLLIE_BASE_URL naar localhost wijst (de mock uit
 * scratchpad/mock-mollie.mjs); in de gewone suite wordt hij geskipt zodat er
 * geen testorders in de database belanden en niets het echte Mollie raakt.
 *
 *   node mock-mollie.mjs &   # poort 3200
 *   MOLLIE_BASE_URL=http://localhost:3200/v2 npx vitest run lib/orders/flow.e2e.test.ts
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

  it("factuur-route: Billie-betaling met valide adres en regels", async () => {
    const { placeOrder, handleMolliePayment } = await import("./orchestration");
    const { getOrderById } = await import("./repository");

    const resultaat = await placeOrder({
      market: "nl-NL",
      email: "flowtest-zakelijk@example.com",
      isBusiness: true,
      vatNumber: "NL006284267B01",
      paymentMethod: "billie",
      billingAddress: {
        company_name: "Sign Company VOF",
        first_name: "Antony",
        last_name: "Bootsma",
        street: "De Drie Kronen",
        house_number: "115",
        postal_code: "1601 MT",
        city: "Enkhuizen",
        country: "NL",
      },
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
          productType: "baniervlag",
          productName: "Baniervlag",
          options: [],
          amount: 3,
          sizeLabel: "100 × 300 cm",
          selections: {
            Formaat: "100 × 300 cm",
            Ontwerpservice: "Ja (+€ 85,00)",
          },
          designs: [],
        },
        {
          proboProductCode: "facade-flag",
          productType: "gevelvlag",
          productName: "Gevelvlag",
          options: [],
          amount: 1,
          sizeLabel: "100 × 70 cm",
          selections: { Formaat: "100 × 70 cm" },
          designs: [{ quantity: 1, fileUrl: null }],
        },
      ],
    });
    aangemaakteOrders.push(resultaat.order.id);

    // De mock keurt de Billie-payload streng (adres, regels, sommen); een
    // checkout-URL betekent dus dat onze payload klopt.
    expect(resultaat.checkoutUrl).toMatch(/^http:\/\/localhost:3200\/checkout\//);
    const paymentId = resultaat.order.mollie_payment_id as string;

    // De aangemaakte betaling is echt een Billie-betaling met regels.
    const betaling = (await (
      await fetch(`http://localhost:3200/v2/payments/${paymentId}`)
    ).json()) as {
      method: string;
      request: { lines: unknown[]; billingAddress: { organizationName: string } };
    };
    expect(betaling.method).toBe("billie");
    expect(betaling.request.billingAddress.organizationName).toBe(
      "Sign Company VOF",
    );
    // 2 productregels + ontwerpservice + verzendkosten? (gratis boven €100:
    // dit totaal zit erboven, dus geen verzendregel) → 3 regels.
    expect(betaling.request.lines.length).toBe(3);

    await fetch(`http://localhost:3200/flip/${paymentId}/paid`, {
      method: "POST",
    });
    await handleMolliePayment(paymentId);
    // Regel 2 heeft een later-slot → awaiting_files na betaling.
    expect((await getOrderById(resultaat.order.id))?.status).toBe(
      "awaiting_files",
    );
  });

  it("factuur-route: overboeking met vervaldatum, klant naar orderpagina", async () => {
    const { placeOrder, handleMolliePayment } = await import("./orchestration");
    const { getOrderById } = await import("./repository");

    const resultaat = await placeOrder({
      market: "nl-NL",
      email: "flowtest-factuur@example.com",
      isBusiness: true,
      vatNumber: "NL006284267B01",
      paymentMethod: "factuur",
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

    const paymentId = resultaat.order.mollie_payment_id as string;
    const betaling = (await (
      await fetch(`http://localhost:3200/v2/payments/${paymentId}`)
    ).json()) as { method: string; request: { dueDate: string } };
    expect(betaling.method).toBe("banktransfer");
    // Vervaldatum 14 dagen vooruit (dagnauwkeurig, tijdzone-tolerant).
    const verwacht = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    expect(betaling.request.dueDate).toBe(verwacht);

    // Overboeking komt binnen → webhook → paid → awaiting_files (later-slot).
    await fetch(`http://localhost:3200/flip/${paymentId}/paid`, {
      method: "POST",
    });
    await handleMolliePayment(paymentId);
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
