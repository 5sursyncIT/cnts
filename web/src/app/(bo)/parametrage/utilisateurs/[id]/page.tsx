"use client";

import { useUser, useUpdateUser, useResetUserPassword, useDeleteUser } from "@cnts/api";
import type { UserRole } from "@cnts/api";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export default function EditUtilisateurPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const { data: user, status, refetch } = useUser(apiClient, userId);
    const updateMutation = useUpdateUser(apiClient);
    const resetPasswordMutation = useResetUserPassword(apiClient);
    const deleteMutation = useDeleteUser(apiClient);

    const [formData, setFormData] = useState({
        email: "",
        role: "biologiste" as UserRole,
        is_active: true,
    });

    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email,
                role: user.role as UserRole,
                is_active: user.is_active,
            });
        }
    }, [user]);

    const generatePassword = () => {
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < 16; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setNewPassword(password);
        setShowPassword(true);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email.trim()) {
            newErrors.email = "L'email est requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Format d'email invalide";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        try {
            await updateMutation.mutate({
                id: userId,
                data: {
                    email: formData.email.trim().toLowerCase(),
                    role: formData.role,
                    is_active: formData.is_active,
                },
            });
            alert("Utilisateur mis à jour avec succès");
            refetch();
        } catch (error: any) {
            alert(`Erreur: ${error?.body?.detail || "Échec de la mise à jour"}`);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword) {
            alert("Veuillez générer ou saisir un nouveau mot de passe");
            return;
        }

        if (!confirm("Confirmer la réinitialisation du mot de passe ?")) {
            return;
        }

        try {
            await resetPasswordMutation.mutate({
                id: userId,
                data: { password: newPassword },
            });
            alert(
                `Mot de passe réinitialisé avec succès!\n\nNouveau mot de passe: ${newPassword}\n\nVeuillez communiquer ce mot de passe à l'utilisateur de manière sécurisée.`
            );
            setNewPassword("");
            setShowPassword(false);
        } catch (error: any) {
            alert(`Erreur: ${error?.body?.detail || "Échec de la réinitialisation"}`);
        }
    };

    const handleDeactivate = async () => {
        if (!confirm(`Êtes-vous sûr de vouloir désactiver l'utilisateur "${user?.email}" ?`)) {
            return;
        }

        try {
            await deleteMutation.mutate(userId);
            alert("Utilisateur désactivé avec succès");
            router.push("/parametrage/utilisateurs");
        } catch (error: any) {
            alert(`Erreur: ${error?.body?.detail || "Échec de la désactivation"}`);
        }
    };

    if (status === "loading") {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <div className="text-center text-gray-700">Chargement...</div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <div className="text-center text-red-600">Erreur: Utilisateur introuvable</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Modifier Utilisateur</h1>
                <p className="text-gray-700 mt-1">{user?.email}</p>
            </div>

            {/* Form - User Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Informations du Compte</h2>
                <form onSubmit={handleUpdate}>
                    {/* Email */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${errors.email ? "border-red-500" : "border-gray-300"
                                }`}
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    {/* Role */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rôle <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                            <option value="admin">Administrateur</option>
                            <option value="biologiste">Biologiste</option>
                            <option value="technicien_labo">Technicien Laboratoire</option>
                            <option value="agent_distribution">Agent Distribution</option>
                            <option value="agent_accueil">Agent Accueil</option>
                        </select>
                    </div>

                    {/* Active */}
                    <div className="mb-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Compte actif</span>
                        </label>
                    </div>

                    {/* MFA Info */}
                    {user && user.mfa_enabled && (
                        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-green-900">MFA Activé</p>
                                    <p className="text-xs text-green-700 mt-1">
                                        Depuis le {new Date(user.mfa_enabled_at!).toLocaleDateString("fr-FR")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
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

            {/* Password Reset Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Réinitialiser le Mot de Passe</h2>

                <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Nouveau Mot de Passe
                        </label>
                        <button
                            type="button"
                            onClick={generatePassword}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            Générer sécurisé
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Générer ou saisir un mot de passe"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                        >
                            {showPassword ? "Masquer" : "Afficher"}
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleResetPassword}
                    disabled={!newPassword || resetPasswordMutation.isLoading}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition disabled:bg-gray-400"
                >
                    {resetPasswordMutation.isLoading ? "Réinitialisation..." : "Réinitialiser le Mot de Passe"}
                </button>
            </div>

            {/* Danger Zone */}
            {formData.is_active && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-red-900 mb-2">Zone Dangereuse</h2>
                    <p className="text-sm text-red-700 mb-4">
                        La désactivation empêchera l'utilisateur de se connecter au système.
                    </p>
                    <button
                        onClick={handleDeactivate}
                        disabled={deleteMutation.isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:bg-gray-400"
                    >
                        Désactiver l'Utilisateur
                    </button>
                </div>
            )}
        </div>
    );
}
