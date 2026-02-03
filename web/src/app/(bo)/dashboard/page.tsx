import { hasPermission, perm } from "@cnts/rbac";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logAuditEvent } from "@/lib/audit/log";
import { SenegalMap } from "@/components/senegal-map";
import { DashboardStats } from "@/components/dashboard-stats";

type Widget = {
  id: string;
  title: string;
  description: string;
  required?: { module: string; action: "read" | "write" | "delete" | "validate" };
  link?: string;
  icon?: string;
};

const widgets: Widget[] = [
  {
    id: "stock-summary",
    title: "Stock & Fractionnement",
    description: "État des stocks en temps réel et alertes FEFO.",
    required: perm("stock", "read"),
    link: "/stock",
    icon: "🩸"
  },
  {
    id: "liberation",
    title: "Laboratoire & Libération",
    description: "Qualification biologique et validation des dons.",
    required: perm("liberation", "read"),
    link: "/laboratoire",
    icon: "🔬"
  },
  {
    id: "distribution",
    title: "Distribution",
    description: "Commandes hospitalières et cross-matching.",
    required: perm("distribution", "read"),
    link: "/distribution",
    icon: "🚑"
  },
  {
    id: "audit",
    title: "Audit & Traçabilité",
    description: "Journal des événements et hémovigilance.",
    required: perm("audit", "read"),
    link: "/audit",
    icon: "📋"
  }
];

// Données simulées pour la démo UI
const MOCK_REGION_DATA = {
  "Dakar": 1450,
  "Thiès": 890,
  "Saint-Louis": 450,
  "Diourbel": 320,
  "Ziguinchor": 280,
  "Kaolack": 210,
  "Tambacounda": 180,
  "Louga": 150,
  "Kolda": 120,
  "Fatick": 110,
  "Matam": 90,
  "Kaffrine": 80,
  "Sédhiou": 60,
  "Kédougou": 40
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const visibleWidgets = widgets.filter((w) => (w.required ? hasPermission({ user, permission: w.required }) : true));
  logAuditEvent({ actorEmail: user.email, action: "dashboard.view", metadata: { widgets: visibleWidgets.map((w) => w.id) } });

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Vue d'ensemble</h1>
        <p className="mt-1 text-sm text-zinc-500">Bienvenue, {user.displayName}</p>
      </div>

      <DashboardStats 
        donneurs={4250} 
        dons={320} 
        poches={1850} 
        commandes={12} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Carte interactive */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-zinc-100 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-900">Répartition des donneurs</h2>
            <p className="text-sm text-zinc-500">Cartographie des donneurs actifs par région</p>
          </div>
          <div className="aspect-[1.5] w-full flex items-center justify-center bg-zinc-50/50 rounded-lg overflow-hidden">
            <SenegalMap data={MOCK_REGION_DATA} />
          </div>
        </div>

        {/* Widgets / Actions rapides */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Accès Rapide</h2>
            <div className="grid grid-cols-1 gap-3">
              {visibleWidgets.map((w) => (
                <a 
                  key={w.id} 
                  href={w.link || "#"}
                  className="group flex items-center p-3 rounded-lg border border-zinc-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                >
                  <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">{w.icon}</span>
                  <div>
                    <div className="font-medium text-zinc-900 group-hover:text-blue-700">{w.title}</div>
                    <div className="text-xs text-zinc-500 line-clamp-1">{w.description}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="bg-blue-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="font-bold text-lg mb-2">Campagne Mobile</h3>
            <p className="text-blue-100 text-sm mb-4">
              La prochaine collecte mobile est prévue à Thiès le 15 Mars.
            </p>
            <button className="w-full py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition">
              Voir le planning
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
