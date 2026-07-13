import { describe, expect, it } from "vitest";
import { generateOrderNumber } from "@/lib/orders/numbers";

describe("generateOrderNumber", () => {
  it("formats as DV-YYYYMMDD-XXXX", () => {
    const n = generateOrderNumber(new Date("2026-07-13T10:00:00Z"), () => 0.5);
    expect(n).toMatch(/^DV-\d{8}-[0-9A-Z]{4}$/);
    expect(n.startsWith("DV-20260713-")).toBe(true);
  });

  it("uses UTC date parts", () => {
    // 23:30 UTC stays on the 13th regardless of local tz.
    const n = generateOrderNumber(new Date("2026-07-13T23:30:00Z"), () => 0);
    expect(n).toBe("DV-20260713-0000");
  });

  it("varies the suffix with the random source", () => {
    const a = generateOrderNumber(new Date("2026-07-13T10:00:00Z"), () => 0.1);
    const b = generateOrderNumber(new Date("2026-07-13T10:00:00Z"), () => 0.9);
    expect(a).not.toBe(b);
  });
});
