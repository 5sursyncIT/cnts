"use client";

import { useState } from "react";
import { useAnalyticsDashboard } from "@cnts/api";
import { apiClient } from "@/lib/api-client";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Download, FileText, Calendar } from "lucide-react";

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, status, error } = useAnalyticsDashboard(apiClient, {
    start_date: startDate || undefined,
    end_date: endDate || undefined
  });

  const handleExport = (format: "csv" | "excel" | "pdf", type: "activity" | "stock") => {
    apiClient.analytics.exportReport({ format, report_type: type });
  };

  if (status === "loading") return <div className="p-8 text-center">Chargement des analyses...</div>;
  if (status === "error") return <div className="p-8 text-center text-red-600">Erreur: {(error as any)?.body?.detail || "Impossible de charger les données"}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Analyses & Rapports</h1>
          <p className="text-zinc-500">Tableaux de bord et exports de données</p>
        </div>
        
        <div className="flex gap-2 items-center">
           <input 
             type="date" 
             value={startDate} 
             onChange={(e) => setStartDate(e.target.value)}
             className="border border-zinc-300 rounded px-2 py-1 text-sm"
           />
           <span className="text-zinc-400">à</span>
           <input 
             type="date" 
             value={endDate} 
             onChange={(e) => setEndDate(e.target.value)}
             className="border border-zinc-300 rounded px-2 py-1 text-sm"
           />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Dons Trend */}
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Évolution des dons</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dons_trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" name="Dons" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Distribution */}
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Stock par Groupe Sanguin</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.stock_distribution || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="groupe" type="category" width={50} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Poches" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Export Section */}
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Centre d'Exportation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
              <div className="p-2 bg-blue-100 text-blue-600 rounded">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Rapport d'Activité</div>
                <div className="text-sm text-zinc-500">Dons, qualifications, rejets (CSV/Excel/PDF)</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleExport("pdf", "activity")} className="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded hover:bg-zinc-50 flex items-center justify-center gap-2">
                <Download className="h-4 w-4" /> PDF
              </button>
              <button onClick={() => handleExport("excel", "activity")} className="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded hover:bg-zinc-50 flex items-center justify-center gap-2">
                <Download className="h-4 w-4" /> Excel
              </button>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
              <div className="p-2 bg-green-100 text-green-600 rounded">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">État du Stock</div>
                <div className="text-sm text-zinc-500">Inventaire, péremptions (CSV/Excel/PDF)</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleExport("pdf", "stock")} className="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded hover:bg-zinc-50 flex items-center justify-center gap-2">
                <Download className="h-4 w-4" /> PDF
              </button>
              <button onClick={() => handleExport("excel", "stock")} className="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded hover:bg-zinc-50 flex items-center justify-center gap-2">
                <Download className="h-4 w-4" /> Excel
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
