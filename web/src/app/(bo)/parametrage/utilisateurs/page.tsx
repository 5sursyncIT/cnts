"use client";

import { useUsers, useDeleteUser } from "@cnts/api";
import type { UserRole } from "@cnts/api";
import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function UtilisateursPage() {
    const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
    const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);

    const { data: users, status, error, refetch } = useUsers(apiClient, {
        role: roleFilter || undefined,
        is_active: statusFilter,
    });

    const deleteMutation = useDeleteUser(apiClient);

    const handleDeactivate = async (id: string, email: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir désactiver l'utilisateur "${email}" ?`)) {
            return;
        }

        try {
            await deleteMutation.mutate(id);
            alert("Utilisateur désactivé avec succès");
            refetch();
        } catch (error: any) {
            alert(`Erreur: ${error?.body?.detail || "Échec de la désactivation"}`);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "admin":
                return "bg-purple-100 text-purple-900 font-bold";
            case "biologiste":
                return "bg-blue-100 text-blue-900 font-bold";
            case "technicien_labo":
                return "bg-green-100 text-green-900 font-bold";
            case "agent_distribution":
                return "bg-orange-100 text-orange-900 font-bold";
            case "agent_accueil":
                return "bg-teal-100 text-teal-900 font-bold";
            default:
                return "bg-gray-100 text-gray-900 font-bold";
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
                    <p className="text-gray-700 mt-1">
                        Administration des comptes utilisateurs et attribution des rôles
                    </p>
                </div>
                <Link
                    href="/parametrage/utilisateurs/nouveau"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    + Nouvel Utilisateur
                </Link>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rôle
                        </label>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tous les rôles</option>
                            <option value="admin">Administrateur</option>
                            <option value="biologiste">Biologiste</option>
                            <option value="technicien_labo">Technicien Labo</option>
                            <option value="agent_distribution">Agent Distribution</option>
                            <option value="agent_accueil">Agent Accueil</option>
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Statut
                        </label>
                        <select
                            value={statusFilter === undefined ? "all" : statusFilter ? "active" : "inactive"}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value === "all" ? undefined : e.target.value === "active"
                                )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                            <option value="all">Tous</option>
                            <option value="active">Actifs uniquement</option>
                            <option value="inactive">Inactifs uniquement</option>
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

                {status === "success" && users && users.length === 0 && (
                    <div className="p-8 text-center text-gray-700">
                        Aucun utilisateur trouvé
                    </div>
                )}

                {status === "success" && users && users.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Rôle
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        MFA
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Créé le
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1.5 text-sm rounded ${getRoleBadgeColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {user.mfa_enabled ? (
                                                <span className="px-3 py-1.5 text-sm font-bold rounded bg-green-100 text-green-900">
                                                    Activé
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-3 py-1.5 text-sm font-bold rounded-full ${user.is_active
                                                    ? "bg-green-100 text-green-900"
                                                    : "bg-gray-100 text-gray-900"
                                                    }`}
                                            >
                                                {user.is_active ? "Actif" : "Inactif"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {new Date(user.created_at).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/parametrage/utilisateurs/${user.id}`}
                                                className="text-blue-700 hover:text-blue-900 font-semibold hover:underline mr-4"
                                            >
                                                Modifier
                                            </Link>
                                            {user.is_active && (
                                                <button
                                                    onClick={() => handleDeactivate(user.id, user.email)}
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
            {status === "success" && users && (
                <div className="mt-4 text-sm text-gray-800">
                    {users.length} utilisateur(s) affichés
                </div>
            )}

            {/* Info */}
            <div className="mt-4 text-sm text-gray-800 bg-yellow-50 border border-yellow-200 rounded p-4">
                <strong>⚠️ Sécurité:</strong> Seuls les administrateurs peuvent accéder à cette page et gérer les utilisateurs.
            </div>
        </div>
    );
}
