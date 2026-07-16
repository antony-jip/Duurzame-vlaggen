import { describe, expect, it } from "vitest";
import { signEmailToken, verifyEmailToken } from "@/lib/email/links";

const SECRET = "test-secret";

describe("signed e-mail links", () => {
  it("round-trips an address (lowercased)", () => {
    const token = signEmailToken("Antony@SignCompany.nl", SECRET);
    expect(verifyEmailToken(token, SECRET)).toBe("antony@signcompany.nl");
  });

  it("rejects a tampered payload", () => {
    const token = signEmailToken("a@b.nl", SECRET);
    const [, mac] = token.split(".");
    const forged = `${Buffer.from("evil@b.nl").toString("base64url")}.${mac}`;
    expect(verifyEmailToken(forged, SECRET)).toBeNull();
  });

  it("rejects a wrong secret and malformed tokens", () => {
    const token = signEmailToken("a@b.nl", SECRET);
    expect(verifyEmailToken(token, "other-secret")).toBeNull();
    expect(verifyEmailToken("not-a-token", SECRET)).toBeNull();
    expect(verifyEmailToken("", SECRET)).toBeNull();
    expect(verifyEmailToken("a.b.c", SECRET)).toBeNull();
  });
});
