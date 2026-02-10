import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Heart,
  FlaskConical,
  Package,
  Truck,
  Activity,
  BarChart3,
  FileText,
  Settings,
  ShieldAlert,
  CheckSquare,
  CreditCard,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { hasPermission, perm, type User } from "@cnts/rbac";
import { NavLink } from "./nav-link";

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  // Permissions
  const canReadDonneurs = hasPermission({ user, permission: perm("donneurs", "read") });
  const canReadDons = hasPermission({ user, permission: perm("dons", "read") });
  const canReadLabo = hasPermission({ user, permission: perm("analyses", "read") }) ||
    hasPermission({ user, permission: perm("liberation", "read") });
  const canReadStock = hasPermission({ user, permission: perm("stock", "read") });
  const canReadDistribution = hasPermission({ user, permission: perm("distribution", "read") });
  const canReadHemovigilance = hasPermission({ user, permission: perm("hemovigilance", "read") });
  const canReadAnalytics = hasPermission({ user, permission: perm("analytics", "read") });
  const canReadAudit = hasPermission({ user, permission: perm("audit", "read") });
  const canReadAdmin = hasPermission({ user, permission: perm("administration", "read") });
  const canReadParametrage = hasPermission({ user, permission: perm("parametrage", "read") });
  const canReadQualite = hasPermission({ user, permission: perm("qualite", "read") });
  const canReadFacturation = hasPermission({ user, permission: perm("facturation", "read") });
  const canReadCollectes = hasPermission({ user, permission: perm("collectes", "read") });
  const canReadSites = hasPermission({ user, permission: perm("sites", "read") });

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, enabled: true },
    {
      label: "Donneurs",
      href: "/donneurs",
      icon: Users,
      enabled: canReadDonneurs,
      subItems: [
        { label: "Liste", href: "/donneurs" },
        { label: "Fidélisation", href: "/donneurs/fidelisation" },
      ]
    },
    { label: "Dons", href: "/dons", icon: Heart, enabled: canReadDons },
    { label: "Collectes", href: "/collectes", icon: CalendarDays, enabled: canReadCollectes },
    { label: "Laboratoire", href: "/laboratoire", icon: FlaskConical, enabled: canReadLabo },
    {
      label: "Stock",
      href: "/stock",
      icon: Package,
      enabled: canReadStock,
      subItems: [
        { label: "Poches", href: "/stock" },
        { label: "Fractionnement", href: "/stock/fractionnement" },
        { label: "Transferts", href: "/stock/transferts" },
      ]
    },
    { label: "Distribution", href: "/distribution", icon: Truck, enabled: canReadDistribution },
    { label: "Hémovigilance", href: "/hemovigilance", icon: Activity, enabled: canReadHemovigilance },
    { label: "Facturation", href: "/facturation", icon: CreditCard, enabled: canReadFacturation },
    {
      label: "Qualité",
      href: "/qualite",
      icon: CheckSquare,
      enabled: canReadQualite,
      subItems: [
        { label: "Tableau de bord", href: "/qualite" },
        { label: "Équipements", href: "/qualite/equipements" },
      ]
    },
    {
      label: "Analyses",
      href: "/analytics",
      icon: BarChart3,
      enabled: canReadAnalytics,
      subItems: [
        { label: "Dashboard", href: "/analytics" },
        { label: "KPIs", href: "/analytics/kpi" },
        { label: "Rapports", href: "/analytics/rapports" },
      ]
    },
    {
      label: "Paramétrage",
      href: "/parametrage",
      icon: Settings,
      enabled: canReadParametrage,
      subItems: [
        { label: "Utilisateurs", href: "/parametrage/utilisateurs" },
        { label: "Sites", href: "/parametrage/sites" },
        { label: "Règles Produits", href: "/parametrage/regles-produits" },
        { label: "Péremption", href: "/parametrage/peremption" },
        { label: "Recettes", href: "/parametrage/recettes" },
      ]
    },
    { label: "Audit", href: "/audit", icon: ShieldAlert, enabled: canReadAudit },
    { label: "CMS", href: "/cms", icon: FileText, enabled: true },
    { label: "Admin", href: "/admin/roles", icon: Settings, enabled: canReadAdmin },
  ];

  return (
    <aside className="hidden w-64 flex-col bg-[#2e3344] text-white md:flex">
      {/* Logo Area */}
      <div className="flex h-16 items-center justify-center border-b border-gray-700 bg-[#2e3344] px-4">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Activity className="h-6 w-6 text-red-500" />
          <span>SGI-CNTS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navItems.filter(item => item.enabled).map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </ul>
      </nav>

      {/* User / Logout */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center">
            {user.displayName?.charAt(0) || "U"}
          </div>
          <div className="text-sm font-medium truncate w-32">
            {user.displayName}
          </div>
        </div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="w-full rounded-md bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-600 transition-colors"
          >
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}

function NavItem({ item }: { item: { label: string; href: string; icon: any; subItems?: { label: string; href: string }[] } }) {
  if (item.subItems) {
    return (
      <li>
        <div className="px-4 py-3 text-sm font-medium text-gray-400 flex items-center gap-3">
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </div>
        <ul className="space-y-1">
          {item.subItems.map((subItem) => (
            <li key={subItem.href}>
              <NavLink href={subItem.href}>
                <span className="pl-8">{subItem.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </li>
    );
  }

  return (
    <li>
      <NavLink href={item.href}>
        <item.icon className="h-5 w-5" />
        <span>{item.label}</span>
      </NavLink>
    </li>
  );
}

// Client component for active link state
// import { NavLink } from "./nav-link"; // Already imported at top

/* function LinkWrapper({ href, children }: { href: string; children: React.ReactNode }) {
   return <NavLink href={href}>{children}</NavLink>;
} */
