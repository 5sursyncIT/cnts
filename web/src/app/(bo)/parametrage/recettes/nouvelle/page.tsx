"use client";

import { useCreateRecette } from "@cnts/api";
import type { ComposantRecette } from "@cnts/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function NouvelleRecettePage() {
    const router = useRouter();
    const createMutation = useCreateRecette(apiClient);

    const [formData, setFormData] = useState({
        code: "",
        libelle: "",
        site_code: "",
        type_source: "ST",
        actif: true,
    });

    const [composants, setComposants] = useState<ComposantRecette[]>([
        { type_produit: "CGR", volume_ml: 280, quantite: 1 },
    ]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.code.trim()) {
            newErrors.code = "Le code est requis";
        } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
            newErrors.code = "Le code doit être en majuscules (A-Z, 0-9, _)";
        }

        if (!formData.libelle.trim()) {
            newErrors.libelle = "Le libellé est requis";
        }

        if (composants.length === 0) {
            newErrors.composants = "Au moins un composant est requis";
        }

        composants.forEach((c, i) => {
            if (c.volume_ml <= 0) {
                newErrors[`composant_${i}_volume`] = "Le volume doit être > 0";
            }
            if (c.quantite <= 0) {
                newErrors[`composant_${i}_quantite`] = "La quantité doit être > 0";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        try {
            await createMutation.mutate({
                code: formData.code.trim().toUpperCase(),
                libelle: formData.libelle.trim(),
                site_code: formData.site_code.trim() || undefined,
                type_source: formData.type_source,
                actif: formData.actif,
                composants,
            });
            alert("Recette créée avec succès");
            router.push("/parametrage/recettes");
        } catch (error: any) {
            alert(`Erreur: ${error?.body?.detail || "Échec de la création"}`);
        }
    };

    const addComposant = () => {
        setComposants([...composants, { type_produit: "CGR", volume_ml: 280, quantite: 1 }]);
    };

    const removeComposant = (index: number) => {
        setComposants(composants.filter((_, i) => i !== index));
    };

    const updateComposant = (index: number, field: keyof ComposantRecette, value: any) => {
        const updated = [...composants];
        updated[index] = { ...updated[index], [field]: value };
        setComposants(updated);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Nouvelle Recette de Fractionnement</h1>
                <p className="text-gray-700 mt-1">
                    Créer une nouvelle recette prédéfinie pour le fractionnement
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit}>
                    {/* Code */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) =>
                                setFormData({ ...formData, code: e.target.value.toUpperCase() })
                            }
                            placeholder="ex: ST_STANDARD"
                            className={`w-full font-mono px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${errors.code ? "border-red-500" : "border-gray-300"
                                }`}
                        />
                        {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                        <p className="text-gray-500 text-xs mt-1">
                            Identifiant unique (majuscules, chiffres, underscore uniquement)
                        </p>
                    </div>

                    {/* Libellé */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Libellé <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.libelle}
                            onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                            placeholder="ex: Fractionnement standard du sang total"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.libelle ? "border-red-500" : "border-gray-300"
                                }`}
                        />
                        {errors.libelle && (
                            <p className="text-red-500 text-sm mt-1">{errors.libelle}</p>
                        )}
                    </div>

                    {/* Site Code */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Code Site (optionnel)
                        </label>
                        <input
                            type="text"
                            value={formData.site_code}
                            onChange={(e) => setFormData({ ...formData, site_code: e.target.value })}
                            placeholder="Laisser vide pour une recette globale"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-gray-500 text-xs mt-1">
                            Si spécifié, la recette ne sera disponible que pour ce site
                        </p>
                    </div>

                    {/* Type Source */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type Source
                        </label>
                        <select
                            value={formData.type_source}
                            onChange={(e) => setFormData({ ...formData, type_source: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ST">Sang Total (ST)</option>
                        </select>
                    </div>

                    {/* Composants */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Composants <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={addComposant}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                + Ajouter composant
                            </button>
                        </div>

                        {errors.composants && (
                            <p className="text-red-500 text-sm mb-2">{errors.composants}</p>
                        )}

                        <div className="space-y-3">
                            {composants.map((composant, index) => (
                                <div
                                    key={index}
                                    className="flex gap-3 items-start p-3 bg-gray-50 rounded border border-gray-200"
                                >
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-800 mb-1">Type</label>
                                        <select
                                            value={composant.type_produit}
                                            onChange={(e) =>
                                                updateComposant(index, "type_produit", e.target.value)
                                            }
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="CGR">CGR</option>
                                            <option value="PFC">PFC</option>
                                            <option value="CP">CP</option>
                                        </select>
                                    </div>

                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-800 mb-1">Volume (ml)</label>
                                        <input
                                            type="number"
                                            value={composant.volume_ml}
                                            onChange={(e) =>
                                                updateComposant(index, "volume_ml", parseInt(e.target.value) || 0)
                                            }
                                            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`composant_${index}_volume`]
                                                ? "border-red-500"
                                                : "border-gray-300"
                                                }`}
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-800 mb-1">Quantité</label>
                                        <input
                                            type="number"
                                            value={composant.quantite}
                                            onChange={(e) =>
                                                updateComposant(index, "quantite", parseInt(e.target.value) || 0)
                                            }
                                            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`composant_${index}_quantite`]
                                                ? "border-red-500"
                                                : "border-gray-300"
                                                }`}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeComposant(index)}
                                        disabled={composants.length === 1}
                                        className="mt-5 text-red-600 hover:text-red-700 disabled:text-gray-400"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="submit"
                            disabled={createMutation.isLoading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
                        >
                            {createMutation.isLoading ? "Création..." : "Créer la Recette"}
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
        </div>
    );
}
