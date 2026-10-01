"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  CreditCard,
  Droplet,
  FileText,
  FlaskConical,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Server,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { NavIcon, NavItem, NavSection } from "./nav-types";

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  donneurs: Users,
  collectes: CalendarDays,
  dons: Heart,
  laboratoire: FlaskConical,
  stock: Package,
  distribution: Truck,
  hemovigilance: Activity,
  analytics: BarChart3,
  qualite: CheckSquare,
  facturation: CreditCard,
  audit: ShieldCheck,
  parametrage: Settings,
  contenus: FileText,
  systeme: Server,
};

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

/** Lien le plus précis correspondant à l'URL (évite d'activer « /stock » sur « /stock/regles »). */
function bestMatch(pathname: string, sections: NavSection[]): string | null {
  let best: string | null = null;
  for (const s of sections)
    for (const i of s.items)
      for (const href of [i.href, ...(i.children ?? []).map((c) => c.href)])
        if (href && isActive(pathname, href) && (!best || href.length > best.length)) best = href;
  return best;
}

function NavGroup({ item, active, onNavigate }: { item: NavItem; active: string | null; onNavigate: () => void }) {
  const Icon = ICONS[item.icon];
  const containsActive = !!item.children?.some((c) => c.href === active);
  // Ouvert par défaut s'il contient la page courante ; l'utilisateur peut ensuite le replier.
  const [manual, setManual] = useState<boolean | null>(null);
  const open = manual ?? containsActive;

  const base = "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

  if (!item.children) {
    const current = item.href === active;
    return (
      <Link
        href={item.href!}
        onClick={onNavigate}
        aria-current={current ? "page" : undefined}
        className={cn(base, current ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white")}
      >
        <Icon className={cn("h-[18px] w-[18px] shrink-0", current ? "text-brand-500" : "text-slate-400")} aria-hidden="true" />
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setManual(!open)}
        aria-expanded={open}
        className={cn(base, containsActive ? "text-white" : "text-slate-300 hover:bg-white/5 hover:text-white")}
      >
        <Icon className={cn("h-[18px] w-[18px] shrink-0", containsActive ? "text-brand-500" : "text-slate-400")} aria-hidden="true" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open ? (
        <ul className="mt-0.5 space-y-0.5 border-l border-white/10 ml-[21px] pl-3">
          {item.children.map((c) => {
            const current = c.href === active;
            return (
              <li key={c.href}>
                <Link
                  href={c.href}
                  onClick={onNavigate}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    current ? "bg-white/10 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {c.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function SidebarContent({ sections, onNavigate }: { sections: NavSection[]; onNavigate: () => void }) {
  const pathname = usePathname() ?? "";
  const active = bestMatch(pathname, sections);
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <Droplet className="h-4 w-4 text-white" fill="currentColor" aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">SGI-CNTS</div>
          <div className="text-[11px] text-slate-400">Back Office</div>
        </div>
      </div>
      <nav aria-label="Navigation principale" className="flex-1 space-y-5 overflow-y-auto px-3 pb-6 pt-2">
        {sections.map((section, i) => (
          <div key={section.title ?? i}>
            {section.title ? (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{section.title}</p>
            ) : null}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavGroup key={item.label} item={item} active={active} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord", donneurs: "Donneurs", nouveau: "Nouveau", nouvelle: "Nouvelle",
  eligibilite: "Éligibilité", fidelisation: "Fidélisation", dons: "Dons", collectes: "Collectes",
  laboratoire: "Laboratoire", analyses: "Analyses", liberation: "Libération", stock: "Stock",
  fractionnement: "Fractionnement", transferts: "Transferts", regles: "Règles de stock",
  distribution: "Distribution", commandes: "Commandes", hopitaux: "Hôpitaux", receveurs: "Receveurs",
  hemovigilance: "Hémovigilance", transfusions: "Transfusions", rappels: "Rappels", eir: "Événements indésirables",
  facturation: "Facturation", qualite: "Qualité", equipements: "Équipements", analytics: "Analyses statistiques",
  kpi: "Indicateurs", rapports: "Rapports", parametrage: "Paramétrage", utilisateurs: "Utilisateurs",
  sites: "Sites", "regles-produits": "Règles produits", peremption: "Péremption", recettes: "Recettes",
  audit: "Audit", cms: "Contenus", messages: "Messages de contact", admin: "Système", roles: "Rôles & permissions",
  monitoring: "Supervision", production: "Production", etiquetage: "Étiquetage ISBT 128",
};

function segmentLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (/^[0-9a-f-]{16,}$/i.test(segment)) return "Détail";
  return decodeURIComponent(segment).replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function Breadcrumb() {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((s, i) => ({ label: segmentLabel(s), href: "/" + segments.slice(0, i + 1).join("/") }));
  return (
    <nav aria-label="Fil d’Ariane" className="min-w-0 truncate text-sm">
      <ol className="flex items-center gap-1.5 text-gray-500">
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1.5 min-w-0">
            {i > 0 ? <span aria-hidden="true">/</span> : null}
            {i === crumbs.length - 1 ? (
              <span className="truncate font-medium text-gray-900" aria-current="page">{c.label}</span>
            ) : (
              <Link href={c.href} className="truncate hover:text-gray-900">{c.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function UserMenu({ displayName, email, roleLabel }: { displayName: string; email: string; roleLabel: string }) {
  const [open, setOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(() => {
    try {
      return typeof window === "undefined" || window.localStorage.getItem("bo.autoRefreshEnabled") !== "false";
    } catch {
      return true;
    }
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggleRefresh = (enabled: boolean) => {
    setAutoRefresh(enabled);
    try {
      window.localStorage.setItem("bo.autoRefreshEnabled", enabled ? "true" : "false");
    } catch {
      /* stockage indisponible */
    }
    window.dispatchEvent(new CustomEvent("bo:autoRefreshChanged", { detail: { enabled } }));
  };

  const initials = displayName.slice(0, 2).toUpperCase();
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">{initials}</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-medium text-gray-900">{displayName}</span>
          <span className="block text-xs text-gray-500">{roleLabel}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
          <div className="border-b border-gray-100 px-3 py-2.5">
            <p className="truncate text-sm font-medium text-gray-900">{email}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
          <label htmlFor="bo-auto-refresh" className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
            <span>
              Rafraîchissement automatique
              <span className="block text-xs text-gray-500">Mise à jour des écrans en arrière-plan</span>
            </span>
            <input id="bo-auto-refresh" type="checkbox" checked={autoRefresh} onChange={(e) => toggleRefresh(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
          </label>
          <form action="/admin/api/auth/logout" method="post">
            <button type="submit" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4" aria-hidden="true" /> Se déconnecter
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function BackOfficeShell({
  sections,
  user,
  children,
}: {
  sections: NavSection[];
  user: { displayName: string; email: string; roleLabel: string };
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Menu latéral fixe (bureau) */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 lg:flex">
        <SidebarContent sections={sections} onNavigate={() => {}} />
      </aside>

      {/* Tiroir (mobile / tablette) */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" tabIndex={-1} aria-hidden="true" className="absolute inset-0 h-full w-full cursor-default bg-gray-900/60" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-slate-900 shadow-xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Fermer le menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent sections={sections} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header data-bo-header className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Ouvrir le menu"
            className="-ml-1 rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <Breadcrumb />
          </div>
          <UserMenu {...user} />
        </header>
        <main id="contenu-principal" className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
