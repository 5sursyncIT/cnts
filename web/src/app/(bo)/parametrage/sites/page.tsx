"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  RefreshCw,
  X,
  MapPin,
  Phone,
  Mail,
  User,
} from "lucide-react";

const API = "/api/backend";

interface Site {
  id: string;
  code: string;
  nom: string;
  type_site: "CENTRAL" | "REGIONAL" | "POSTE";
  adresse: string | null;
  region: string | null;
  telephone: string | null;
  email: string | null;
  responsable_nom: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SiteForm {
  code: string;
  nom: string;
  type_site: "CENTRAL" | "REGIONAL" | "POSTE";
  region: string;
  adresse: string;
  telephone: string;
  email: string;
  responsable_nom: string;
}

const REGIONS_SENEGAL = [
  "Dakar",
  "Diourbel",
  "Fatick",
  "Kaffrine",
  "Kaolack",
  "Kedougou",
  "Kolda",
  "Louga",
  "Matam",
  "Saint-Louis",
  "Sedhiou",
  "Tambacounda",
  "Thies",
  "Ziguinchor",
];

const emptyForm: SiteForm = {
  code: "",
  nom: "",
  type_site: "POSTE",
  region: "",
  adresse: "",
  telephone: "",
  email: "",
  responsable_nom: "",
};

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState<SiteForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/sites?offset=0&limit=200`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setSites(Array.isArray(data) ? data : data.items ?? []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleOpenCreate = () => {
    setEditingSite(null);
    setFormData(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (site: Site) => {
    setEditingSite(site);
    setFormData({
      code: site.code,
      nom: site.nom,
      type_site: site.type_site,
      region: site.region || "",
      adresse: site.adresse || "",
      telephone: site.telephone || "",
      email: site.email || "",
      responsable_nom: site.responsable_nom || "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingSite(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const payload: Record<string, any> = {
      code: formData.code,
      nom: formData.nom,
      type_site: formData.type_site,
      region: formData.region || undefined,
      adresse: formData.adresse || undefined,
      telephone: formData.telephone || undefined,
      email: formData.email || undefined,
      responsable_nom: formData.responsable_nom || undefined,
    };

    try {
      const url = editingSite
        ? `${API}/sites/${editingSite.id}`
        : `${API}/sites`;
      const method = editingSite ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Erreur ${res.status}`);
      }

      await fetchSites();
      handleClose();
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "CENTRAL":
        return "bg-red-100 text-red-900";
      case "REGIONAL":
        return "bg-blue-100 text-blue-900";
      case "POSTE":
        return "bg-gray-100 text-gray-900";
      default:
        return "bg-gray-100 text-gray-900";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Sites &amp; Centres
          </h1>
          <p className="text-gray-700 mt-1">
            Gestion des sites de transfusion sanguine du CNTS
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau Site
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-700">
          Chargement...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-red-600 mb-2">Erreur de chargement</div>
          <div className="text-sm text-gray-800">{error}</div>
          <button
            onClick={fetchSites}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reessayer
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          {sites.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-700">
              Aucun site enregistre
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Responsable
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
                    {sites.map((site) => (
                      <tr
                        key={site.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {site.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {site.nom}
                          </div>
                          {site.adresse && (
                            <div className="text-xs text-gray-700 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {site.adresse}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadge(site.type_site)}`}
                          >
                            {site.type_site}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {site.region || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {site.responsable_nom || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              site.is_active
                                ? "bg-green-100 text-green-900"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {site.is_active ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleOpenEdit(site)}
                            className="text-blue-700 hover:text-blue-900 font-semibold hover:underline"
                          >
                            Modifier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer count */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-800">
              {sites.length} site(s) affiche(s)
            </div>
            <button
              onClick={fetchSites}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSite ? "Modifier le site" : "Nouveau site"}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Ex: CNTS-DKR"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de site *
                  </label>
                  <select
                    required
                    value={formData.type_site}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type_site: e.target.value as
                          | "CENTRAL"
                          | "REGIONAL"
                          | "POSTE",
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="CENTRAL">Central</option>
                    <option value="REGIONAL">Regional</option>
                    <option value="POSTE">Poste de collecte</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'etablissement *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Ex: Centre National de Transfusion Sanguine"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Region
                </label>
                <select
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">-- Selectionner --</option>
                  {REGIONS_SENEGAL.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Adresse complete"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-3.5 h-3.5 inline mr-1" />
                    Telephone
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) =>
                      setFormData({ ...formData, telephone: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="+221 33 ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-3.5 h-3.5 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="contact@site.sn"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-3.5 h-3.5 inline mr-1" />
                  Responsable
                </label>
                <input
                  type="text"
                  value={formData.responsable_nom}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      responsable_nom: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Nom du responsable"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
