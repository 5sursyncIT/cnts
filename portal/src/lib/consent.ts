import { cookies } from "next/headers";

export async function getGdprConsent(): Promise<"accepted" | "declined" | "unset"> {
  const value = (await cookies()).get("cnts_gdpr_consent")?.value;
  if (value === "accepted") return "accepted";
  if (value === "declined") return "declined";
  return "unset";
}

