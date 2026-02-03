import { cookies } from "next/headers";

import { sessionCookieName, verifySessionToken } from "./session";

export async function getCurrentPatient() {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

