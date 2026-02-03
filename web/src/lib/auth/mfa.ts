import { authenticator } from "otplib";

export function verifyTotp(input: { secret: string; token: string }): boolean {
  authenticator.options = { window: 1 };
  const secret = input.secret.replace(/\s+/g, "");
  const token = input.token.replace(/\s+/g, "");
  return authenticator.check(token, secret);
}
