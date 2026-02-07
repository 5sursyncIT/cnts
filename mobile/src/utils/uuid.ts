import * as Crypto from "expo-crypto";

/** Generate a UUID v4 for idempotency keys and local IDs. */
export function generateUUID(): string {
  return Crypto.randomUUID();
}
