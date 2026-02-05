import { hasPermission, perm } from "@cnts/rbac";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logAuditEvent } from "@/lib/audit/log";
import { QuickLaunchpad, CalendarWidget, RecentOrders, StockDistribution, MapWidget } from "@/components/dashboard-widgets";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  logAuditEvent({ actorEmail: user.email, action: "dashboard.view", metadata: {} });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <QuickLaunchpad />
        </div>
        <div className="lg:col-span-1">
            <CalendarWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <MapWidget />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <RecentOrders />
        </div>
        <div className="lg:col-span-1">
            <StockDistribution />
        </div>
      </div>
    </div>
  );
}
