"use client";

import { useState, type ReactNode } from "react";
import { useKPIs, useStockBreakdown, useTrendDons, useTrendDistribution } from "@cnts/api";
import { apiClient } from "@/lib/api-client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from "recharts";
import { Download, FileText, Calendar, Activity, Droplet, TrendingUp, TrendingDown, Minus, AlertTriangle, Gauge, type LucideIcon } from "lucide-react";
import { Alert, Button, ButtonLink, Card, CardBody, CardHeader, EmptyState, Field, Input, LoadingState, PageHeader } from "@/components/ui";

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  chart: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
};

const TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
};

// Carte indicateur (valeur + évolution vs période précédente)
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
  icon: LucideIcon;
  color: string;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-700" : trend === "down" ? "text-red-700" : "text-gray-600";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums text-gray-900">
              {value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-gray-600">{unit}</span>
          </p>
          <p className={`mt-1 flex flex-wrap items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-medium tabular-nums">
              {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)} %
            </span>
            <span className="text-gray-500">vs période précédente</span>
          </p>
        </div>
        <div className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:flex ${color}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, isEmpty, children }: { title: string; isEmpty: boolean; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        {isEmpty ? (
          <EmptyState title="Aucune donnée" description="Rien à afficher pour cette période." className="h-80" />
        ) : (
          <div className="h-80">{children}</div>
        )}
      </CardBody>
    </Card>
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
  const { collection, wastage, liberation, stock, isLoading: kpisLoading, isError: kpisError } = useKPIs(apiClient);

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

  const header = (
    <PageHeader
      title="Analyses statistiques"
      description="Tableaux de bord et exports de données."
      actions={
        <>
          <ButtonLink href="/analytics/kpi" variant="secondary" icon={<Gauge className="h-4 w-4" aria-hidden="true" />}>
            Indicateurs KPI
          </ButtonLink>
          <ButtonLink href="/analytics/rapports" variant="secondary" icon={<FileText className="h-4 w-4" aria-hidden="true" />}>
            Rapports
          </ButtonLink>
        </>
      }
    />
  );

  if (isLoading) {
    return (
      <div>
        {header}
        <Card>
          <LoadingState rows={8} label="Chargement des analyses…" />
        </Card>
      </div>
    );
  }

  const retryKpis = () => {
    collection.refetch();
    wastage.refetch();
    liberation.refetch();
    stock.refetch();
  };

  return (
    <div className="space-y-6">
      {header}

      {/* Période des tendances */}
      <Card>
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Du">
            <Input type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Au">
            <Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
          <p className="self-end text-xs text-gray-500 sm:col-span-2 lg:pb-3">
            La période s&apos;applique aux graphiques de tendance.
          </p>
        </CardBody>
      </Card>

      {kpisError ? (
        <Alert tone="warning" className="flex flex-wrap items-center justify-between gap-3">
          <span>Certains indicateurs n&apos;ont pas pu être chargés.</span>
          <Button size="sm" variant="secondary" onClick={retryKpis}>Réessayer</Button>
        </Alert>
      ) : null}

      {/* Indicateurs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {collection.data && (
          <KPICard
            title="Taux de collecte"
            value={collection.data.value}
            unit={collection.data.unit}
            trend={collection.data.trend}
            changePercent={collection.data.change_percent}
            icon={Activity}
            color="bg-red-50 text-red-600"
          />
        )}

        {liberation.data && (
          <KPICard
            title="Taux de libération"
            value={liberation.data.value}
            unit={liberation.data.unit}
            trend={liberation.data.trend}
            changePercent={liberation.data.change_percent}
            icon={TrendingUp}
            color="bg-emerald-50 text-emerald-600"
          />
        )}

        {wastage.data && (
          <KPICard
            title="Taux de gaspillage"
            value={wastage.data.value}
            unit={wastage.data.unit}
            trend={wastage.data.trend}
            changePercent={wastage.data.change_percent}
            icon={AlertTriangle}
            color="bg-amber-50 text-amber-600"
          />
        )}

        {stock.data && (
          <KPICard
            title="Stock disponible"
            value={stock.data.value}
            unit={stock.data.unit}
            trend={stock.data.trend}
            changePercent={stock.data.change_percent}
            icon={Droplet}
            color="bg-blue-50 text-blue-600"
          />
        )}
      </div>

      {stockStatus === "error" ? (
        <Alert tone="warning">La répartition du stock n&apos;a pas pu être chargée.</Alert>
      ) : null}

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Stock par type de produit" isEmpty={stockChartData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fill: '#374151' }} />
              <YAxis tick={{ fill: '#374151' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Bar dataKey="Disponible" fill={COLORS.success} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Réservé" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Distribué" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Répartition par statut" isEmpty={pieData.length === 0}>
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
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tendance des dons" isEmpty={donsTrendData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={donsTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fill: '#374151', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fill: '#374151' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
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
        </ChartCard>

        <ChartCard title="Tendance de distribution" isEmpty={distributionTrendData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={distributionTrendData}>
              <defs>
                <linearGradient id="colorDistribution" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fill: '#374151', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fill: '#374151' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
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
        </ChartCard>
      </div>

      {/* Exports rapides */}
      <Card>
        <CardHeader title="Exports rapides" description="Pour choisir une période ou le format CSV, utilisez la page Rapports." />
        <CardBody className="grid gap-6 md:grid-cols-2">
          <ExportBlock
            icon={<FileText className="h-5 w-5" aria-hidden="true" />}
            iconClass="bg-blue-50 text-blue-600"
            title="Rapport d'activité"
            description="Dons, qualifications, rejets"
            onPdf={() => handleExport("pdf", "activity")}
            onExcel={() => handleExport("excel", "activity")}
          />
          <ExportBlock
            icon={<Calendar className="h-5 w-5" aria-hidden="true" />}
            iconClass="bg-emerald-50 text-emerald-600"
            title="État du stock"
            description="Inventaire, péremptions"
            onPdf={() => handleExport("pdf", "stock")}
            onExcel={() => handleExport("excel", "stock")}
          />
        </CardBody>
      </Card>
    </div>
  );
}

function ExportBlock({
  icon,
  iconClass,
  title,
  description,
  onPdf,
  onExcel,
}: {
  icon: ReactNode;
  iconClass: string;
  title: string;
  description: string;
  onPdf: () => void;
  onExcel: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className={`rounded-lg p-2.5 ${iconClass}`}>{icon}</div>
        <div>
          <div className="font-medium text-gray-900">{title}</div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={`Télécharger : ${title}`}>
        <Button variant="secondary" className="flex-1" onClick={onPdf} icon={<Download className="h-4 w-4" aria-hidden="true" />}>
          PDF
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onExcel} icon={<Download className="h-4 w-4" aria-hidden="true" />}>
          Excel
        </Button>
      </div>
    </div>
  );
}
