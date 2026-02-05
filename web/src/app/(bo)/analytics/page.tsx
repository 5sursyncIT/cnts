"use client";

import { useState } from "react";
import { useKPIs, useStockBreakdown, useTrendDons, useTrendDistribution } from "@cnts/api";
import { apiClient } from "@/lib/api-client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from "recharts";
import { Download, FileText, Calendar, Activity, Droplet, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  chart: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
};

// Composant KPI Card
function KPICard({
  title,
  value,
  unit,
  trend,
  changePercent,
  icon: Icon,
  color
}: {
  title: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  changePercent: number;
  icon: any;
  color: string;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-700" : trend === "down" ? "text-red-700" : "text-gray-700";

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
            </span>
            <span className="text-lg text-gray-700">{unit}</span>
          </div>
          <div className={`flex items-center gap-1 mt-2 text-sm ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span className="font-medium">
              {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
            </span>
            <span className="text-gray-700">vs période précédente</span>
          </div>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  // Initialize date range to last 30 days
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Fetch KPIs
  const { collection, wastage, liberation, stock, isLoading: kpisLoading } = useKPIs(apiClient);

  // Fetch stock breakdown
  const { data: stockBreakdown, status: stockStatus } = useStockBreakdown(apiClient);

  // Fetch trends with date range
  const { data: donsTrend } = useTrendDons(apiClient, {
    start_date: startDate,
    end_date: endDate,
    granularity: "day"
  });

  const { data: distributionTrend } = useTrendDistribution(apiClient, {
    start_date: startDate,
    end_date: endDate
  });

  const handleExport = (format: "csv" | "excel" | "pdf", type: "activity" | "stock") => {
    apiClient.analytics.exportReport({ format, report_type: type });
  };

  // Préparer les données pour le graphique de stock par produit
  const stockChartData = stockBreakdown?.breakdown?.map(item => ({
    name: item.type_produit,
    Disponible: item.available,
    Réservé: item.reserved,
    Distribué: item.distributed,
  })) || [];

  // Données pour le pie chart (exemple simplifié)
  const statusData = stockBreakdown?.breakdown?.reduce((acc, item) => {
    return {
      available: acc.available + item.available,
      reserved: acc.reserved + item.reserved,
      distributed: acc.distributed + item.distributed,
      expired: acc.expired + item.non_distribuable,
    };
  }, { available: 0, reserved: 0, distributed: 0, expired: 0 });

  const pieData = statusData ? [
    { name: 'Disponible', value: statusData.available, color: COLORS.success },
    { name: 'Réservé', value: statusData.reserved, color: COLORS.warning },
    { name: 'Distribué', value: statusData.distributed, color: COLORS.primary },
    { name: 'Non distribuable', value: statusData.expired, color: COLORS.danger },
  ].filter(item => item.value > 0) : [];

  // Format data for trend charts
  const donsTrendData = donsTrend?.data?.map(d => ({
    date: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    value: d.value
  })) || [];

  const distributionTrendData = distributionTrend?.data?.map(d => ({
    date: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    value: d.value
  })) || [];

  const isLoading = kpisLoading || stockStatus === "loading";

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-800">Chargement des analyses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analyses & Rapports</h1>
          <p className="text-gray-700 mt-1">Tableaux de bord et exports de données</p>
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <span className="text-gray-700">à</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {collection.data && (
          <KPICard
            title="Taux de Collecte"
            value={collection.data.value}
            unit={collection.data.unit}
            trend={collection.data.trend}
            changePercent={collection.data.change_percent}
            icon={Activity}
            color="bg-red-500"
          />
        )}

        {liberation.data && (
          <KPICard
            title="Taux de Libération"
            value={liberation.data.value}
            unit={liberation.data.unit}
            trend={liberation.data.trend}
            changePercent={liberation.data.change_percent}
            icon={TrendingUp}
            color="bg-green-500"
          />
        )}

        {wastage.data && (
          <KPICard
            title="Taux de Gaspillage"
            value={wastage.data.value}
            unit={wastage.data.unit}
            trend={wastage.data.trend}
            changePercent={wastage.data.change_percent}
            icon={AlertTriangle}
            color="bg-orange-500"
          />
        )}

        {stock.data && (
          <KPICard
            title="Stock Disponible"
            value={stock.data.value}
            unit={stock.data.unit}
            trend={stock.data.trend}
            changePercent={stock.data.change_percent}
            icon={Droplet}
            color="bg-blue-500"
          />
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Stock par Type de Produit */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock par Type de Produit</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fill: '#374151' }} />
                <YAxis tick={{ fill: '#374151' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="Disponible" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Réservé" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Distribué" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition par Statut (Pie Chart) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Statut</h3>
          <div className="h-80 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tendance des Dons (Line Chart) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendance des Dons</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={donsTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#374151', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: '#374151' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.danger}
                  strokeWidth={3}
                  dot={{ fill: COLORS.danger, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Dons"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Mensuelle (Area Chart) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendance de Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={distributionTrendData}>
                <defs>
                  <linearGradient id="colorDistribution" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#374151', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: '#374151' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDistribution)"
                  name="Distributions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Export Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Centre d'Exportation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Rapport d'Activité</div>
                <div className="text-sm text-gray-700">Dons, qualifications, rejets</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport("pdf", "activity")}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition"
              >
                <Download className="h-4 w-4" /> PDF
              </button>
              <button
                onClick={() => handleExport("excel", "activity")}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition"
              >
                <Download className="h-4 w-4" /> Excel
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">État du Stock</div>
                <div className="text-sm text-gray-700">Inventaire, péremptions</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport("pdf", "stock")}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition"
              >
                <Download className="h-4 w-4" /> PDF
              </button>
              <button
                onClick={() => handleExport("excel", "stock")}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition"
              >
                <Download className="h-4 w-4" /> Excel
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
