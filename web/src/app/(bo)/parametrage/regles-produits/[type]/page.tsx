"use client";

import { useProductRule, useUpsertProductRule } from "@cnts/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import { Alert, Button, Card, CardBody, ErrorState, Field, Input, LoadingState, PageHeader } from "@/components/ui";

type FormKey = "shelf_life_days" | "default_volume_ml" | "min_volume_ml" | "max_volume_ml";

const FIELDS: { key: FormKey; label: string }[] = [
    { key: "shelf_life_days", label: "Durée de vie (jours)" },
    { key: "default_volume_ml", label: "Volume par défaut (ml)" },
    { key: "min_volume_ml", label: "Volume minimum (ml)" },
    { key: "max_volume_ml", label: "Volume maximum (ml)" },
];

export default function EditRegleProduitPage() {
    const params = useParams();
    const router = useRouter();
    const typeProduit = params.type as string;

    const { data: regle, status, error, refetch } = useProductRule(apiClient, typeProduit);
    const updateMutation = useUpsertProductRule(apiClient);

    const [formData, setFormData] = useState({
        shelf_life_days: 0,
        default_volume_ml: 0,
        min_volume_ml: 0,
        max_volume_ml: 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [prevRegle, setPrevRegle] = useState(regle);
    if (regle && regle !== prevRegle) {
        setPrevRegle(regle);
        setFormData({
            shelf_life_days: regle.shelf_life_days,
            default_volume_ml: regle.default_volume_ml ?? 0,
            min_volume_ml: regle.min_volume_ml ?? 0,
            max_volume_ml: regle.max_volume_ml ?? 0,
        });
    }

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (formData.shelf_life_days <= 0) {
            newErrors.shelf_life_days = "La durée de vie doit être supérieure à 0";
        }

        if (formData.default_volume_ml <= 0) {
            newErrors.default_volume_ml = "Le volume par défaut doit être supérieur à 0";
        }

        if (formData.min_volume_ml <= 0) {
            newErrors.min_volume_ml = "Le volume minimum doit être supérieur à 0";
        }

        if (formData.max_volume_ml <= 0) {
            newErrors.max_volume_ml = "Le volume maximum doit être supérieur à 0";
        }

        if (formData.min_volume_ml > formData.default_volume_ml) {
            newErrors.min_volume_ml = "Le volume minimum ne peut pas être supérieur au volume par défaut";
        }

        if (formData.default_volume_ml > formData.max_volume_ml) {
            newErrors.default_volume_ml = "Le volume par défaut ne peut pas être supérieur au volume maximum";
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
            await updateMutation.mutate({
                typeProduit,
                data: formData,
            });
            toast.success("Règle mise à jour");
            router.push("/parametrage/regles-produits");
        } catch (err) {
            toast.error(apiErrorMessage(err, "Échec de la mise à jour"));
        }
    };

    const header = (
        <PageHeader
            title={`Règle ${typeProduit}`}
            description="Durée de vie et volumes de référence du produit."
            back={{ href: "/parametrage/regles-produits", label: "Règles produits" }}
        />
    );

    if (status === "loading" || status === "idle") {
        return (
            <div className="max-w-2xl">
                {header}
                <Card>
                    <LoadingState rows={4} />
                </Card>
            </div>
        );
    }

    // 404 : la règle n'existe pas encore, le formulaire permet de la créer (upsert).
    const notFound = status === "error" && (error as { status?: number } | null)?.status === 404;

    if (status === "error" && !notFound) {
        return (
            <div className="max-w-2xl">
                {header}
                <Card>
                    <ErrorState message={apiErrorMessage(error, "Impossible de charger la règle.")} onRetry={() => refetch()} />
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-4">
            {header}

            {notFound && (
                <Alert tone="info">Aucune règle n’existe encore pour ce produit : elle sera créée à l’enregistrement.</Alert>
            )}

            <Card>
                <CardBody>
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {FIELDS.map(({ key, label }) => (
                                <Field key={key} label={label} required error={errors[key]}>
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        min={1}
                                        value={formData[key]}
                                        onChange={(e) =>
                                            setFormData({ ...formData, [key]: parseInt(e.target.value) || 0 })
                                        }
                                    />
                                </Field>
                            ))}
                        </div>

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

            <Alert tone="warning">
                Les modifications s’appliqueront aux nouvelles poches créées, pas aux poches existantes.
            </Alert>
        </div>
    );
}
