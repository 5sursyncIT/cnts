"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Plus,
  Eye,
  Bell,
  CheckCircle,
  Lock,
  Search,
  ChevronLeft,
  Download,
  Package,
} from "lucide-react";

// ── Types ──────────────────────────────────────

interface Rappel {
  id: string;
  type_cible: string;
  valeur_cible: string;
  motif: string | null;
  statut: string;
  updated_at: string | null;
  notified_at: string | null;
  confirmed_at: string | null;
  closed_at: string | null;
  created_at: string;
}

interface RappelAction {
  id: string;
  rappel_id: string;
  action: string;
  validateur_id: string | null;
  note: string | null;
  created_at: string;
}

interface Impact {
  poche_id: string;
  don_id: string;
  din: string;
  type_produit: string;
  lot: string | null;
  statut_distribution: string;
  hopital_id: string | null;
  receveur_id: string | null;
  commande_id: string | null;
  date_transfusion: string | null;
}

// ── Helpers ────────────────────────────────────

const API = "/api/backend/hemovigilance";

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statutBadge(statut: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    OUVERT: { bg: "bg-red-100", text: "text-red-800", label: "Ouvert" },
    NOTIFIE: { bg: "bg-orange-100", text: "text-orange-800", label: "Notifié" },
    CONFIRME: { bg: "bg-blue-100", text: "text-blue-800", label: "Confirmé" },
    CLOTURE: { bg: "bg-green-100", text: "text-green-800", label: "Clôturé" },
  };
  const s = map[statut] || { bg: "bg-zinc-100", text: "text-zinc-800", label: statut };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function typeCibleBadge(type: string) {
  if (type === "DIN") {
    return <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">DIN</span>;
  }
  return <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">LOT</span>;
}

function distributionBadge(statut: string) {
  const map: Record<string, { bg: string; text: string }> = {
    DISPONIBLE: { bg: "bg-green-100", text: "text-green-800" },
    DISTRIBUE: { bg: "bg-blue-100", text: "text-blue-800" },
    RESERVE: { bg: "bg-yellow-100", text: "text-yellow-800" },
    NON_DISTRIBUABLE: { bg: "bg-red-100", text: "text-red-800" },
    EN_STOCK: { bg: "bg-zinc-100", text: "text-zinc-800" },
  };
  const s = map[statut] || { bg: "bg-zinc-100", text: "text-zinc-800" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      {statut.replace(/_/g, " ")}
    </span>
  );
}

// ── Main Page ──────────────────────────────────

export default function RappelsPage() {
  const [rappels, setRappels] = useState<Rappel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRappel, setSelectedRappel] = useState<Rappel | null>(null);

  const fetchRappels = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (filterStatut) params.set("statut", filterStatut);
      const res = await fetch(`${API}/rappels?${params}`);
      if (res.ok) setRappels(await res.json());
    } finally {
      setLoading(false);
    }
  }, [filterStatut]);

  useEffect(() => {
    fetchRappels();
  }, [fetchRappels]);

  const filtered = rappels.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.valeur_cible.toLowerCase().includes(q) ||
      r.type_cible.toLowerCase().includes(q) ||
      (r.motif && r.motif.toLowerCase().includes(q))
    );
  });

  // Stats
  const stats = {
    total: rappels.length,
    ouverts: rappels.filter((r) => r.statut === "OUVERT").length,
    notifies: rappels.filter((r) => r.statut === "NOTIFIE").length,
    confirmes: rappels.filter((r) => r.statut === "CONFIRME").length,
    clotures: rappels.filter((r) => r.statut === "CLOTURE").length,
  };

  if (selectedRappel) {
    return (
      <RappelDetail
        rappel={selectedRappel}
        onBack={() => {
          setSelectedRappel(null);
          fetchRappels();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Rappels & Alertes</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau rappel
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Total" value={stats.total} color="zinc" />
        <StatCard label="Ouverts" value={stats.ouverts} color="red" />
        <StatCard label="Notifiés" value={stats.notifies} color="orange" />
        <StatCard label="Confirmés" value={stats.confirmes} color="blue" />
        <StatCard label="Clôturés" value={stats.clotures} color="green" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher par DIN, LOT, motif..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          <option value="">Tous les statuts</option>
          <option value="OUVERT">Ouvert</option>
          <option value="NOTIFIE">Notifié</option>
          <option value="CONFIRME">Confirmé</option>
          <option value="CLOTURE">Clôturé</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            {rappels.length === 0
              ? "Aucun rappel enregistré"
              : "Aucun rappel ne correspond à la recherche"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Cible</th>
                  <th className="px-4 py-3">Motif</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Créé le</th>
                  <th className="px-4 py-3">Notifié</th>
                  <th className="px-4 py-3">Clôturé</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">{typeCibleBadge(r.type_cible)}</td>
                    <td className="px-4 py-3 font-mono text-sm font-medium">{r.valeur_cible}</td>
                    <td className="px-4 py-3 max-w-[250px] truncate text-zinc-600">{r.motif || "—"}</td>
                    <td className="px-4 py-3">{statutBadge(r.statut)}</td>
                    <td className="px-4 py-3 text-zinc-500">{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-3 text-zinc-500">{fmtDate(r.notified_at)}</td>
                    <td className="px-4 py-3 text-zinc-500">{fmtDate(r.closed_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedRappel(r)}
                        className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Détail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateRappelModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchRappels();
          }}
        />
      )}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    zinc: "border-zinc-200 text-zinc-900",
    red: "border-red-200 text-red-700",
    orange: "border-orange-200 text-orange-700",
    blue: "border-blue-200 text-blue-700",
    green: "border-green-200 text-green-700",
  };
  return (
    <div className={`rounded-xl border bg-white p-4 ${colors[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

// ── Create Modal ───────────────────────────────

function CreateRappelModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [typeCible, setTypeCible] = useState("DIN");
  const [valeurCible, setValeurCible] = useState("");
  const [motif, setMotif] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!valeurCible.trim()) {
      setError("La valeur cible est obligatoire");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/rappels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_cible: typeCible,
          valeur_cible: valeurCible.trim(),
          motif: motif.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.detail || `Erreur ${res.status}`);
        return;
      }
      onCreated();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Nouveau rappel</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Type de cible</label>
            <select
              value={typeCible}
              onChange={(e) => setTypeCible(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="DIN">DIN (Don individuel)</option>
              <option value="LOT">LOT (Lot de poches)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              {typeCible === "DIN" ? "Numéro DIN" : "Numéro de lot"}
            </label>
            <input
              type="text"
              value={valeurCible}
              onChange={(e) => setValeurCible(e.target.value)}
              placeholder={typeCible === "DIN" ? "Ex: CNTS2500100001" : "Ex: LOT-2025-001"}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Motif du rappel</label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              placeholder="Décrivez la raison du rappel..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? "Création..." : "Créer le rappel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail View ────────────────────────────────

function RappelDetail({ rappel: initialRappel, onBack }: { rappel: Rappel; onBack: () => void }) {
  const [rappel, setRappel] = useState(initialRappel);
  const [actions, setActions] = useState<RappelAction[]>([]);
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const [loadingActions, setLoadingActions] = useState(true);
  const [loadingImpacts, setLoadingImpacts] = useState(true);
  const [activeTab, setActiveTab] = useState<"impacts" | "actions">("impacts");
  const [actionNote, setActionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    const [actRes, impRes, rapRes] = await Promise.all([
      fetch(`${API}/rappels/${rappel.id}/actions`),
      fetch(`${API}/rappels/${rappel.id}/impacts`),
      fetch(`${API}/rappels/${rappel.id}`),
    ]);
    if (actRes.ok) {
      setActions(await actRes.json());
      setLoadingActions(false);
    }
    if (impRes.ok) {
      setImpacts(await impRes.json());
      setLoadingImpacts(false);
    }
    if (rapRes.ok) {
      setRappel(await rapRes.json());
    }
  }, [rappel.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleWorkflowAction = async (action: "notifier" | "confirmer" | "cloturer") => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/rappels/${rappel.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validateur_id: null,
          note: actionNote.trim() || null,
        }),
      });
      if (res.ok) {
        setRappel(await res.json());
        setActionNote("");
        // Refresh actions
        const actRes = await fetch(`${API}/rappels/${rappel.id}/actions`);
        if (actRes.ok) setActions(await actRes.json());
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.detail || `Erreur ${res.status}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = (type: "hopitaux" | "receveurs", format: "csv" | "json") => {
    window.open(`${API}/rappels/${rappel.id}/export/${type}?format=${format}`, "_blank");
  };

  const nextAction = (() => {
    switch (rappel.statut) {
      case "OUVERT":
        return { action: "notifier" as const, label: "Notifier", icon: Bell, color: "bg-orange-600 hover:bg-orange-700" };
      case "NOTIFIE":
        return { action: "confirmer" as const, label: "Confirmer", icon: CheckCircle, color: "bg-blue-600 hover:bg-blue-700" };
      case "CONFIRME":
        return { action: "cloturer" as const, label: "Clôturer", icon: Lock, color: "bg-green-600 hover:bg-green-700" };
      default:
        return null;
    }
  })();

  // Impact stats
  const impactStats = {
    total: impacts.length,
    distribues: impacts.filter((i) => i.statut_distribution === "DISTRIBUE").length,
    reserves: impacts.filter((i) => i.statut_distribution === "RESERVE").length,
    enStock: impacts.filter((i) => ["DISPONIBLE", "EN_STOCK", "NON_DISTRIBUABLE"].includes(i.statut_distribution)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl font-bold text-zinc-900">
              Rappel {typeCibleBadge(rappel.type_cible)}
              <span className="ml-2 font-mono">{rappel.valeur_cible}</span>
            </h1>
            <span className="ml-2">{statutBadge(rappel.statut)}</span>
          </div>
        </div>
      </div>

      {/* Info + Workflow */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Informations</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Type de cible" value={rappel.type_cible === "DIN" ? "Don individuel (DIN)" : "Lot de poches"} />
            <InfoRow label="Valeur cible" value={rappel.valeur_cible} mono />
            <InfoRow label="Statut" value={rappel.statut} />
            <InfoRow label="Créé le" value={fmtDate(rappel.created_at)} />
            <InfoRow label="Notifié le" value={fmtDate(rappel.notified_at)} />
            <InfoRow label="Confirmé le" value={fmtDate(rappel.confirmed_at)} />
            <InfoRow label="Clôturé le" value={fmtDate(rappel.closed_at)} />
          </div>
          {rappel.motif && (
            <div className="mt-4 rounded-lg bg-red-50 p-3">
              <p className="text-xs font-medium text-red-700 mb-1">Motif du rappel</p>
              <p className="text-sm text-red-900">{rappel.motif}</p>
            </div>
          )}
        </div>

        {/* Workflow Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Workflow</h2>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            <WorkflowStep label="Ouvert" done={true} />
            <WorkflowStep label="Notifié" done={["NOTIFIE", "CONFIRME", "CLOTURE"].includes(rappel.statut)} />
            <WorkflowStep label="Confirmé" done={["CONFIRME", "CLOTURE"].includes(rappel.statut)} />
            <WorkflowStep label="Clôturé" done={rappel.statut === "CLOTURE"} />
          </div>

          {nextAction && (
            <div className="space-y-3">
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={2}
                placeholder="Note (optionnel)..."
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button
                onClick={() => handleWorkflowAction(nextAction.action)}
                disabled={submitting}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${nextAction.color}`}
              >
                <nextAction.icon className="h-4 w-4" />
                {submitting ? "En cours..." : nextAction.label}
              </button>
            </div>
          )}

          {rappel.statut === "CLOTURE" && (
            <p className="text-sm text-green-700 font-medium text-center">Rappel clôturé</p>
          )}
        </div>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Poches impactées</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{impactStats.total}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Distribuées</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{impactStats.distribues}</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Réservées</p>
          <p className="mt-1 text-2xl font-bold text-yellow-700">{impactStats.reserves}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">En stock</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{impactStats.enStock}</p>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-zinc-200">
          <button
            onClick={() => setActiveTab("impacts")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "impacts"
                ? "border-b-2 border-red-600 text-red-600"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Package className="mr-1.5 inline h-4 w-4" />
            Poches impactées ({impacts.length})
          </button>
          <button
            onClick={() => setActiveTab("actions")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "actions"
                ? "border-b-2 border-red-600 text-red-600"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Historique actions ({actions.length})
          </button>
          <div className="flex-1" />
          {impacts.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport("hopitaux", "csv")}
                className="flex items-center gap-1 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export hôpitaux CSV
              </button>
              <button
                onClick={() => handleExport("receveurs", "csv")}
                className="flex items-center gap-1 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export receveurs CSV
              </button>
            </div>
          )}
        </div>

        {/* Impacts Tab */}
        {activeTab === "impacts" && (
          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {loadingImpacts ? (
              <div className="p-8 text-center text-zinc-500">Chargement des impacts...</div>
            ) : impacts.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">Aucune poche impactée trouvée</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3">DIN</th>
                      <th className="px-4 py-3">Produit</th>
                      <th className="px-4 py-3">Lot</th>
                      <th className="px-4 py-3">Distribution</th>
                      <th className="px-4 py-3">Transfusée le</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {impacts.map((imp) => (
                      <tr key={imp.poche_id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 font-mono text-sm">{imp.din}</td>
                        <td className="px-4 py-3">{imp.type_produit}</td>
                        <td className="px-4 py-3 font-mono text-sm text-zinc-600">{imp.lot || "—"}</td>
                        <td className="px-4 py-3">{distributionBadge(imp.statut_distribution)}</td>
                        <td className="px-4 py-3 text-zinc-500">{fmtDate(imp.date_transfusion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === "actions" && (
          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {loadingActions ? (
              <div className="p-8 text-center text-zinc-500">Chargement...</div>
            ) : actions.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">Aucune action enregistrée</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {actions.map((a) => (
                  <div key={a.id} className="flex items-start gap-4 px-5 py-4">
                    <ActionIcon action={a.action} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900">
                          {actionLabel(a.action)}
                        </span>
                        <span className="text-xs text-zinc-400">{fmtDate(a.created_at)}</span>
                      </div>
                      {a.note && <p className="mt-1 text-sm text-zinc-600">{a.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub components ─────────────────────────────

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-sm text-zinc-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function WorkflowStep({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          done ? "bg-green-500 text-white" : "border-2 border-zinc-300 text-zinc-400"
        }`}
      >
        {done ? "✓" : ""}
      </div>
      <span className={`text-sm ${done ? "font-medium text-zinc-900" : "text-zinc-400"}`}>{label}</span>
    </div>
  );
}

function ActionIcon({ action }: { action: string }) {
  const map: Record<string, { bg: string; icon: typeof Bell }> = {
    CREER: { bg: "bg-red-100 text-red-600", icon: Plus },
    NOTIFIER: { bg: "bg-orange-100 text-orange-600", icon: Bell },
    CONFIRMER: { bg: "bg-blue-100 text-blue-600", icon: CheckCircle },
    CLOTURER: { bg: "bg-green-100 text-green-600", icon: Lock },
  };
  const item = map[action] || { bg: "bg-zinc-100 text-zinc-600", icon: AlertTriangle };
  const Icon = item.icon;
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.bg}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    CREER: "Rappel créé",
    NOTIFIER: "Notification envoyée",
    CONFIRMER: "Rappel confirmé",
    CLOTURER: "Rappel clôturé",
  };
  return map[action] || action;
}
