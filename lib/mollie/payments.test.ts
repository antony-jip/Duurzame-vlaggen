import { describe, expect, it } from "vitest";

import { toMollieAmount } from "./client";
import { parseWebhookBody } from "./payments";

describe("toMollieAmount", () => {
  it("formats whole euros with two decimals", () => {
    expect(toMollieAmount(1)).toEqual({ value: "1.00", currency: "EUR" });
  });

  it("formats fractional euros with two decimals", () => {
    expect(toMollieAmount(10.5)).toEqual({ value: "10.50", currency: "EUR" });
  });

  it("honours a custom currency", () => {
    expect(toMollieAmount(2, "USD")).toEqual({ value: "2.00", currency: "USD" });
  });

  it("normalises negative zero to 0.00", () => {
    expect(toMollieAmount(-0)).toEqual({ value: "0.00", currency: "EUR" });
  });

  it("throws on a non-finite amount", () => {
    expect(() => toMollieAmount(Number.NaN)).toThrow();
  });
});

describe("parseWebhookBody", () => {
  it("extracts the payment id from a form-urlencoded body", () => {
    expect(parseWebhookBody("id=tr_abc")).toEqual({ id: "tr_abc" });
  });

  it("throws on an empty body", () => {
    expect(() => parseWebhookBody("")).toThrow();
  });

  it("throws when id is absent", () => {
    expect(() => parseWebhookBody("foo=bar")).toThrow();
  });
});
