import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  href?: string;
}) {
  const tones = {
    neutral: "bg-gray-100 text-gray-600",
    info: "bg-blue-50 text-blue-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
  };
  // Seule une alerte (warning) colore la valeur ; les autres tons ne teintent que l'icône.
  const valueTone = tone === "warning" ? "text-amber-700" : "text-gray-900";
  const body = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-gray-600">{label}</p>
        <p className={cn("mt-1 text-2xl font-semibold tabular-nums", valueTone)}>{value}</p>
        {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
      </div>
      {icon ? <div className={cn("hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:flex", tones[tone])}>{icon}</div> : null}
    </div>
  );
  const cls = "block rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-blue-300")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
