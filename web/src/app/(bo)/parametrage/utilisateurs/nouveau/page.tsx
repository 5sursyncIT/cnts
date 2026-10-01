"use client";

import { useCreateUser } from "@cnts/api";
import type { UserRole } from "@cnts/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import { Alert, Button, Card, CardBody, Field, Input, Modal, PageHeader, Select } from "@/components/ui";

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
    // Identifiants affichés une seule fois après création.
    const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

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
            newErrors.email = "L'e-mail est requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Format d'e-mail invalide";
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
            await createMutation.mutate({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                role: formData.role,
                is_active: formData.is_active,
            });

            toast.success("Utilisateur créé");
            setCreated({ email: formData.email, password: formData.password });
        } catch (err) {
            toast.error(apiErrorMessage(err, "Échec de la création"));
        }
    };

    const copyCredentials = async () => {
        if (!created) return;
        try {
            await navigator.clipboard.writeText(`E-mail : ${created.email}\nMot de passe temporaire : ${created.password}`);
            toast.success("Identifiants copiés");
        } catch {
            toast.error("Copie impossible : sélectionnez le texte manuellement.");
        }
    };

    const finish = () => {
        setCreated(null);
        router.push("/parametrage/utilisateurs");
    };

    return (
        <div className="max-w-2xl space-y-4">
            <PageHeader
                title="Nouvel utilisateur"
                description="Créer un compte et lui attribuer un rôle."
                back={{ href: "/parametrage/utilisateurs", label: "Utilisateurs" }}
            />

            <Card>
                <CardBody>
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="E-mail" required error={errors.email}>
                                <Input
                                    type="email"
                                    autoComplete="off"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="utilisateur@cnts.gouv.sn"
                                />
                            </Field>

                            <Field label="Rôle" required hint="Détermine les permissions de l’utilisateur.">
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

                        <div className="space-y-2">
                            <Field
                                label="Mot de passe temporaire"
                                required
                                error={errors.password}
                                hint="Au moins 12 caractères avec majuscules, minuscules et chiffres."
                            >
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Minimum 12 caractères"
                                    className="font-mono"
                                />
                            </Field>
                            <div className="flex flex-wrap gap-2">
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
                            </div>
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

                        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                            <Button type="button" variant="secondary" onClick={() => router.back()}>
                                Annuler
                            </Button>
                            <Button type="submit" loading={createMutation.isLoading}>
                                Créer l’utilisateur
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>

            <Alert tone="warning">
                <strong>Sécurité :</strong> le mot de passe sera affiché une seule fois après création. L’utilisateur devra le changer à sa première connexion.
            </Alert>

            <Modal
                open={created !== null}
                onClose={finish}
                title="Utilisateur créé"
                description="Communiquez ce mot de passe temporaire à l’utilisateur de manière sécurisée. Il ne sera plus affiché."
                footer={
                    <>
                        <Button variant="secondary" onClick={copyCredentials} icon={<Copy className="h-4 w-4" aria-hidden="true" />}>
                            Copier
                        </Button>
                        <Button onClick={finish}>Terminer</Button>
                    </>
                }
            >
                {created && (
                    <dl className="space-y-3 text-sm">
                        <div>
                            <dt className="text-gray-600">E-mail</dt>
                            <dd className="mt-0.5 break-all font-medium text-gray-900">{created.email}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-600">Mot de passe temporaire</dt>
                            <dd className="mt-0.5 break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-gray-900 select-all">{created.password}</dd>
                        </div>
                    </dl>
                )}
            </Modal>
        </div>
    );
}
