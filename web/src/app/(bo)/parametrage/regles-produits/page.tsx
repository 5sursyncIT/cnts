"use client";

import { useProductRules } from "@cnts/api";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

export default function ReglesProduitsPage() {
    const { data: regles, status, error, refetch } = useProductRules(apiClient);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Règles Produits</h1>
                <p className="text-gray-700 mt-1">
                    Configuration de la durée de vie et des volumes pour chaque type de produit sanguin
                </p>
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

                {status === "success" && regles && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Type de Produit
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Durée de Vie (jours)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Volume par Défaut (ml)
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
                                {regles.map((regle) => (
                                    <tr key={regle.type_produit} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-3 py-1.5 text-sm font-bold rounded ${regle.type_produit === "ST"
                                                    ? "bg-red-100 text-red-900"
                                                    : regle.type_produit === "CGR"
                                                        ? "bg-orange-100 text-orange-900"
                                                        : regle.type_produit === "PFC"
                                                            ? "bg-yellow-100 text-yellow-900"
                                                            : "bg-blue-100 text-blue-900"
                                                    }`}
                                            >
                                                {regle.type_produit}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {regle.shelf_life_days}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {regle.default_volume_ml ?? "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {regle.min_volume_ml ?? "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {regle.max_volume_ml ?? "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/parametrage/regles-produits/${regle.type_produit}`}
                                                className="text-blue-700 hover:text-blue-900 font-semibold hover:underline"
                                            >
                                                Modifier
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="mt-4 text-sm text-gray-800 bg-blue-50 border border-blue-200 rounded p-4">
                <strong>ℹ️ Info:</strong> Les règles de produits définissent la durée de conservation et les contraintes de volume pour chaque type de produit sanguin.
            </div>
        </div>
    );
}
