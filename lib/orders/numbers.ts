/**
 * Human-facing order numbers. Format: `DV-YYYYMMDD-XXXX` where XXXX is a short
 * base36 random suffix. Generated app-side (the migration notes `order_number`
 * is app-generated with a "DV-" prefix). `orders.order_number` has a UNIQUE
 * constraint; the repository retries on collision, so this only needs to be
 * unique-enough per day.
 *
 * `now`/`rand` are injectable for deterministic tests.
 */

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

export function generateOrderNumber(now: Date = new Date(), rand: () => number = Math.random): string {
  const y = now.getUTCFullYear();
  const m = pad(now.getUTCMonth() + 1, 2);
  const d = pad(now.getUTCDate(), 2);
  // 4 base36 chars → ~1.6M combinations per day, plenty against the retry loop.
  const suffix = Math.floor(rand() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `DV-${y}${m}${d}-${suffix}`;
}
