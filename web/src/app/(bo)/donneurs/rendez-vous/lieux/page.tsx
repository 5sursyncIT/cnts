import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";

import LieuxClient from "./lieux-client";

// Horaires et capacités des lieux de rendez-vous : réservé aux administrateurs (comme côté API).
export default async function LieuxRdvPage() {
  const user = await getCurrentUser();
  if (!user?.roles.some((r) => r.id === "role_admin")) redirect("/donneurs/rendez-vous");
  return <LieuxClient />;
}
