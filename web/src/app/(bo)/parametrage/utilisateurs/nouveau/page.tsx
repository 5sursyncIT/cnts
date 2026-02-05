"use client";

import { useCreateUser } from "@cnts/api";
import type { UserRole } from "@cnts/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function NouveauUtilisateurPage() {
    const router = useRouter();
    const createMutation = useCreateUser(apiClient);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "biologiste" as UserRole,
        is_active: true,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const generatePassword = () => {
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < 16; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setFormData({ ...formData, password });
        setShowPassword(true);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = "L'email est requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Format d'email invalide";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Le mot de passe est requis";
        } else {
            if (formData.password.length < 12) {
                newErrors.password = "Le mot de passe doit contenir au moins 12 caractères";
            } else if (!/[A-Z]/.test(formData.password)) {
                newErrors.password = "Le mot de passe doit contenir au moins une majuscule";
            } else if (!/[a-z]/.test(formData.password)) {
                newErrors.password = "Le mot de passe doit contenir au moins une minuscule";
            } else if (!/[0-9]/.test(formData.password)) {
                newErrors.password = "Le mot de passe doit contenir au moins un chiffre";
            }
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
            const user = await createMutation.mutate({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                role: formData.role,
                is_active: formData.is_active,
            });

            alert(
                `Utilisateur créé avec succès!\n\nEmail: ${formData.email}\nMot de passe temporaire: ${formData.password}\n\nVeuillez communiquer ce mot de passe à l'utilisateur de manière sécurisée.`
            );
            router.push("/parametrage/utilisateurs");
        } catch (error: any) {
            alert(`Erreur: ${error?.body?.detail || "Échec de la création"}`);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Nouvel Utilisateur</h1>
                <p className="text-gray-700 mt-1">
                    Créer un compte utilisateur avec attribution de rôle
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit}>
                    {/* Email */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="utilisateur@cnts.sn"
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
                        <p className="text-gray-500 text-xs mt-1">
                            Détermine les permissions de l'utilisateur dans le système
                        </p>
                    </div>

                    {/* Password */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Mot de Passe Temporaire <span className="text-red-500">*</span>
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
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Minimum 12 caractères"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                            >
                                {showPassword ? "Masquer" : "Afficher"}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                            Min. 12 caractères avec majuscules, minuscules et chiffres
                        </p>
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

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="submit"
                            disabled={createMutation.isLoading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
                        >
                            {createMutation.isLoading ? "Création..." : "Créer l'Utilisateur"}
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

            {/* Security Warning */}
            <div className="mt-4 text-sm text-gray-800 bg-yellow-50 border border-yellow-200 rounded p-4">
                <strong>⚠️ Sécurité:</strong> Le mot de passe sera affiché une seule fois après création. L'utilisateur devra le changer à sa première connexion.
            </div>
        </div>
    );
}
