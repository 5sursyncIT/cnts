import * as React from "react";

import { cn } from "@/lib/utils";

/** Tableau de données homogène : défilement horizontal sur petit écran. */
export function Table({ className, children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-left text-sm", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-gray-200 bg-gray-50/80">{children}</thead>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

export function Th({ className, align, ...props }: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-gray-50", className)} {...props} />;
}

export function Td({ className, align, ...props }: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <td
      className={cn("px-4 py-3 text-gray-800", align === "right" && "text-right", align === "center" && "text-center", className)}
      {...props}
    />
  );
}

/** Pied de tableau avec pagination simple (l'API ne renvoie pas de total). */
export function Pagination({
  page,
  hasNext,
  onPrev,
  onNext,
  summary,
}: {
  page: number;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  summary?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
      <span>{summary ?? `Page ${page}`}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="h-8 rounded-lg border border-gray-300 bg-white px-3 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          Précédent
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="h-8 rounded-lg border border-gray-300 bg-white px-3 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
