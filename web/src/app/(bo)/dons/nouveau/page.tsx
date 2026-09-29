import { getCurrentUser } from "@/lib/auth/current-user";
import NouveauDonClient from "./nouveau-client";

export default async function NouveauDonPage() {
  const user = await getCurrentUser();
  const canOverride = Boolean(user?.roles.some((role) =>
    role.id === "role_admin" || role.id === "role_medecin"
  ));
  return <NouveauDonClient canOverride={canOverride} />;
}
