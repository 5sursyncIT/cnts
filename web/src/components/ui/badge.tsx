import * as React from "react";

import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "purple";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-gray-100 text-gray-700 ring-gray-200",
  info: "bg-blue-50 text-blue-800 ring-blue-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-red-50 text-red-800 ring-red-200",
  purple: "bg-violet-50 text-violet-800 ring-violet-200",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Compatibilité avec l'ancienne API (messages). */
  variant?: "default" | "secondary" | "destructive" | "outline";
  dot?: boolean;
}

const LEGACY: Record<NonNullable<BadgeProps["variant"]>, BadgeTone> = {
  default: "info",
  secondary: "neutral",
  destructive: "danger",
  outline: "neutral",
};

export function Badge({ tone, variant, dot, className, children, ...props }: BadgeProps) {
  const t = tone ?? (variant ? LEGACY[variant] : "neutral");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        TONES[t],
        className
      )}
      {...props}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/**
 * Statuts métier courants → ton + libellé français. Les statuts inconnus
 * sont affichés tels quels (underscores remplacés) en ton neutre.
 */
const STATUS: Record<string, [BadgeTone, string]> = {
  // Génériques
  ACTIF: ["success", "Actif"],
  INACTIF: ["neutral", "Inactif"],
  BROUILLON: ["neutral", "Brouillon"],
  EN_ATTENTE: ["warning", "En attente"],
  EN_COURS: ["info", "En cours"],
  TERMINEE: ["neutral", "Terminée"],
  ANNULEE: ["danger", "Annulée"],
  ANNULE: ["danger", "Annulé"],
  // Rendez-vous
  CONFIRME: ["info", "Confirmé"],
  EFFECTUE: ["success", "Effectué"],
  MANQUE: ["warning", "Manqué"],
  PLANIFIEE: ["info", "Planifiée"],
  PLANIFIE: ["info", "Planifié"],
  VALIDEE: ["info", "Validée"],
  SERVIE: ["success", "Servie"],
  CLOTUREE: ["neutral", "Clôturée"],
  CLOTURE: ["neutral", "Clôturé"],
  OUVERTE: ["warning", "Ouverte"],
  // Dons / qualification
  LIBERE: ["success", "Libéré"],
  NON_CONFORME: ["danger", "Non conforme"],
  REJETE: ["danger", "Rejeté"],
  // Poches
  EN_STOCK: ["info", "En stock"],
  DISPONIBLE: ["success", "Disponible"],
  RESERVE: ["purple", "Réservée"],
  RESERVEE: ["purple", "Réservée"],
  DISTRIBUE: ["neutral", "Distribuée"],
  DISTRIBUEE: ["neutral", "Distribuée"],
  NON_DISTRIBUABLE: ["warning", "Non distribuable"],
  FRACTIONNEE: ["neutral", "Fractionnée"],
  RAPPELEE: ["danger", "Rappelée"],
  DETRUITE: ["neutral", "Détruite"],
  // Résultats
  NEGATIF: ["success", "Négatif"],
  POSITIF: ["danger", "Positif"],
  COMPATIBLE: ["success", "Compatible"],
  INCOMPATIBLE: ["danger", "Incompatible"],
};

export function statusLabel(status: string): string {
  return STATUS[status]?.[1] ?? status.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

export function StatusBadge({ status, className }: { status: string | null | undefined; className?: string }) {
  if (!status) return <span className="text-gray-400">—</span>;
  const [tone] = STATUS[status] ?? ["neutral"];
  return (
    <Badge tone={tone} dot className={className}>
      {statusLabel(status)}
    </Badge>
  );
}
