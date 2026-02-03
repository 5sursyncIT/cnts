export function DashboardStats(props: {
  donneurs: number;
  dons: number;
  poches: number;
  commandes: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6">
        <div className="text-zinc-500 text-sm font-medium mb-2">Total Donneurs</div>
        <div className="text-3xl font-bold text-zinc-900">{props.donneurs}</div>
        <div className="text-xs text-green-600 mt-2 font-medium">↑ +12% ce mois</div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6">
        <div className="text-zinc-500 text-sm font-medium mb-2">Dons (Mois)</div>
        <div className="text-3xl font-bold text-zinc-900">{props.dons}</div>
        <div className="text-xs text-green-600 mt-2 font-medium">↑ +5% ce mois</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6">
        <div className="text-zinc-500 text-sm font-medium mb-2">Stock Poches</div>
        <div className="text-3xl font-bold text-zinc-900">{props.poches}</div>
        <div className="text-xs text-red-600 mt-2 font-medium">↓ -2% critique</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6">
        <div className="text-zinc-500 text-sm font-medium mb-2">Commandes</div>
        <div className="text-3xl font-bold text-zinc-900">{props.commandes}</div>
        <div className="text-xs text-blue-600 mt-2 font-medium">8 en attente</div>
      </div>
    </div>
  );
}
