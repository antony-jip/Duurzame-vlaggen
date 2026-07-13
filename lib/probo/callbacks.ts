import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * Verification of inbound Probo status callbacks.
 *
 * Probo signs each callback with a shared secret sent in the `X-Security-Header`
 * request header. We compare it to `PROBO_SECURITY_TOKEN` using a constant-time
 * comparison to avoid leaking the token via timing.
 *
 * We read `process.env.PROBO_SECURITY_TOKEN` DIRECTLY (not `serverEnv`, whose
 * getter throws when the var is empty) so that a missing token degrades to a
 * dev-mode pass-through instead of crashing the webhook handler.
 */

/** The header Probo sends the shared secret in (case-insensitive lookup). */
const SECURITY_HEADER = "x-security-header";

export interface VerifyProboCallbackResult {
  /** Whether the callback is trusted. `true` in dev mode when unconfigured. */
  valid: boolean;
  /** Whether a `PROBO_SECURITY_TOKEN` is configured. */
  configured: boolean;
}

/** Case-insensitive header lookup for both `Headers` and plain objects. */
function readHeader(
  headers: Headers | Record<string, string>,
  name: string,
): string | null {
  if (headers instanceof Headers) {
    return headers.get(name);
  }
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) return value;
  }
  return null;
}

/** Constant-time string comparison with a length guard. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // timingSafeEqual throws on length mismatch; guard first (unequal lengths
  // already mean a mismatch, so no timing signal is leaked here).
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify a Probo callback's security header.
 *
 * - No `PROBO_SECURITY_TOKEN` configured → `{ valid: true, configured: false }`
 *   (dev mode: accept, but the caller SHOULD log a warning).
 * - Configured → `{ valid: <token matches header>, configured: true }`.
 */
export function verifyProboCallback(
  headers: Headers | Record<string, string>,
): VerifyProboCallbackResult {
  const expected = process.env.PROBO_SECURITY_TOKEN;
  if (!expected) {
    return { valid: true, configured: false };
  }
  const received = readHeader(headers, SECURITY_HEADER);
  const valid = received !== null && safeEqual(expected, received);
  return { valid, configured: true };
}
