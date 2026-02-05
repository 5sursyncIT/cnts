"use client";

import { useRecettes, useDeleteRecette } from "@cnts/api";
import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function RecettesPage() {
    const [siteFilter, setSiteFilter] = useState("");
    const [actifFilter, setActifFilter] = useState<boolean | undefined>(true);

    const { data: recettes, status, error, refetch } = useRecettes(apiClient, {
        site_code: siteFilter || undefined,
        actif: actifFilter,
    });

    const deleteMutation = useDeleteRecette(apiClient);

    const handleDelete = async (code: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir désactiver la recette "${code}" ?`)) {
            return;
        }

        try {
            await deleteMutation.mutate(code);
            alert("Recette désactivée avec succès");
            refetch();
        } catch (error: any) {
            alert(`Erreur: ${error?.body?.detail || "Échec de la désactivation"}`);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Recettes de Fractionnement</h1>
                    <p className="text-gray-700 mt-1">
                        Gestion des recettes prédéfinies pour le fractionnement de sang total
                    </p>
                </div>
                <Link
                    href="/parametrage/recettes/nouvelle"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    + Nouvelle Recette
                </Link>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Code Site
                        </label>
                        <input
                            type="text"
                            value={siteFilter}
                            onChange={(e) => setSiteFilter(e.target.value)}
                            placeholder="Filtrer par site..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Statut
                        </label>
                        <select
                            value={actifFilter === undefined ? "all" : actifFilter ? "true" : "false"}
                            onChange={(e) =>
                                setActifFilter(
                                    e.target.value === "all" ? undefined : e.target.value === "true"
                                )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Toutes</option>
                            <option value="true">Actives uniquement</option>
                            <option value="false">Inactives uniquement</option>
                        </select>
                    </div>

                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                    >
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow">
                {status === "loading" && (
                    <div className="p-8 text-center text-gray-700">Chargement...</div>
                )}

                {status === "error" && (
                    <div className="p-8 text-center">
                        <div className="text-red-600 mb-2">Erreur de chargement</div>
                        <div className="text-sm text-gray-800">
                            {error?.status ? `Erreur ${error.status}` : "Erreur inconnue"}
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Réessayer
                        </button>
                    </div>
                )}

                {status === "success" && recettes && recettes.length === 0 && (
                    <div className="p-8 text-center text-gray-700">
                        Aucune recette trouvée
                    </div>
                )}

                {status === "success" && recettes && recettes.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Libellé
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Type Source
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Site
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Composants
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
                                {recettes.map((recette) => (
                                    <tr key={recette.code} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">
                                            {recette.code}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {recette.libelle}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1.5 text-sm font-bold rounded bg-red-100 text-red-900">
                                                {recette.type_source}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {recette.site_code || <span className="text-gray-400 italic">Global</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-800">
                                            {recette.composants.map((c, i) => (
                                                <span key={i} className="mr-2">
                                                    {c.quantite}x {c.type_produit} ({c.volume_ml}ml)
                                                </span>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-3 py-1.5 text-sm font-bold rounded-full ${recette.actif
                                                    ? "bg-green-100 text-green-900"
                                                    : "bg-gray-100 text-gray-900"
                                                    }`}
                                            >
                                                {recette.actif ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/parametrage/recettes/${recette.code}`}
                                                className="text-blue-700 hover:text-blue-900 font-semibold hover:underline mr-4"
                                            >
                                                Modifier
                                            </Link>
                                            {recette.actif && (
                                                <button
                                                    onClick={() => handleDelete(recette.code)}
                                                    disabled={deleteMutation.isLoading}
                                                    className="text-red-700 hover:text-red-900 font-semibold hover:underline disabled:text-gray-400"
                                                >
                                                    Désactiver
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer */}
            {status === "success" && recettes && (
                <div className="mt-4 text-sm text-gray-800">
                    {recettes.length} recette(s) affichée(s)
                </div>
            )}
        </div>
    );
}
