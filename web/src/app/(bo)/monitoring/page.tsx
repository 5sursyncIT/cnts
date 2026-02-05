"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import { Activity, Server, Clock, AlertTriangle, CheckCircle, XCircle, Download } from 'lucide-react';

// --- Mock Data --- (Removed, fetched from API)

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
      const res = await fetch('/api/backend/observability/dashboard');
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
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (autoRefreshEnabled) {
      intervalId = setInterval(() => fetchMetrics(), 30000);
    }
    return () => {
      clearTimeout(debounceTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchMetrics, autoRefreshEnabled, timeRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500 bg-green-50';
      case 'degraded': return 'text-yellow-500 bg-yellow-50';
      case 'down': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle size={18} />;
      case 'degraded': return <AlertTriangle size={18} />;
      case 'down': return <XCircle size={18} />;
      default: return <Activity size={18} />;
    }
  };

  if (!dashboardData) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-screen text-gray-700">
        <div className="mb-3">
          {refreshState === "error" ? "Impossible de charger le tableau de bord." : "Chargement du tableau de bord..."}
        </div>
        {refreshState === "error" && (
          <button
            onClick={() => fetchMetrics({ force: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  const { metrics, services, errors, total_requests, avg_latency, error_rate } = dashboardData;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Observabilité Système</h1>
          <p className="text-gray-700">Monitoring en temps réel des performances et de la santé des services.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-700" title={refreshError ?? undefined}>
            <span
              className={`h-2 w-2 rounded-full ${
                refreshState === "loading"
                  ? "bg-blue-500 animate-pulse"
                  : refreshState === "error"
                  ? "bg-red-500"
                  : autoRefreshEnabled
                  ? "bg-green-500"
                  : "bg-gray-400"
              }`}
            />
            <span>
              {autoRefreshEnabled
                ? refreshState === "loading"
                  ? "Mise à jour..."
                  : refreshState === "error"
                  ? "Connexion interrompue"
                  : "Données à jour"
                : "Rafraîchissement désactivé"}
            </span>
          </div>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          >
            <option value="1h">Dernière heure</option>
            <option value="6h">Dernières 6 heures</option>
            <option value="12h">Dernières 12 heures</option>
            <option value="24h">Dernières 24 heures</option>
            <option value="7d">7 derniers jours</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={18} />
            Exporter
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-700">Requêtes Totales</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{(total_requests / 1000000).toFixed(1)}M</h3>
              <span className="text-green-600 text-sm font-medium flex items-center mt-1">
                +12% <span className="text-gray-800 ml-1">vs hier</span>
              </span>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Activity size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-700">Latence Moyenne</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{avg_latency}ms</h3>
              <span className="text-green-600 text-sm font-medium flex items-center mt-1">
                -5ms <span className="text-gray-800 ml-1">vs hier</span>
              </span>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Clock size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-700">Taux d'Erreur</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{error_rate}%</h3>
              <span className="text-red-600 text-sm font-medium flex items-center mt-1">
                +0.02% <span className="text-gray-800 ml-1">vs hier</span>
              </span>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-700">Services Actifs</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{services.filter((s: any) => s.status === 'healthy').length}/{services.length}</h3>
              <span className="text-gray-700 text-sm font-medium flex items-center mt-1">
                {Math.round((services.filter((s: any) => s.status === 'healthy').length / services.length) * 100)}% opérationnel
              </span>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <Server size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request Volume */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Volume de Requêtes (RPS)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="requests" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency & Errors */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Latence et Erreurs</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="latency" name="Latence (ms)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="errors" name="Erreurs" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Service Health */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">État des Services</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase">Service</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase">Version</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase">Uptime (24h)</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase">Statut</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.map((service: any) => (
                <tr key={service.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    <Server size={16} className="text-gray-800" />
                    {service.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-mono">{service.version}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{service.uptime}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                      <span className="mr-1.5">{getStatusIcon(service.status)}</span>
                      {service.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">Logs</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Error Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribution des Erreurs</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={errors}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11}} interval={0} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
