import { describe, expect, it } from "vitest";
import { LIFECYCLE_STAGES, monthsBefore, stageWindow } from "@/lib/orders/lifecycle";

describe("lifecycle stage windows", () => {
  const now = new Date("2026-07-16T08:00:00.000Z");

  it("defines the 4- and 8-month stages", () => {
    expect(LIFECYCLE_STAGES.map((s) => s.stage)).toEqual(["4m", "8m"]);
    expect(LIFECYCLE_STAGES.map((s) => s.eventType)).toEqual([
      "lifecycle.reorder_4m",
      "lifecycle.reorder_8m",
    ]);
  });

  it("subtracts calendar months in UTC", () => {
    expect(monthsBefore(now, 4).toISOString()).toBe("2026-03-16T08:00:00.000Z");
    expect(monthsBefore(now, 8).toISOString()).toBe("2025-11-16T08:00:00.000Z");
  });

  it("uses a one-month catch-up window per stage", () => {
    const w4 = stageWindow(LIFECYCLE_STAGES[0], now);
    expect(w4.from.toISOString()).toBe("2026-02-16T08:00:00.000Z");
    expect(w4.to.toISOString()).toBe("2026-03-16T08:00:00.000Z");

    const w8 = stageWindow(LIFECYCLE_STAGES[1], now);
    expect(w8.from.toISOString()).toBe("2025-10-16T08:00:00.000Z");
    expect(w8.to.toISOString()).toBe("2025-11-16T08:00:00.000Z");
  });

  it("an order shipped exactly 4 months ago falls inside the 4m window edge", () => {
    const w4 = stageWindow(LIFECYCLE_STAGES[0], now);
    const shippedAt = new Date("2026-03-15T12:00:00.000Z");
    expect(shippedAt >= w4.from && shippedAt < w4.to).toBe(true);
    // Shipped yesterday → not yet in the window.
    const fresh = new Date("2026-07-15T12:00:00.000Z");
    expect(fresh >= w4.from && fresh < w4.to).toBe(false);
  });
});
