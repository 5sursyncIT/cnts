import { redirect } from "next/navigation";

import { TopNav } from "@/components/top-nav";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function BackOfficeLayout(props: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <TopNav user={user} />
      <div className="mx-auto max-w-6xl px-4 py-6">{props.children}</div>
    </div>
  );
}

