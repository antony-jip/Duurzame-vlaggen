import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed e-mail links (unsubscribe). The token embeds the e-mail address and an
 * HMAC over it, so the link works without any DB lookup and cannot be forged
 * for another address:
 *
 *   token = base64url(email) + "." + hmac_sha256(email, EMAIL_LINK_SECRET)
 *
 * The secret is injected by the caller (server routes pass
 * `serverEnv.emailLinkSecret`) so this module stays importable in unit tests
 * without env plumbing.
 */

function hmacHex(email: string, secret: string): string {
  return createHmac("sha256", secret).update(email).digest("hex");
}

/** Build an unsubscribe token for an e-mail address. */
export function signEmailToken(email: string, secret: string): string {
  const normalized = email.trim().toLowerCase();
  const payload = Buffer.from(normalized, "utf8").toString("base64url");
  return `${payload}.${hmacHex(normalized, secret)}`;
}

/** Verify a token; returns the embedded e-mail address or null when invalid. */
export function verifyEmailToken(token: string, secret: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;

  let email: string;
  try {
    email = Buffer.from(token.slice(0, dot), "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!email || !email.includes("@")) return null;

  const given = token.slice(dot + 1);
  const expected = hmacHex(email, secret);
  if (given.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"))) {
      return null;
    }
  } catch {
    return null;
  }
  return email;
}
