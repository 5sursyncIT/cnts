import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default async function BackOfficeLayout(props: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden h-screen">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-8 bg-[#f3f4f6]">
          {props.children}
        </main>
      </div>
    </div>
  );
}
