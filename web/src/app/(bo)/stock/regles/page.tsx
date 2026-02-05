"use client";

import { useProductRules } from "@cnts/api";
import type { ProductRule } from "@cnts/api";
import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function ProductRulesPage() {
  const { data: rules, refetch, status } = useProductRules(apiClient);
  const [editingRule, setEditingRule] = useState<ProductRule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (rule: ProductRule) => {
    setEditingRule({ ...rule });
    setError(null);
  };

  const handleCancel = () => {
    setEditingRule(null);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.stock.upsertProductRule(editingRule.type_produit, {
        shelf_life_days: editingRule.shelf_life_days,
        default_volume_ml: editingRule.default_volume_ml || undefined,
        min_volume_ml: editingRule.min_volume_ml || undefined,
        max_volume_ml: editingRule.max_volume_ml || undefined,
      });
      await refetch();
      setEditingRule(null);
    } catch (err: any) {
      setError(err.body?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    field: keyof ProductRule,
    value: string | number | null
  ) => {
    if (!editingRule) return;

    // Convert inputs to numbers or null
    let numValue: number | null = null;
    if (value !== "" && value !== null) {
      numValue = Number(value);
    }

    setEditingRule({
      ...editingRule,
      [field]: numValue,
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ST: "Sang Total (ST)",
      CGR: "Concentré de Globules Rouges (CGR)",
      PFC: "Plasma Frais Congelé (PFC)",
      CP: "Concentré Plaquettaire (CP)",
    };
    return labels[type] || type;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/stock"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Retour au stock
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Règles Produits</h1>
          <p className="text-gray-700 mt-1">
            Configuration des durées de vie et volumes par type de produit
          </p>
        </div>
      </div>

      {status === "loading" && (
        <div className="text-center py-10">Chargement...</div>
      )}

      {status === "error" && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          Une erreur est survenue lors du chargement des règles.
        </div>
      )}

      {status === "success" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type de Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Durée de vie (jours)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Volume par défaut (ml)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Volume Min (ml)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Volume Max (ml)
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules?.map((rule) => (
                <tr key={rule.type_produit} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {rule.type_produit}
                    </div>
                    <div className="text-sm text-gray-700">
                      {getTypeLabel(rule.type_produit)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.shelf_life_days}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.default_volume_ml || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.min_volume_ml || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.max_volume_ml || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              Modifier règle {editingRule.type_produit}
            </h2>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée de vie (jours)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="3650"
                  value={editingRule.shelf_life_days}
                  onChange={(e) =>
                    handleChange("shelf_life_days", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volume par défaut (ml)
                </label>
                <input
                  type="number"
                  min="0"
                  max="2000"
                  value={editingRule.default_volume_ml || ""}
                  onChange={(e) =>
                    handleChange("default_volume_ml", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volume Min (ml)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="2000"
                    value={editingRule.min_volume_ml || ""}
                    onChange={(e) =>
                      handleChange("min_volume_ml", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volume Max (ml)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="2000"
                    value={editingRule.max_volume_ml || ""}
                    onChange={(e) =>
                      handleChange("max_volume_ml", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
