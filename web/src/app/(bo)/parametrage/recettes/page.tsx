"use client";

import { useRecettes, useDeleteRecette } from "@cnts/api";
import Link from "next/link";
import { useState } from "react";
import { Pencil, Plus, Power, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
    Badge,
    Button,
    ButtonLink,
    Card,
    CardBody,
    EmptyState,
    ErrorState,
    Field,
    Input,
    LoadingState,
    PageHeader,
    Select,
    Table,
    TBody,
    THead,
    Td,
    Th,
    Tr,
} from "@/components/ui";

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
            toast.success("Recette désactivée");
            refetch();
        } catch (err) {
            toast.error(apiErrorMessage(err, "Échec de la désactivation"));
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Recettes de fractionnement"
                description="Recettes prédéfinies pour le fractionnement du sang total."
                actions={
                    <ButtonLink href="/parametrage/recettes/nouvelle" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                        Nouvelle recette
                    </ButtonLink>
                }
            />

            {/* Filtres */}
            <Card>
                <CardBody className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Code site">
                        <Input
                            type="text"
                            value={siteFilter}
                            onChange={(e) => setSiteFilter(e.target.value)}
                            placeholder="Filtrer par site…"
                        />
                    </Field>

                    <Field label="Statut">
                        <Select
                            value={actifFilter === undefined ? "all" : actifFilter ? "true" : "false"}
                            onChange={(e) =>
                                setActifFilter(
                                    e.target.value === "all" ? undefined : e.target.value === "true"
                                )
                            }
                        >
                            <option value="all">Toutes</option>
                            <option value="true">Actives uniquement</option>
                            <option value="false">Inactives uniquement</option>
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
                    <ErrorState message={apiErrorMessage(error, "Impossible de charger les recettes.")} onRetry={() => refetch()} />
                )}

                {status === "success" && recettes && recettes.length === 0 && (
                    <EmptyState
                        title="Aucune recette trouvée"
                        description="Modifiez les filtres ou créez une nouvelle recette."
                        action={
                            <ButtonLink href="/parametrage/recettes/nouvelle" variant="secondary" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                                Nouvelle recette
                            </ButtonLink>
                        }
                    />
                )}

                {status === "success" && recettes && recettes.length > 0 && (
                    <>
                        <Table>
                            <THead>
                                <tr>
                                    <Th>Code</Th>
                                    <Th>Libellé</Th>
                                    <Th>Type source</Th>
                                    <Th>Site</Th>
                                    <Th>Composants</Th>
                                    <Th>Statut</Th>
                                    <Th align="right"><span className="sr-only">Actions</span></Th>
                                </tr>
                            </THead>
                            <TBody>
                                {recettes.map((recette) => (
                                    <Tr key={recette.code}>
                                        <Td className="whitespace-nowrap font-mono text-gray-900">{recette.code}</Td>
                                        <Td className="text-gray-900">{recette.libelle}</Td>
                                        <Td>
                                            <Badge tone="danger">{recette.type_source}</Badge>
                                        </Td>
                                        <Td className="whitespace-nowrap">
                                            {recette.site_code || <span className="italic text-gray-500">Global</span>}
                                        </Td>
                                        <Td>
                                            <div className="flex flex-wrap gap-1">
                                                {recette.composants.map((c, i) => (
                                                    <Badge key={i} tone="neutral">
                                                        {c.quantite} × {c.type_produit} ({c.volume_ml} ml)
                                                    </Badge>
                                                ))}
                                            </div>
                                        </Td>
                                        <Td>
                                            <Badge tone={recette.actif ? "success" : "neutral"} dot>
                                                {recette.actif ? "Active" : "Inactive"}
                                            </Badge>
                                        </Td>
                                        <Td align="right" className="whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-3">
                                                <Link
                                                    href={`/parametrage/recettes/${recette.code}`}
                                                    className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                                    Modifier<span className="sr-only"> la recette {recette.code}</span>
                                                </Link>
                                                {recette.actif && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(recette.code)}
                                                        disabled={deleteMutation.isLoading}
                                                        className="inline-flex items-center gap-1 font-medium text-red-700 hover:underline disabled:text-gray-400"
                                                    >
                                                        <Power className="h-3.5 w-3.5" aria-hidden="true" />
                                                        Désactiver<span className="sr-only"> la recette {recette.code}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </TBody>
                        </Table>
                        <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
                            {recettes.length} recette(s) affichée(s)
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
