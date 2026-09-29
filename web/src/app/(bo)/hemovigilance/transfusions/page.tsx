import { getCurrentUser } from "@/lib/auth/current-user";
import TransfusionsClient from "./transfusions-client";

export default async function TransfusionsPage() {
  const user = await getCurrentUser();
  const canConfirm = Boolean(user?.roles.some((role) =>
    role.id === "role_admin" || role.id === "role_medecin"
  ));
  return <TransfusionsClient canConfirm={canConfirm} />;
}
