"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  AlertTriangle,
  CheckSquare,
  ClipboardCheck,
  Plus,
  X,
  Eye,
  RefreshCw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentQualite {
  id: string;
  code: string;
  titre: string;
  type_document: "PROCEDURE" | "MODE_OPERATOIRE" | "FORMULAIRE" | "ENREGISTREMENT" | "POLITIQUE";
  version: string;
  statut: "BROUILLON" | "EN_REVUE" | "APPROUVE" | "OBSOLETE";
  fichier_url: string | null;
  date_approbation: string | null;
  date_revision: string | null;
  created_at: string;
}

interface NonConformite {
  id: string;
  code: string;
  titre: string;
  description: string;
  type_nc: "PRODUIT" | "PROCESSUS" | "EQUIPEMENT" | "DOCUMENT" | "PERSONNEL" | "AUTRE";
  gravite: "MINEURE" | "MAJEURE" | "CRITIQUE";
  statut: "OUVERTE" | "EN_INVESTIGATION" | "ACTION_CORRECTIVE" | "VERIFIEE" | "CLOTUREE";
  cause_racine: string | null;
  action_immediate: string | null;
  action_corrective: string | null;
  date_cloture: string | null;
  created_at: string;
}

interface CAPA {
  id: string;
  code: string;
  non_conformite_id: string | null;
  type_action: "CORRECTIVE" | "PREVENTIVE";
  description: string;
  date_echeance: string;
  statut: "PLANIFIEE" | "EN_COURS" | "REALISEE" | "VERIFIEE" | "EFFICACE" | "INEFFICACE";
  verification: string | null;
  efficacite: string | null;
  created_at: string;
}

interface AuditInterne {
  id: string;
  code: string;
  titre: string;
  processus_audite: string;
  date_audit: string;
  statut: "PLANIFIE" | "EN_COURS" | "RAPPORT_REDIGE" | "CLOTURE";
  constats: string | null;
  conclusion: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API = "/api/backend";

type TabKey = "documents" | "nc" | "capa" | "audits";

const TABS: { key: TabKey; label: string }[] = [
  { key: "documents", label: "Documents" },
  { key: "nc", label: "Non-Conformit\u00e9s" },
  { key: "capa", label: "CAPA" },
  { key: "audits", label: "Audits" },
];

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

function docTypeBadge(type: DocumentQualite["type_document"]) {
  const map: Record<string, string> = {
    PROCEDURE: "bg-blue-100 text-blue-800",
    MODE_OPERATOIRE: "bg-indigo-100 text-indigo-800",
    FORMULAIRE: "bg-purple-100 text-purple-800",
    ENREGISTREMENT: "bg-teal-100 text-teal-800",
    POLITIQUE: "bg-gray-100 text-gray-800",
  };
  return map[type] || "bg-gray-100 text-gray-800";
}

function docStatutBadge(statut: DocumentQualite["statut"]) {
  const map: Record<string, string> = {
    BROUILLON: "bg-gray-100 text-gray-800",
    EN_REVUE: "bg-yellow-100 text-yellow-800",
    APPROUVE: "bg-green-100 text-green-800",
    OBSOLETE: "bg-red-100 text-red-800",
  };
  return map[statut] || "bg-gray-100 text-gray-800";
}

function ncGraviteBadge(gravite: NonConformite["gravite"]) {
  const map: Record<string, string> = {
    CRITIQUE: "bg-red-100 text-red-800",
    MAJEURE: "bg-orange-100 text-orange-800",
    MINEURE: "bg-yellow-100 text-yellow-800",
  };
  return map[gravite] || "bg-gray-100 text-gray-800";
}

function ncStatutBadge(statut: NonConformite["statut"]) {
  const map: Record<string, string> = {
    OUVERTE: "bg-red-100 text-red-800",
    EN_INVESTIGATION: "bg-yellow-100 text-yellow-800",
    ACTION_CORRECTIVE: "bg-blue-100 text-blue-800",
    VERIFIEE: "bg-indigo-100 text-indigo-800",
    CLOTUREE: "bg-green-100 text-green-800",
  };
  return map[statut] || "bg-gray-100 text-gray-800";
}

function capaTypeBadge(type: CAPA["type_action"]) {
  return type === "CORRECTIVE"
    ? "bg-blue-100 text-blue-800"
    : "bg-green-100 text-green-800";
}

function capaStatutBadge(statut: CAPA["statut"]) {
  const map: Record<string, string> = {
    PLANIFIEE: "bg-gray-100 text-gray-800",
    EN_COURS: "bg-blue-100 text-blue-800",
    REALISEE: "bg-indigo-100 text-indigo-800",
    VERIFIEE: "bg-purple-100 text-purple-800",
    EFFICACE: "bg-green-100 text-green-800",
    INEFFICACE: "bg-red-100 text-red-800",
  };
  return map[statut] || "bg-gray-100 text-gray-800";
}

function auditStatutBadge(statut: AuditInterne["statut"]) {
  const map: Record<string, string> = {
    PLANIFIE: "bg-gray-100 text-gray-800",
    EN_COURS: "bg-blue-100 text-blue-800",
    RAPPORT_REDIGE: "bg-indigo-100 text-indigo-800",
    CLOTURE: "bg-green-100 text-green-800",
  };
  return map[statut] || "bg-gray-100 text-gray-800";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function QualitePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("documents");

  // Data state
  const [documents, setDocuments] = useState<DocumentQualite[]>([]);
  const [ncs, setNcs] = useState<NonConformite[]>([]);
  const [capas, setCapas] = useState<CAPA[]>([]);
  const [audits, setAudits] = useState<AuditInterne[]>([]);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ------ Fetch all data ------
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docRes, ncRes, capaRes, auditRes] = await Promise.all([
        fetch(`${API}/qualite/documents`),
        fetch(`${API}/qualite/non-conformites`),
        fetch(`${API}/qualite/capa`),
        fetch(`${API}/qualite/audits`),
      ]);

      if (!docRes.ok || !ncRes.ok || !capaRes.ok || !auditRes.ok) {
        throw new Error("Erreur lors du chargement des donn\u00e9es");
      }

      const [docData, ncData, capaData, auditData] = await Promise.all([
        docRes.json(),
        ncRes.json(),
        capaRes.json(),
        auditRes.json(),
      ]);

      setDocuments(Array.isArray(docData) ? docData : []);
      setNcs(Array.isArray(ncData) ? ncData : []);
      setCapas(Array.isArray(capaData) ? capaData : []);
      setAudits(Array.isArray(auditData) ? auditData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ------ Summary stats ------
  const totalDocuments = documents.length;
  const ncOuvertes = ncs.filter(
    (nc) => nc.statut !== "CLOTUREE" && nc.statut !== "VERIFIEE"
  ).length;
  const capaEnCours = capas.filter(
    (c) => c.statut === "EN_COURS" || c.statut === "PLANIFIEE"
  ).length;
  const auditsPlanifies = audits.filter((a) => a.statut === "PLANIFIE").length;

  // ------ Create handlers ------
  async function handleCreateDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const body = {
      titre: form.get("titre") as string,
      type_document: form.get("type_document") as string,
      version: form.get("version") as string,
    };
    try {
      const res = await fetch(`${API}/qualite/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur lors de la cr\u00e9ation");
      setModalOpen(false);
      await fetchAll();
    } catch {
      alert("Erreur lors de la cr\u00e9ation du document.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateNC(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const body = {
      titre: form.get("titre") as string,
      description: form.get("description") as string,
      type_nc: form.get("type_nc") as string,
      gravite: form.get("gravite") as string,
    };
    try {
      const res = await fetch(`${API}/qualite/non-conformites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur lors de la cr\u00e9ation");
      setModalOpen(false);
      await fetchAll();
    } catch {
      alert("Erreur lors de la cr\u00e9ation de la non-conformit\u00e9.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateCAPA(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const body = {
      type_action: form.get("type_action") as string,
      description: form.get("description") as string,
      date_echeance: form.get("date_echeance") as string,
      non_conformite_id: (form.get("non_conformite_id") as string) || null,
    };
    try {
      const res = await fetch(`${API}/qualite/capa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur lors de la cr\u00e9ation");
      setModalOpen(false);
      await fetchAll();
    } catch {
      alert("Erreur lors de la cr\u00e9ation de la CAPA.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateAudit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const body = {
      titre: form.get("titre") as string,
      processus_audite: form.get("processus_audite") as string,
      date_audit: form.get("date_audit") as string,
    };
    try {
      const res = await fetch(`${API}/qualite/audits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur lors de la cr\u00e9ation");
      setModalOpen(false);
      await fetchAll();
    } catch {
      alert("Erreur lors de la cr\u00e9ation de l\u2019audit.");
    } finally {
      setSubmitting(false);
    }
  }

  // ------ Render ------
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Syst\u00e8me Management Qualit\u00e9 (SMQ)
        </h1>
        <p className="text-gray-700 mt-1">
          Gestion documentaire, non-conformit\u00e9s, actions correctives et audits internes
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-gray-700 mb-0.5">Total Documents</div>
              <div className="text-2xl font-bold text-gray-900">{totalDocuments}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-gray-700 mb-0.5">NC Ouvertes</div>
              <div className="text-2xl font-bold text-gray-900">{ncOuvertes}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-gray-700 mb-0.5">CAPA en cours</div>
              <div className="text-2xl font-bold text-gray-900">{capaEnCours}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-gray-700 mb-0.5">Audits planifi\u00e9s</div>
              <div className="text-2xl font-bold text-gray-900">{auditsPlanifies}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={fetchAll}
            className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
            title="Actualiser"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Nouveau
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="p-8 text-center text-gray-700">Chargement...</div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="p-8 text-center">
          <div className="text-red-600 mb-2">{error}</div>
          <button
            onClick={fetchAll}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            R\u00e9essayer
          </button>
        </div>
      )}

      {/* Tab content */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow">
          {/* ==================== DOCUMENTS ==================== */}
          {activeTab === "documents" && (
            <div className="overflow-x-auto">
              {documents.length === 0 ? (
                <div className="p-8 text-center text-gray-700">
                  Aucun document qualit\u00e9 enregistr\u00e9
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Titre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Version
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date r\u00e9vision
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {doc.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {doc.titre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${docTypeBadge(doc.type_document)}`}
                          >
                            {doc.type_document.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {doc.version}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${docStatutBadge(doc.statut)}`}
                          >
                            {doc.statut.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {formatDate(doc.date_revision)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() =>
                              window.open(
                                doc.fichier_url || "#",
                                "_blank"
                              )
                            }
                            className="text-blue-700 hover:text-blue-900 p-1"
                            title="Voir le document"
                          >
                            <Eye className="h-4 w-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ==================== NON-CONFORMITES ==================== */}
          {activeTab === "nc" && (
            <div className="overflow-x-auto">
              {ncs.length === 0 ? (
                <div className="p-8 text-center text-gray-700">
                  Aucune non-conformit\u00e9 enregistr\u00e9e
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Titre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Gravit\u00e9
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ncs.map((nc) => (
                      <tr key={nc.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {nc.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {nc.titre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {nc.type_nc}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${ncGraviteBadge(nc.gravite)}`}
                          >
                            {nc.gravite}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${ncStatutBadge(nc.statut)}`}
                          >
                            {nc.statut.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {formatDate(nc.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            className="text-blue-700 hover:text-blue-900 p-1"
                            title="Voir le d\u00e9tail"
                          >
                            <Eye className="h-4 w-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ==================== CAPA ==================== */}
          {activeTab === "capa" && (
            <div className="overflow-x-auto">
              {capas.length === 0 ? (
                <div className="p-8 text-center text-gray-700">
                  Aucune action corrective ou pr\u00e9ventive enregistr\u00e9e
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        \u00c9ch\u00e9ance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {capas.map((capa) => (
                      <tr key={capa.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {capa.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${capaTypeBadge(capa.type_action)}`}
                          >
                            {capa.type_action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate">
                          {capa.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {formatDate(capa.date_echeance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${capaStatutBadge(capa.statut)}`}
                          >
                            {capa.statut.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            className="text-blue-700 hover:text-blue-900 p-1"
                            title="Voir le d\u00e9tail"
                          >
                            <Eye className="h-4 w-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ==================== AUDITS ==================== */}
          {activeTab === "audits" && (
            <div className="overflow-x-auto">
              {audits.length === 0 ? (
                <div className="p-8 text-center text-gray-700">
                  Aucun audit interne enregistr\u00e9
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Titre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Processus
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {audits.map((audit) => (
                      <tr key={audit.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {audit.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {audit.titre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {audit.processus_audite}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {formatDate(audit.date_audit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${auditStatutBadge(audit.statut)}`}
                          >
                            {audit.statut.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            className="text-blue-700 hover:text-blue-900 p-1"
                            title="Voir le d\u00e9tail"
                          >
                            <Eye className="h-4 w-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer count */}
      {!loading && !error && (
        <div className="mt-4 text-sm text-gray-800 text-right">
          {activeTab === "documents" && `${documents.length} document(s)`}
          {activeTab === "nc" && `${ncs.length} non-conformit\u00e9(s)`}
          {activeTab === "capa" && `${capas.length} action(s)`}
          {activeTab === "audits" && `${audits.length} audit(s)`}
        </div>
      )}

      {/* ==================== CREATION MODAL ==================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setModalOpen(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeTab === "documents" && "Nouveau Document Qualit\u00e9"}
                {activeTab === "nc" && "Nouvelle Non-Conformit\u00e9"}
                {activeTab === "capa" && "Nouvelle CAPA"}
                {activeTab === "audits" && "Nouvel Audit Interne"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-700 hover:text-gray-900 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              {/* ---- Document Form ---- */}
              {activeTab === "documents" && (
                <form onSubmit={handleCreateDocument} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titre
                    </label>
                    <input
                      name="titre"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Titre du document"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de document
                    </label>
                    <select
                      name="type_document"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="PROCEDURE">Proc\u00e9dure</option>
                      <option value="MODE_OPERATOIRE">Mode op\u00e9ratoire</option>
                      <option value="FORMULAIRE">Formulaire</option>
                      <option value="ENREGISTREMENT">Enregistrement</option>
                      <option value="POLITIQUE">Politique</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Version
                    </label>
                    <input
                      name="version"
                      required
                      defaultValue="1.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="1.0"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {submitting ? "Cr\u00e9ation..." : "Cr\u00e9er"}
                    </button>
                  </div>
                </form>
              )}

              {/* ---- NC Form ---- */}
              {activeTab === "nc" && (
                <form onSubmit={handleCreateNC} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titre
                    </label>
                    <input
                      name="titre"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Titre de la non-conformit\u00e9"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Description d\u00e9taill\u00e9e..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        name="type_nc"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="PRODUIT">Produit</option>
                        <option value="PROCESSUS">Processus</option>
                        <option value="EQUIPEMENT">\u00c9quipement</option>
                        <option value="DOCUMENT">Document</option>
                        <option value="PERSONNEL">Personnel</option>
                        <option value="AUTRE">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gravit\u00e9
                      </label>
                      <select
                        name="gravite"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="MINEURE">Mineure</option>
                        <option value="MAJEURE">Majeure</option>
                        <option value="CRITIQUE">Critique</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {submitting ? "Cr\u00e9ation..." : "Cr\u00e9er"}
                    </button>
                  </div>
                </form>
              )}

              {/* ---- CAPA Form ---- */}
              {activeTab === "capa" && (
                <form onSubmit={handleCreateCAPA} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type d&apos;action
                    </label>
                    <select
                      name="type_action"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="CORRECTIVE">Corrective</option>
                      <option value="PREVENTIVE">Pr\u00e9ventive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Description de l\u2019action..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d&apos;\u00e9ch\u00e9ance
                    </label>
                    <input
                      name="date_echeance"
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Non-conformit\u00e9 associ\u00e9e (optionnel)
                    </label>
                    <select
                      name="non_conformite_id"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="">Aucune</option>
                      {ncs.map((nc) => (
                        <option key={nc.id} value={nc.id}>
                          {nc.code} - {nc.titre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {submitting ? "Cr\u00e9ation..." : "Cr\u00e9er"}
                    </button>
                  </div>
                </form>
              )}

              {/* ---- Audit Form ---- */}
              {activeTab === "audits" && (
                <form onSubmit={handleCreateAudit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titre
                    </label>
                    <input
                      name="titre"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Titre de l\u2019audit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Processus audit\u00e9
                    </label>
                    <input
                      name="processus_audite"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Ex: Collecte, Laboratoire, Distribution..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de l&apos;audit
                    </label>
                    <input
                      name="date_audit"
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {submitting ? "Cr\u00e9ation..." : "Cr\u00e9er"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
