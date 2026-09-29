import { hasPermission } from "@cnts/rbac";
import { getCurrentUser } from "@/lib/auth/current-user";
import LiberationClient from "./liberation-client";

export default async function LiberationPage() {
  const user = await getCurrentUser();
  const canValidate = Boolean(user && hasPermission({
    user, permission: { module: "liberation", action: "validate" },
  }));
  return <LiberationClient canValidate={canValidate} />;
}
