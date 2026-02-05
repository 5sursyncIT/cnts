"use client";

import { useProductRule, useUpsertProductRule } from "@cnts/api";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export default function EditRegleProduitPage() {
    const params = useParams();
    const router = useRouter();
    const typeProduit = params.type as string;

    const { data: regle, status } = useProductRule(apiClient, typeProduit);
    const updateMutation = useUpsertProductRule(apiClient);

    const [formData, setFormData] = useState({
        shelf_life_days: 0,
        default_volume_ml: 0,
        min_volume_ml: 0,
        max_volume_ml: 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (regle) {
            setFormData({
                shelf_life_days: regle.shelf_life_days,
                default_volume_ml: regle.default_volume_ml ?? 0,
                min_volume_ml: regle.min_volume_ml ?? 0,
                max_volume_ml: regle.max_volume_ml ?? 0,
            });
        }
    }, [regle]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (formData.shelf_life_days <= 0) {
            newErrors.shelf_life_days = "La durée de vie doit être supérieure à 0";
        }

        if (formData.default_volume_ml <= 0) {
            newErrors.default_volume_ml = "Le volume par défaut doit être supérieur à 0";
        }

        if (formData.min_volume_ml <= 0) {
            newErrors.min_volume_ml = "Le volume minimum doit être supérieur à 0";
        }

        if (formData.max_volume_ml <= 0) {
            newErrors.max_volume_ml = "Le volume maximum doit être supérieur à 0";
        }

        if (formData.min_volume_ml > formData.default_volume_ml) {
            newErrors.min_volume_ml = "Le volume minimum ne peut pas être supérieur au volume par défaut";
        }

        if (formData.default_volume_ml > formData.max_volume_ml) {
            newErrors.default_volume_ml = "Le volume par défaut ne peut pas être supérieur au volume maximum";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        try {
            await updateMutation.mutate({
                typeProduit,
                data: formData,
            });
            alert("Règle mise à jour avec succès");
            router.push("/parametrage/regles-produits");
        } catch (error: any) {
            alert(`Erreur: ${error?.body?.detail || "Échec de la mise à jour"}`);
        }
    };

    if (status === "loading") {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <div className="text-center text-gray-700">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Modifier Règle - {typeProduit}</h1>
                <p className="text-gray-700 mt-1">
                    Configuration de la durée de vie et des volumes
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit}>
                    {/* Shelf Life Days */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Durée de Vie (jours) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.shelf_life_days}
                            onChange={(e) =>
                                setFormData({ ...formData, shelf_life_days: parseInt(e.target.value) || 0 })
                            }
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${errors.shelf_life_days ? "border-red-500" : "border-gray-300"
                                }`}
                        />
                        {errors.shelf_life_days && (
                            <p className="text-red-500 text-sm mt-1">{errors.shelf_life_days}</p>
                        )}
                    </div>

                    {/* Default Volume */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Volume par Défaut (ml) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.default_volume_ml}
                            onChange={(e) =>
                                setFormData({ ...formData, default_volume_ml: parseInt(e.target.value) || 0 })
                            }
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${errors.default_volume_ml ? "border-red-500" : "border-gray-300"
                                }`}
                        />
                        {errors.default_volume_ml && (
                            <p className="text-red-500 text-sm mt-1">{errors.default_volume_ml}</p>
                        )}
                    </div>

                    {/* Min Volume */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Volume Minimum (ml) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.min_volume_ml}
                            onChange={(e) =>
                                setFormData({ ...formData, min_volume_ml: parseInt(e.target.value) || 0 })
                            }
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${errors.min_volume_ml ? "border-red-500" : "border-gray-300"
                                }`}
                        />
                        {errors.min_volume_ml && (
                            <p className="text-red-500 text-sm mt-1">{errors.min_volume_ml}</p>
                        )}
                    </div>

                    {/* Max Volume */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Volume Maximum (ml) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.max_volume_ml}
                            onChange={(e) =>
                                setFormData({ ...formData, max_volume_ml: parseInt(e.target.value) || 0 })
                            }
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.max_volume_ml ? "border-red-500" : "border-gray-300"
                                }`}
                        />
                        {errors.max_volume_ml && (
                            <p className="text-red-500 text-sm mt-1">{errors.max_volume_ml}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="submit"
                            disabled={updateMutation.isLoading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
                        >
                            {updateMutation.isLoading ? "Enregistrement..." : "Enregistrer"}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>

            {/* Info */}
            <div className="mt-4 text-sm text-gray-800 bg-yellow-50 border border-yellow-200 rounded p-4">
                <strong>⚠️ Attention:</strong> Les modifications s'appliqueront aux nouvelles poches créées, pas aux poches existantes.
            </div>
        </div>
    );
}
