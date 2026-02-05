"use client";

import React, { useState } from 'react';
import {
  useCreateExpirationRule,
  useDeleteExpirationRule,
  useExpirationRules,
  useUpdateExpirationRule,
  type ExpirationRule,
} from "@cnts/api";
import { Plus, Edit2, Trash2, Copy, AlertCircle, CheckCircle, History, Save, X } from 'lucide-react';
import { apiClient } from "@/lib/api-client";

const PRODUCT_TYPES = [
  { value: 'CGR', label: 'Concentré de Globules Rouges' },
  { value: 'PFC', label: 'Plasma Frais Congelé' },
  { value: 'CPA', label: 'Concentré de Plaquettes d\'Aphérèse' },
  { value: 'CPS', label: 'Concentré de Plaquettes Standard' },
  { value: 'ST', label: 'Sang Total' },
];

const PRESERVATION_TYPES = [
  { value: 'REFRIGERATED', label: 'Réfrigéré (+2°C à +6°C)' },
  { value: 'FROZEN', label: 'Congelé (<-25°C)' },
  { value: 'AMBIENT', label: 'Ambiant (+20°C à +24°C)' },
];

// --- Mock Data ---

const INITIAL_RULES: ExpirationRule[] = [
  {
    id: '1',
    product_type: 'CGR',
    preservation_type: 'REFRIGERATED',
    min_temp: 2,
    max_temp: 6,
    shelf_life_value: 42,
    shelf_life_unit: 'DAYS',
    is_active: true,
    modified_by: 'Admin',
    version: 1,
    created_at: '2023-10-25T10:00:00Z',
    updated_at: '2023-10-25T10:00:00Z',
  },
  {
    id: '2',
    product_type: 'PFC',
    preservation_type: 'FROZEN',
    min_temp: -30,
    max_temp: -25,
    shelf_life_value: 1,
    shelf_life_unit: 'YEARS',
    is_active: true,
    modified_by: 'Admin',
    version: 1,
    created_at: '2023-10-20T14:30:00Z',
    updated_at: '2023-10-20T14:30:00Z',
  },
];

// --- Components ---

export default function ExpirationRulesPage() {
  const { data: rules, status, error, refetch } = useExpirationRules(apiClient);
  const createRule = useCreateExpirationRule(apiClient);
  const updateRule = useUpdateExpirationRule(apiClient);
  const deleteRule = useDeleteExpirationRule(apiClient);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRule, setCurrentRule] = useState<Partial<ExpirationRule>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHistory, setShowHistory] = useState(false);
  const resolvedRules = rules?.length ? rules : INITIAL_RULES;

  // --- Actions ---

  const handleAdd = () => {
    setCurrentRule({
      product_type: 'CGR',
      preservation_type: 'REFRIGERATED',
      shelf_life_unit: 'DAYS',
      is_active: true,
      min_temp: 2,
      max_temp: 6,
      shelf_life_value: 0
    });
    setErrors({});
    setIsEditing(true);
  };

  const handleEdit = (rule: ExpirationRule) => {
    setCurrentRule({ ...rule });
    setErrors({});
    setIsEditing(true);
  };

  const handleDuplicate = (rule: ExpirationRule) => {
    const newRule = {
      ...rule,
      product_type: rule.product_type + ' (Copie)',
      version: 1,
      updated_at: new Date().toISOString(),
    };
    setCurrentRule(newRule);
    setErrors({});
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      try {
        await deleteRule.mutate(id);
        await refetch();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const validate = (rule: Partial<ExpirationRule>): boolean => {
    const newErrors: Record<string, string> = {};

    if (!rule.product_type) newErrors.productType = 'Le type de produit est requis';
    if (rule.min_temp !== undefined && rule.max_temp !== undefined && rule.min_temp > rule.max_temp) {
      newErrors.temp = 'La température minimale ne peut pas être supérieure à la maximale';
    }
    if (!rule.shelf_life_value || rule.shelf_life_value <= 0) {
      newErrors.shelfLife = 'La durée de conservation doit être positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate(currentRule)) return;

    try {
      if (currentRule.id) {
        await updateRule.mutate({ id: currentRule.id, data: currentRule as any });
      } else {
        await createRule.mutate(currentRule as any);
      }
      await refetch();
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Règles de Péremption</h1>
          <p className="text-gray-500">Configuration des durées de vie et conditions de conservation des produits sanguins.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <History size={18} />
            Historique
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Nouvelle Règle
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{currentRule.id ? 'Modifier la règle' : 'Nouvelle règle'}</h2>
            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-800">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de Produit</label>
              <select
                value={currentRule.product_type}
                onChange={(e) => setCurrentRule({ ...currentRule, product_type: e.target.value })}
                className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {errors.productType && <p className="text-red-500 text-sm mt-1">{errors.productType}</p>}
            </div>

            {/* Preservation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de Conservation</label>
              <select
                value={currentRule.preservation_type}
                onChange={(e) => setCurrentRule({ ...currentRule, preservation_type: e.target.value as any })}
                className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                {PRESERVATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Temperature Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plage de Température (°C)</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={currentRule.min_temp}
                    onChange={(e) => setCurrentRule({ ...currentRule, min_temp: Number(e.target.value) })}
                    className="w-full rounded-lg border-gray-300 border p-2 text-gray-900"
                  />
                </div>
                <span className="text-gray-500">à</span>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Max"
                    value={currentRule.max_temp}
                    onChange={(e) => setCurrentRule({ ...currentRule, max_temp: Number(e.target.value) })}
                    className="w-full rounded-lg border-gray-300 border p-2 text-gray-900"
                  />
                </div>
              </div>
              {errors.temp && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                  <AlertCircle size={16} />
                  {errors.temp}
                </div>
              )}
            </div>

            {/* Shelf Life */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée de Conservation</label>
              <div className="flex gap-4">
                <input
                  type="number"
                  value={currentRule.shelf_life_value}
                  onChange={(e) => setCurrentRule({ ...currentRule, shelf_life_value: Number(e.target.value) })}
                  className="flex-1 rounded-lg border-gray-300 border p-2 text-gray-900"
                />
                <select
                  value={currentRule.shelf_life_unit}
                  onChange={(e) => setCurrentRule({ ...currentRule, shelf_life_unit: e.target.value as any })}
                  className="w-40 rounded-lg border-gray-300 border p-2 text-gray-900"
                >
                  <option value="HOURS">Heures</option>
                  <option value="DAYS">Jours</option>
                  <option value="MONTHS">Mois</option>
                  <option value="YEARS">Années</option>
                </select>
              </div>
              {errors.shelfLife && <p className="text-red-500 text-sm mt-1">{errors.shelfLife}</p>}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={currentRule.is_active}
                onChange={(e) => setCurrentRule({ ...currentRule, is_active: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Règle active</label>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save size={18} />
              Enregistrer
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {status === "loading" && (
            <div className="p-6 text-center text-gray-700">Chargement...</div>
          )}
          {status === "error" && (
            <div className="p-6 text-center text-red-600">
              {error?.body?.detail || "Erreur lors du chargement des règles."}
            </div>
          )}
          {status !== "loading" && status !== "error" && (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Produit</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Conservation</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Température</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Durée de vie</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resolvedRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{rule.product_type}</span>
                      <div className="text-xs text-gray-500">v{rule.version}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {PRESERVATION_TYPES.find(t => t.value === rule.preservation_type)?.label}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {rule.min_temp}°C à {rule.max_temp}°C
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {rule.shelf_life_value} {rule.shelf_life_unit.toLowerCase()}
                    </td>
                    <td className="px-6 py-4">
                      {rule.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-900">
                          <CheckCircle size={12} className="mr-1" /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(rule)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDuplicate(rule)} className="p-1 text-gray-400 hover:text-green-600 rounded">
                          <Copy size={18} />
                        </button>
                        <button onClick={() => handleDelete(rule.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
