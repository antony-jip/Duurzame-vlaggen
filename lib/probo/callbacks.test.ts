import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { verifyProboCallback } from "./callbacks";

/**
 * Unit tests for callback verification. No API key required.
 * We control `PROBO_SECURITY_TOKEN` per-test (test/setup.ts may have loaded it
 * from .env.local), restoring the original value afterwards.
 */

const TOKEN = "s3cret-token-value";
let original: string | undefined;

beforeEach(() => {
  original = process.env.PROBO_SECURITY_TOKEN;
});

afterEach(() => {
  if (original === undefined) delete process.env.PROBO_SECURITY_TOKEN;
  else process.env.PROBO_SECURITY_TOKEN = original;
});

describe("verifyProboCallback", () => {
  it("accepts a matching token (plain object header)", () => {
    process.env.PROBO_SECURITY_TOKEN = TOKEN;
    const result = verifyProboCallback({ "X-Security-Header": TOKEN });
    expect(result).toEqual({ valid: true, configured: true });
  });

  it("accepts a matching token (Headers, case-insensitive lookup)", () => {
    process.env.PROBO_SECURITY_TOKEN = TOKEN;
    const headers = new Headers({ "x-security-header": TOKEN });
    expect(verifyProboCallback(headers)).toEqual({
      valid: true,
      configured: true,
    });
  });

  it("does a case-insensitive lookup on plain-object keys", () => {
    process.env.PROBO_SECURITY_TOKEN = TOKEN;
    const result = verifyProboCallback({ "x-SECURITY-header": TOKEN });
    expect(result).toEqual({ valid: true, configured: true });
  });

  it("rejects a mismatching token", () => {
    process.env.PROBO_SECURITY_TOKEN = TOKEN;
    const result = verifyProboCallback({ "X-Security-Header": "wrong" });
    expect(result).toEqual({ valid: false, configured: true });
  });

  it("rejects when the header is absent", () => {
    process.env.PROBO_SECURITY_TOKEN = TOKEN;
    expect(verifyProboCallback({})).toEqual({
      valid: false,
      configured: true,
    });
  });

  it("rejects a token that is a prefix of the expected (length guard)", () => {
    process.env.PROBO_SECURITY_TOKEN = TOKEN;
    const result = verifyProboCallback({ "X-Security-Header": TOKEN.slice(0, 5) });
    expect(result).toEqual({ valid: false, configured: true });
  });

  it("passes through in dev mode when no token is configured", () => {
    delete process.env.PROBO_SECURITY_TOKEN;
    expect(verifyProboCallback({ "X-Security-Header": "anything" })).toEqual({
      valid: true,
      configured: false,
    });
  });

  it("treats an empty-string token as unconfigured", () => {
    process.env.PROBO_SECURITY_TOKEN = "";
    expect(verifyProboCallback({})).toEqual({
      valid: true,
      configured: false,
    });
  });
});
