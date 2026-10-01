"use client";

import { useProductRules } from "@cnts/api";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
    Alert,
    Badge,
    Card,
    EmptyState,
    ErrorState,
    LoadingState,
    PageHeader,
    Table,
    TBody,
    THead,
    Td,
    Th,
    Tr,
    type BadgeTone,
} from "@/components/ui";

const PRODUCT_TONE: Record<string, BadgeTone> = {
    ST: "danger",
    CGR: "warning",
    PFC: "purple",
};

export default function ReglesProduitsPage() {
    const { data: regles, status, error, refetch } = useProductRules(apiClient);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Règles produits"
                description="Durée de vie et volumes de référence pour chaque type de produit sanguin."
            />

            <Card>
                {status === "loading" && <LoadingState />}

                {status === "error" && (
                    <ErrorState message={apiErrorMessage(error, "Impossible de charger les règles produits.")} onRetry={() => refetch()} />
                )}

                {status === "success" && regles && regles.length === 0 && (
                    <EmptyState title="Aucune règle produit" description="Aucune règle n’est encore configurée." />
                )}

                {status === "success" && regles && regles.length > 0 && (
                    <Table>
                        <THead>
                            <tr>
                                <Th>Type de produit</Th>
                                <Th align="right">Durée de vie (jours)</Th>
                                <Th align="right">Volume par défaut (ml)</Th>
                                <Th align="right">Volume min. (ml)</Th>
                                <Th align="right">Volume max. (ml)</Th>
                                <Th align="right">
                                    <span className="sr-only">Actions</span>
                                </Th>
                            </tr>
                        </THead>
                        <TBody>
                            {regles.map((regle) => (
                                <Tr key={regle.type_produit}>
                                    <Td>
                                        <Badge tone={PRODUCT_TONE[regle.type_produit] ?? "info"}>{regle.type_produit}</Badge>
                                    </Td>
                                    <Td align="right" className="font-medium tabular-nums text-gray-900">
                                        {regle.shelf_life_days}
                                    </Td>
                                    <Td align="right" className="tabular-nums">{regle.default_volume_ml ?? "—"}</Td>
                                    <Td align="right" className="tabular-nums">{regle.min_volume_ml ?? "—"}</Td>
                                    <Td align="right" className="tabular-nums">{regle.max_volume_ml ?? "—"}</Td>
                                    <Td align="right">
                                        <Link
                                            href={`/parametrage/regles-produits/${regle.type_produit}`}
                                            className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
                                        >
                                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                            Modifier<span className="sr-only"> la règle {regle.type_produit}</span>
                                        </Link>
                                    </Td>
                                </Tr>
                            ))}
                        </TBody>
                    </Table>
                )}
            </Card>

            <Alert tone="info">
                Les règles produits définissent la durée de conservation et les contraintes de volume pour chaque type de produit sanguin.
            </Alert>
        </div>
    );
}
