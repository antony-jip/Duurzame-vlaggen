import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock VIES so unit tests never hit the network.
vi.mock("@/lib/vat/vies", () => ({
  validateVatNumber: vi.fn(),
}));

import { computeVat } from "@/lib/vat";
import { displayRateForMarket, marketToCountry, standardRateForCountry } from "@/lib/vat/rates";
import { validateVatNumber } from "@/lib/vat/vies";

const mockedValidate = vi.mocked(validateVatNumber);

describe("marketToCountry", () => {
  it("maps each market to its country", () => {
    expect(marketToCountry("nl-NL")).toBe("NL");
    expect(marketToCountry("nl-BE")).toBe("BE");
    expect(marketToCountry("de-DE")).toBe("DE");
    expect(marketToCountry("fr-FR")).toBe("FR");
  });

  it("returns null for the country-indeterminate en/.com market", () => {
    expect(marketToCountry("en")).toBeNull();
  });
});

describe("standardRateForCountry", () => {
  it("returns configured rates", () => {
    expect(standardRateForCountry("NL")).toBe(21);
    expect(standardRateForCountry("BE")).toBe(21);
    expect(standardRateForCountry("DE")).toBe(19);
    expect(standardRateForCountry("FR")).toBe(20);
  });

  it("returns null for an unconfigured country", () => {
    expect(standardRateForCountry("US")).toBeNull();
  });
});

describe("computeVat", () => {
  beforeEach(() => {
    mockedValidate.mockReset();
  });

  it("(a) NL consumer → 21%, no reverse charge, no VIES call", async () => {
    const result = await computeVat({ isBusiness: false, market: "nl-NL" });

    expect(result).toEqual({ rate: 21, reverseCharge: false, vatNumberValid: null });
    expect(mockedValidate).not.toHaveBeenCalled();
  });

  it("(b) DE B2B with a valid VIES number → 0% reverse charge", async () => {
    mockedValidate.mockResolvedValue({ valid: true, raw: {} });

    const result = await computeVat({
      isBusiness: true,
      vatNumber: "DE123456789",
      market: "de-DE",
    });

    expect(result).toEqual({ rate: 0, reverseCharge: true, vatNumberValid: true });
    expect(mockedValidate).toHaveBeenCalledWith("DE", "DE123456789");
  });

  it("(b2) DE B2B with an INVALID VIES number → falls back to 19%, no reverse charge", async () => {
    mockedValidate.mockResolvedValue({ valid: false, raw: {} });

    const result = await computeVat({
      isBusiness: true,
      vatNumber: "DE000000000",
      market: "de-DE",
    });

    expect(result).toEqual({ rate: 19, reverseCharge: false, vatNumberValid: false });
  });

  it("(c) DE B2C → 19%", async () => {
    const result = await computeVat({ isBusiness: false, market: "de-DE" });

    expect(result).toEqual({ rate: 19, reverseCharge: false, vatNumberValid: null });
    expect(mockedValidate).not.toHaveBeenCalled();
  });

  it("(d) non-EU shipping country → 0% export, no reverse charge", async () => {
    const result = await computeVat({
      isBusiness: false,
      market: "nl-NL",
      shippingCountry: "US",
    });

    expect(result).toEqual({ rate: 0, reverseCharge: false, vatNumberValid: null });
    expect(mockedValidate).not.toHaveBeenCalled();
  });

  it("does not reverse-charge a domestic (NL→NL) B2B sale even with a valid number", async () => {
    mockedValidate.mockResolvedValue({ valid: true, raw: {} });

    const result = await computeVat({
      isBusiness: true,
      vatNumber: "NL810433941B01",
      market: "nl-NL",
    });

    expect(result).toEqual({ rate: 21, reverseCharge: false, vatNumberValid: true });
  });

  it("treats VIES-unknown (null) as no reverse charge, still charges destination VAT", async () => {
    mockedValidate.mockResolvedValue({ valid: null, raw: null });

    const result = await computeVat({
      isBusiness: true,
      vatNumber: "DE123456789",
      market: "de-DE",
    });

    expect(result).toEqual({ rate: 19, reverseCharge: false, vatNumberValid: null });
  });

  it("shippingCountry overrides the market-derived country", async () => {
    const result = await computeVat({
      isBusiness: false,
      market: "nl-NL",
      shippingCountry: "FR",
    });

    expect(result).toEqual({ rate: 20, reverseCharge: false, vatNumberValid: null });
  });
});

describe("displayRateForMarket", () => {
  it("shows each market its own standard rate", () => {
    expect(displayRateForMarket("nl-NL")).toBe(21);
    expect(displayRateForMarket("nl-BE")).toBe(21);
    expect(displayRateForMarket("de-DE")).toBe(19);
    expect(displayRateForMarket("fr-FR")).toBe(20);
  });

  it("falls back to the seller country for the country-indeterminate en/.com market", () => {
    expect(displayRateForMarket("en")).toBe(21);
  });

  // De reden dat deze helper bestaat: het tarief op de pagina moet gelijk zijn
  // aan wat de checkout een gewone B2C-bezoeker rekent. Liep dit uiteen, dan zag
  // een Duitse bezoeker 21% en betaalde hij 19%.
  it("matches what computeVat charges a plain B2C visitor on the same market", async () => {
    for (const market of ["nl-NL", "nl-BE", "de-DE", "fr-FR", "en"] as const) {
      const charged = await computeVat({ isBusiness: false, market });
      expect(displayRateForMarket(market)).toBe(charged.rate);
    }
  });
});
