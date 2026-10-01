"use client";

import { useUser, useUpdateUser, useResetUserPassword, useDeleteUser } from "@cnts/api";
import type { UserRole } from "@cnts/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, Power, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
    Alert,
    Button,
    Card,
    CardBody,
    CardHeader,
    ErrorState,
    Field,
    Input,
    LoadingState,
    Modal,
    PageHeader,
    Select,
} from "@/components/ui";

export default function EditUtilisateurPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const { data: user, status, error, refetch } = useUser(apiClient, userId);
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
    const [passwordError, setPasswordError] = useState<string | null>(null);
    // Mot de passe réinitialisé, affiché une seule fois.
    const [resetDone, setResetDone] = useState<string | null>(null);

    const [prevUser, setPrevUser] = useState(user);
    if (user && user !== prevUser) {
        setPrevUser(user);
        setFormData({
            email: user.email,
            role: user.role as UserRole,
            is_active: user.is_active,
        });
    }

    const generatePassword = () => {
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < 16; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setNewPassword(password);
        setShowPassword(true);
        setPasswordError(null);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email.trim()) {
            newErrors.email = "L'e-mail est requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Format d'e-mail invalide";
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
            toast.success("Utilisateur mis à jour");
            refetch();
        } catch (err) {
            toast.error(apiErrorMessage(err, "Échec de la mise à jour"));
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword) {
            setPasswordError("Veuillez générer ou saisir un nouveau mot de passe");
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
            toast.success("Mot de passe réinitialisé");
            setResetDone(newPassword);
            setNewPassword("");
            setShowPassword(false);
        } catch (err) {
            toast.error(apiErrorMessage(err, "Échec de la réinitialisation"));
        }
    };

    const copyPassword = async () => {
        if (!resetDone) return;
        try {
            await navigator.clipboard.writeText(resetDone);
            toast.success("Mot de passe copié");
        } catch {
            toast.error("Copie impossible : sélectionnez le texte manuellement.");
        }
    };

    const handleDeactivate = async () => {
        if (!confirm(`Êtes-vous sûr de vouloir désactiver l'utilisateur "${user?.email}" ?`)) {
            return;
        }

        try {
            await deleteMutation.mutate(userId);
            toast.success("Utilisateur désactivé");
            router.push("/parametrage/utilisateurs");
        } catch (err) {
            toast.error(apiErrorMessage(err, "Échec de la désactivation"));
        }
    };

    const back = { href: "/parametrage/utilisateurs", label: "Utilisateurs" };

    if (status === "loading" || status === "idle") {
        return (
            <div className="max-w-2xl">
                <PageHeader title="Modifier l’utilisateur" back={back} />
                <Card>
                    <LoadingState />
                </Card>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="max-w-2xl">
                <PageHeader title="Modifier l’utilisateur" back={back} />
                <Card>
                    <ErrorState title="Utilisateur introuvable" message={apiErrorMessage(error, "Impossible de charger l’utilisateur.")} onRetry={() => refetch()} />
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-6">
            <PageHeader title="Modifier l’utilisateur" description={<span className="break-all">{user?.email}</span>} back={back} />

            {/* Informations du compte */}
            <Card>
                <CardHeader title="Informations du compte" />
                <CardBody>
                    <form onSubmit={handleUpdate} noValidate className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="E-mail" required error={errors.email}>
                                <Input
                                    type="email"
                                    autoComplete="off"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </Field>

                            <Field label="Rôle" required>
                                <Select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                >
                                    <option value="admin">Administrateur</option>
                                    <option value="biologiste">Biologiste</option>
                                    <option value="technicien_labo">Technicien laboratoire</option>
                                    <option value="agent_distribution">Agent distribution</option>
                                    <option value="agent_accueil">Agent accueil</option>
                                </Select>
                            </Field>
                        </div>

                        <label htmlFor="user-active" className="flex items-center gap-2 text-sm font-medium text-gray-800">
                            <input
                                id="user-active"
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Compte actif
                        </label>

                        {user && user.mfa_enabled && (
                            <Alert tone="success">
                                <span className="flex items-center gap-2 font-medium">
                                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                    Authentification à deux facteurs activée
                                </span>
                                {user.mfa_enabled_at && (
                                    <span className="mt-0.5 block text-xs">
                                        Depuis le {new Date(user.mfa_enabled_at).toLocaleDateString("fr-FR")}
                                    </span>
                                )}
                            </Alert>
                        )}

                        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                            <Button type="button" variant="secondary" onClick={() => router.back()}>
                                Annuler
                            </Button>
                            <Button type="submit" loading={updateMutation.isLoading}>
                                Enregistrer
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>

            {/* Réinitialisation du mot de passe */}
            <Card>
                <CardHeader
                    title="Réinitialiser le mot de passe"
                    description="Le nouveau mot de passe devra être communiqué à l’utilisateur de manière sécurisée."
                />
                <CardBody className="space-y-4">
                    <Field label="Nouveau mot de passe" error={passwordError ?? undefined}>
                        <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setPasswordError(null);
                            }}
                            placeholder="Générer ou saisir un mot de passe"
                            className="font-mono"
                        />
                    </Field>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-pressed={showPassword}
                            icon={showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                        >
                            {showPassword ? "Masquer" : "Afficher"}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={generatePassword} icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}>
                            Générer un mot de passe sûr
                        </Button>
                        <Button
                            className="sm:ml-auto"
                            onClick={handleResetPassword}
                            disabled={!newPassword}
                            loading={resetPasswordMutation.isLoading}
                        >
                            Réinitialiser le mot de passe
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Zone dangereuse */}
            {formData.is_active && (
                <Card className="border-red-200">
                    <CardHeader
                        title={<span className="text-red-800">Zone dangereuse</span>}
                        description="La désactivation empêchera l’utilisateur de se connecter au système."
                    />
                    <CardBody>
                        <Button
                            variant="danger"
                            onClick={handleDeactivate}
                            loading={deleteMutation.isLoading}
                            icon={<Power className="h-4 w-4" aria-hidden="true" />}
                        >
                            Désactiver l’utilisateur
                        </Button>
                    </CardBody>
                </Card>
            )}

            <Modal
                open={resetDone !== null}
                onClose={() => setResetDone(null)}
                title="Mot de passe réinitialisé"
                description="Communiquez ce mot de passe à l’utilisateur de manière sécurisée. Il ne sera plus affiché."
                footer={
                    <>
                        <Button variant="secondary" onClick={copyPassword} icon={<Copy className="h-4 w-4" aria-hidden="true" />}>
                            Copier
                        </Button>
                        <Button onClick={() => setResetDone(null)}>Terminer</Button>
                    </>
                }
            >
                <p className="break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 select-all">{resetDone}</p>
            </Modal>
        </div>
    );
}
