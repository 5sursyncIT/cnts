import { getCurrentUser } from "@/lib/auth/current-user";
import DonDetailClient from "./don-detail-client";

export default async function DonDetailPage() {
  const user = await getCurrentUser();
  const canManageApheresis = Boolean(user?.roles.some((role) =>
    ["role_admin", "role_technicien_labo", "role_biologiste"].includes(role.id)
  ));
  return <DonDetailClient canManageApheresis={canManageApheresis} />;
}
