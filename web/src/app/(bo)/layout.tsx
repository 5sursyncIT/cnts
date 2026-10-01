import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { BackOfficeShell } from "@/components/back-office-shell";
import { buildNavigation } from "@/components/sidebar";

export default async function BackOfficeLayout(props: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <BackOfficeShell
      sections={buildNavigation(user)}
      user={{
        displayName: user.displayName,
        email: user.email,
        roleLabel: user.roles.map((r) => r.name).join(", ") || "Personnel",
      }}
    >
      {props.children}
    </BackOfficeShell>
  );
}
