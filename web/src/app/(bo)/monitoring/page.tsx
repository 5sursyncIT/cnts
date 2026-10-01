"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import { Activity, Server, Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Select,
  StatCard,
  Table,
  TBody,
  THead,
  Td,
  Th,
  Tr,
  type BadgeTone,
} from "@/components/ui";

const SERVICE_STATUS: Record<string, { label: string; tone: BadgeTone; icon: React.ReactNode }> = {
  healthy: { label: 'Opérationnel', tone: 'success', icon: <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" /> },
  degraded: { label: 'Dégradé', tone: 'warning', icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> },
  down: { label: 'Hors service', tone: 'danger', icon: <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> },
};

const TIME_RANGES = [
  { value: '1h', label: 'Dernière heure' },
  { value: '6h', label: 'Dernières 6 heures' },
  { value: '12h', label: 'Dernières 12 heures' },
  { value: '24h', label: 'Dernières 24 heures' },
  { value: '7d', label: '7 derniers jours' },
];

// --- Components ---

export default function MonitoringPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshState, setRefreshState] = useState<"idle" | "loading" | "error">("idle");
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const lastPayloadRef = useRef<string | null>(null);
  const lastFetchAtRef = useRef(0);
  const inflightRef = useRef(false);
  const cacheRef = useRef<Record<string, { ts: number; data: any; payload: string }>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("bo.autoRefreshEnabled");
    if (stored === "false") setAutoRefreshEnabled(false);

    const onRefreshSetting = (event: Event) => {
      const customEvent = event as CustomEvent<{ enabled?: boolean }>;
      if (typeof customEvent.detail?.enabled === "boolean") {
        setAutoRefreshEnabled(customEvent.detail.enabled);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "bo.autoRefreshEnabled") {
        setAutoRefreshEnabled(event.newValue !== "false");
      }
    };

    window.addEventListener("bo:autoRefreshChanged", onRefreshSetting as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("bo:autoRefreshChanged", onRefreshSetting as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const fetchMetrics = useCallback(async (options?: { force?: boolean }) => {
    const now = Date.now();
    if (!options?.force && now - lastFetchAtRef.current < 5000) return;
    const cacheKey = timeRange;
    const cached = cacheRef.current[cacheKey];
    if (!options?.force && cached && now - cached.ts < 15000) {
      if (lastPayloadRef.current !== cached.payload) {
        setDashboardData(cached.data);
        lastPayloadRef.current = cached.payload;
      }
      return;
    }
    if (inflightRef.current) return;
    inflightRef.current = true;
    setRefreshState("loading");
    setRefreshError(null);
    lastFetchAtRef.current = now;
    try {
      const res = await fetch('/api/observability/dashboard');
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }
      const data = await res.json();
      const payload = JSON.stringify(data);
      cacheRef.current[cacheKey] = { ts: now, data, payload };
      if (payload !== lastPayloadRef.current) {
        setDashboardData(data);
        lastPayloadRef.current = payload;
      }
      setRefreshState("idle");
    } catch (e) {
      setRefreshState("error");
      setRefreshError(e instanceof Error ? e.message : "Connexion interrompue");
    } finally {
      inflightRef.current = false;
    }
  }, [timeRange]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchMetrics({ force: true });
    }, 400);
    let intervalId: number | null = null;
    if (autoRefreshEnabled) {
      intervalId = window.setInterval(() => fetchMetrics(), 30000) as unknown as number;
    }
    return () => {
      clearTimeout(debounceTimer);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [fetchMetrics, autoRefreshEnabled, timeRange]);

  const header = (actions?: React.ReactNode) => (
    <PageHeader
      title="Observabilité"
      description="Performances et santé des services en temps réel."
      actions={actions}
    />
  );

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        {header()}
        <Card>
          {refreshState === "error" ? (
            <ErrorState
              message={refreshError ? `Impossible de charger le tableau de bord (${refreshError}).` : "Impossible de charger le tableau de bord."}
              onRetry={() => fetchMetrics({ force: true })}
            />
          ) : (
            <LoadingState rows={8} label="Chargement du tableau de bord…" />
          )}
        </Card>
      </div>
    );
  }

  const { metrics, services, errors, total_requests, avg_latency, error_rate } = dashboardData;
  const healthyCount = services.filter((s: any) => s.status === 'healthy').length;
  const healthyPct = services.length ? Math.round((healthyCount / services.length) * 100) : 0;

  const refreshLabel = autoRefreshEnabled
    ? refreshState === "loading"
      ? "Mise à jour…"
      : refreshState === "error"
      ? "Connexion interrompue"
      : "Données à jour"
    : "Rafraîchissement automatique désactivé";

  return (
    <div className="space-y-6">
      {header(
        <>
          <span className="flex items-center gap-2 text-xs text-gray-600" role="status" aria-live="polite" title={refreshError ?? undefined}>
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                refreshState === "loading"
                  ? "bg-blue-500 animate-pulse"
                  : refreshState === "error"
                  ? "bg-red-500"
                  : autoRefreshEnabled
                  ? "bg-emerald-500"
                  : "bg-gray-400"
              }`}
            />
            {refreshLabel}
          </span>
          <Select
            aria-label="Période"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-auto"
          >
            {TIME_RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
          <Button
            variant="secondary"
            onClick={() => fetchMetrics({ force: true })}
            loading={refreshState === "loading"}
            icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          >
            Actualiser
          </Button>
        </>
      )}

      {/* Indicateurs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Requêtes totales"
          value={`${(total_requests / 1000000).toFixed(1)} M`}
          icon={<Activity className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Latence moyenne"
          value={`${avg_latency} ms`}
          icon={<Clock className="h-5 w-5" aria-hidden="true" />}
          tone="neutral"
        />
        <StatCard
          label="Taux d’erreur"
          value={`${error_rate} %`}
          icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          tone="danger"
        />
        <StatCard
          label="Services opérationnels"
          value={`${healthyCount}/${services.length}`}
          hint={`${healthyPct} % opérationnels`}
          icon={<Server className="h-5 w-5" aria-hidden="true" />}
          tone={healthyCount < services.length ? "warning" : "success"}
        />
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Volume de requêtes" description="Requêtes par seconde" />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <Tooltip
                    contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="requests" name="Requêtes" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Latence et erreurs" />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <Tooltip
                    contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="latency" name="Latence (ms)" stroke="#7c3aed" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="errors" name="Erreurs" stroke="#dc2626" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="État des services" />
          {services.length === 0 ? (
            <EmptyState title="Aucun service remonté" />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Service</Th>
                  <Th>Version</Th>
                  <Th>Disponibilité (24 h)</Th>
                  <Th>Statut</Th>
                </tr>
              </THead>
              <TBody>
                {services.map((service: any) => {
                  const st = SERVICE_STATUS[service.status];
                  return (
                    <Tr key={service.name}>
                      <Td className="font-medium text-gray-900">
                        <span className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-gray-500" aria-hidden="true" />
                          {service.name}
                        </span>
                      </Td>
                      <Td className="font-mono text-gray-700">{service.version}</Td>
                      <Td className="tabular-nums">{service.uptime}</Td>
                      <Td>
                        <Badge tone={st?.tone ?? "neutral"}>
                          {st?.icon ?? <Activity className="h-3.5 w-3.5" aria-hidden="true" />}
                          {st?.label ?? String(service.status)}
                        </Badge>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Répartition des erreurs" />
          <CardBody>
            {(errors ?? []).length === 0 ? (
              <EmptyState title="Aucune erreur" className="py-6" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={errors}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11, fill: '#4b5563'}} interval={0} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="count" name="Occurrences" fill="#dc2626" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
