"use client";

import { useUsers, useDeleteUser } from "@cnts/api";
import type { UserRole } from "@cnts/api";
import Link from "next/link";
import { useState } from "react";
import { Pencil, Plus, Power, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
    Alert,
    Badge,
    Button,
    ButtonLink,
    Card,
    CardBody,
    EmptyState,
    ErrorState,
    Field,
    LoadingState,
    PageHeader,
    Select,
    Table,
    TBody,
    THead,
    Td,
    Th,
    Tr,
    type BadgeTone,
} from "@/components/ui";

const ROLES: Record<string, { label: string; tone: BadgeTone }> = {
    admin: { label: "Administrateur", tone: "purple" },
    biologiste: { label: "Biologiste", tone: "info" },
    technicien_labo: { label: "Technicien laboratoire", tone: "success" },
    agent_distribution: { label: "Agent distribution", tone: "warning" },
    agent_accueil: { label: "Agent accueil", tone: "neutral" },
};

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
            toast.success("Utilisateur désactivé");
            refetch();
        } catch (err) {
            toast.error(apiErrorMessage(err, "Échec de la désactivation"));
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Utilisateurs"
                description="Comptes utilisateurs et attribution des rôles."
                actions={
                    <ButtonLink href="/parametrage/utilisateurs/nouveau" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                        Nouvel utilisateur
                    </ButtonLink>
                }
            />

            {/* Filtres */}
            <Card>
                <CardBody className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Rôle">
                        <Select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
                        >
                            <option value="">Tous les rôles</option>
                            <option value="admin">Administrateur</option>
                            <option value="biologiste">Biologiste</option>
                            <option value="technicien_labo">Technicien laboratoire</option>
                            <option value="agent_distribution">Agent distribution</option>
                            <option value="agent_accueil">Agent accueil</option>
                        </Select>
                    </Field>

                    <Field label="Statut">
                        <Select
                            value={statusFilter === undefined ? "all" : statusFilter ? "active" : "inactive"}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value === "all" ? undefined : e.target.value === "active"
                                )
                            }
                        >
                            <option value="all">Tous</option>
                            <option value="active">Actifs uniquement</option>
                            <option value="inactive">Inactifs uniquement</option>
                        </Select>
                    </Field>

                    <div>
                        <Button variant="secondary" onClick={() => refetch()} icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}>
                            Actualiser
                        </Button>
                    </div>
                </CardBody>
            </Card>

            <Card>
                {status === "loading" && <LoadingState />}

                {status === "error" && (
                    <ErrorState message={apiErrorMessage(error, "Impossible de charger les utilisateurs.")} onRetry={() => refetch()} />
                )}

                {status === "success" && users && users.length === 0 && (
                    <EmptyState title="Aucun utilisateur trouvé" description="Modifiez les filtres ou créez un nouveau compte." />
                )}

                {status === "success" && users && users.length > 0 && (
                    <>
                        <Table>
                            <THead>
                                <tr>
                                    <Th>E-mail</Th>
                                    <Th>Rôle</Th>
                                    <Th>MFA</Th>
                                    <Th>Statut</Th>
                                    <Th>Créé le</Th>
                                    <Th align="right"><span className="sr-only">Actions</span></Th>
                                </tr>
                            </THead>
                            <TBody>
                                {users.map((user) => (
                                    <Tr key={user.id}>
                                        <Td className="break-all text-gray-900">{user.email}</Td>
                                        <Td>
                                            <Badge tone={ROLES[user.role]?.tone ?? "neutral"}>
                                                {ROLES[user.role]?.label ?? user.role}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            {user.mfa_enabled ? (
                                                <Badge tone="success">
                                                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                                                    Activé
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-400">
                                                    <span aria-hidden="true">—</span>
                                                    <span className="sr-only">Non activé</span>
                                                </span>
                                            )}
                                        </Td>
                                        <Td>
                                            <Badge tone={user.is_active ? "success" : "neutral"} dot>
                                                {user.is_active ? "Actif" : "Inactif"}
                                            </Badge>
                                        </Td>
                                        <Td className="whitespace-nowrap tabular-nums">
                                            {new Date(user.created_at).toLocaleDateString("fr-FR")}
                                        </Td>
                                        <Td align="right" className="whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-3">
                                                <Link
                                                    href={`/parametrage/utilisateurs/${user.id}`}
                                                    className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                                    Modifier<span className="sr-only"> {user.email}</span>
                                                </Link>
                                                {user.is_active && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeactivate(user.id, user.email)}
                                                        disabled={deleteMutation.isLoading}
                                                        className="inline-flex items-center gap-1 font-medium text-red-700 hover:underline disabled:text-gray-400"
                                                    >
                                                        <Power className="h-3.5 w-3.5" aria-hidden="true" />
                                                        Désactiver<span className="sr-only"> {user.email}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </TBody>
                        </Table>
                        <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
                            {users.length} utilisateur(s) affiché(s)
                        </div>
                    </>
                )}
            </Card>

            <Alert tone="warning">
                <strong>Sécurité :</strong> seuls les administrateurs peuvent accéder à cette page et gérer les utilisateurs.
            </Alert>
        </div>
    );
}
