"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
        isActive
          ? "border-l-4 border-red-500 bg-[#252a37] text-white"
          : "border-l-4 border-transparent text-gray-400 hover:bg-[#252a37] hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
