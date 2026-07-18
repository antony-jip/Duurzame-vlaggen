import { describe, expect, it } from "vitest";
import {
  billieBeschikbaarVoorLand,
  billieRegels,
  naarMollieAdres,
} from "./billie";
import type { Quote } from "./orchestration";

/**
 * Minimale quote voor de regel-opbouw. Alleen de velden die billieRegels
 * uitleest; de rest van het Quote-type doet hier niet mee.
 */
function maakQuote(overrides: {
  lines: Array<{ amount: number; naam: string; maat?: string; prijs: number }>;
  designService?: number;
  shippingCost?: number;
  rate?: number;
}): Quote {
  const rate = overrides.rate ?? 21;
  const designService = overrides.designService ?? 0;
  const shippingCost = overrides.shippingCost ?? 0;
  const subtotalExVat =
    overrides.lines.reduce((sum, l) => sum + l.prijs, 0) + designService;
  const vatAmount =
    Math.round((subtotalExVat + shippingCost) * rate) / 100;
  const total =
    Math.round((subtotalExVat + shippingCost + vatAmount) * 100) / 100;
  return {
    currency: "EUR",
    designService,
    vat: { rate } as Quote["vat"],
    totals: { subtotalExVat, shippingCost, vatAmount, total },
    lines: overrides.lines.map((l) => ({
      draft: {
        amount: l.amount,
        productName: l.naam,
        sizeLabel: l.maat,
      },
      linePrice: l.prijs,
    })),
  } as unknown as Quote;
}

describe("billieRegels", () => {
  it("telt exact op tot het ordertotaal, ook met afrondingsverschillen", () => {
    const quote = maakQuote({
      // Prijzen gekozen op btw-afronding per regel (x,xx5-gevallen).
      lines: [
        { amount: 3, naam: "Baniervlag", maat: "100 × 300 cm", prijs: 114.0 },
        { amount: 1, naam: "Gevelvlag", maat: "100 × 70 cm", prijs: 17.5 },
        { amount: 2, naam: "Mastvlag", maat: "225 × 150 cm", prijs: 103.05 },
      ],
      designService: 85,
      shippingCost: 7.5,
    });
    const regels = billieRegels(quote);

    const somIncl = regels.reduce(
      (sum, r) => sum + Number(r.totalAmount.value),
      0,
    );
    const somVat = regels.reduce(
      (sum, r) => sum + Number(r.vatAmount.value),
      0,
    );
    expect(somIncl).toBeCloseTo(quote.totals.total, 2);
    expect(somVat).toBeCloseTo(quote.totals.vatAmount, 2);
    // unitPrice × quantity moet gelijk zijn aan totalAmount (Mollie-eis).
    for (const regel of regels) {
      expect(regel.quantity).toBe(1);
      expect(regel.unitPrice.value).toBe(regel.totalAmount.value);
    }
    expect(regels.map((r) => r.description)).toEqual([
      "3× Baniervlag (100 × 300 cm)",
      "1× Gevelvlag (100 × 70 cm)",
      "2× Mastvlag (225 × 150 cm)",
      "Ontwerpservice",
      "Verzendkosten",
    ]);
  });

  it("laat ontwerpservice en verzending weg wanneer ze nul zijn", () => {
    const quote = maakQuote({
      lines: [{ amount: 1, naam: "Beachvlag", prijs: 120 }],
    });
    const regels = billieRegels(quote);
    expect(regels).toHaveLength(1);
    expect(Number(regels[0].totalAmount.value)).toBeCloseTo(
      quote.totals.total,
      2,
    );
  });

  it("werkt met btw verlegd (0%)", () => {
    const quote = maakQuote({
      lines: [{ amount: 5, naam: "Baniervlag", prijs: 190 }],
      rate: 0,
      shippingCost: 7.5,
    });
    const regels = billieRegels(quote);
    const somIncl = regels.reduce(
      (sum, r) => sum + Number(r.totalAmount.value),
      0,
    );
    expect(somIncl).toBeCloseTo(197.5, 2);
    for (const regel of regels) {
      expect(regel.vatAmount.value).toBe("0.00");
      expect(regel.vatRate).toBe("0.00");
    }
  });
});

describe("naarMollieAdres", () => {
  it("vertaalt een Probo-adres inclusief bedrijfsnaam en samengestelde straat", () => {
    expect(
      naarMollieAdres(
        {
          company_name: "Sign Company VOF",
          first_name: "Antony",
          last_name: "Bootsma",
          street: "De Drie Kronen",
          house_number: "115",
          addition: "A",
          postal_code: "1601 MT",
          city: "Enkhuizen",
          country: "nl",
        },
        "test@example.com",
      ),
    ).toEqual({
      organizationName: "Sign Company VOF",
      givenName: "Antony",
      familyName: "Bootsma",
      email: "test@example.com",
      streetAndNumber: "De Drie Kronen 115 A",
      postalCode: "1601 MT",
      city: "Enkhuizen",
      country: "NL",
    });
  });
});

describe("billieBeschikbaarVoorLand", () => {
  it("kent de Billie-eurolanden en wijst de rest af", () => {
    expect(billieBeschikbaarVoorLand("NL")).toBe(true);
    expect(billieBeschikbaarVoorLand("de")).toBe(true);
    expect(billieBeschikbaarVoorLand("BE")).toBe(false);
    expect(billieBeschikbaarVoorLand(undefined)).toBe(false);
  });
});
