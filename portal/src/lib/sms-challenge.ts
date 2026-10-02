import "server-only";

import { cookies } from "next/headers";

// Étape SMS de l'inscription : c = jeton du backend, t = numéro masqué, e = 1 si le premier SMS n'est pas parti.
export type SmsChallenge = { c: string; t: string; e: 0 | 1 };

export const SMS_CHALLENGE_COOKIE = "cnts_portal_sms";

export async function getSmsChallenge(): Promise<SmsChallenge | null> {
  const raw = (await cookies()).get(SMS_CHALLENGE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<SmsChallenge>;
    return typeof v.c === "string" && v.c ? { c: v.c, t: String(v.t ?? ""), e: v.e === 1 ? 1 : 0 } : null;
  } catch {
    return null;
  }
}
