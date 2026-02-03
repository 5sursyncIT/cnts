import { authenticator } from "otplib";
import { describe, expect, it } from "vitest";

import { verifyTotp } from "./mfa";

describe("mfa", () => {
  it("verifies a generated TOTP token", () => {
    const secret = authenticator.generateSecret();
    const token = authenticator.generate(secret);
    expect(verifyTotp({ secret, token })).toBe(true);
  });
});

