"use client";

import { useRecette, useUpdateRecette, useDeleteRecette } from "@cnts/api";
import type { ComposantRecette } from "@cnts/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import { Alert, Button, Card, CardBody, CardHeader, ErrorState, Field, Input, LoadingState, PageHeader, Select } from "@/components/ui";

export default function EditRecettePage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const { data: recette, status, error, refetch } = useRecette(apiClient, code);
    const updateMutation = useUpdateRecette(apiClient);
    const deleteMutation = useDeleteRecette(apiClient);

    const [formData, setFormData] = useState({
        libelle: "",
        site_code: "",
        type_source: "ST",
        actif: true,
    });

    const [composants, setComposants] = useState<ComposantRecette[]>([]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [prevRecette, setPrevRecette] = useState(recette);
    if (recette && recette !== prevRecette) {
        setPrevRecette(recette);
        setFormData({
            libelle: recette.libelle,
            site_code: recette.site_code || "",
            type_source: recette.type_source,
            actif: recette.actif,
        });
        setComposants(recette.composants);
    }

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.libelle.trim()) {
            newErrors.libelle = "Le libellé est requis";
        }

        if (composants.length === 0) {
            newErrors.composants = "Au moins un composant est requis";
        }

        composants.forEach((c, i) => {
            if (c.volume_ml <= 0) {
                newErrors[`composant_${i}_volume`] = "Le volume doit être > 0";
            }
            if (c.quantite <= 0) {
                newErrors[`composant_${i}_quantite`] = "La quantité doit être > 0";
            }
        });

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
                code,
                data: {
                    code,
                    libelle: formData.libelle.trim(),
                    site_code: formData.site_code.trim() || undefined,
                    type_source: formData.type_source,
                    actif: formData.actif,
                    composants,
                },
            });
            toast.success("Recette mise à jour");
            router.push("/parametrage/recettes");
        } catch (err) {
            toast.error(apiErrorMessage(err, "Échec de la mise à jour"));
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Êtes-vous sûr de vouloir désactiver la recette "${code}" ?`)) {
            return;
        }

        try {
            await deleteMutation.mutate(code);
            toast.success("Recette désactivée");
            router.push("/parametrage/recettes");
        } catch (err) {
            toast.error(apiErrorMessage(err, "Échec de la désactivation"));
        }
    };

    const addComposant = () => {
        setComposants([...composants, { type_produit: "CGR", volume_ml: 280, quantite: 1 }]);
    };

    const removeComposant = (index: number) => {
        setComposants(composants.filter((_, i) => i !== index));
    };

    const updateComposant = (index: number, field: keyof ComposantRecette, value: any) => {
        const updated = [...composants];
        updated[index] = { ...updated[index], [field]: value };
        setComposants(updated);
    };

    const header = (
        <PageHeader
            title={`Recette ${code}`}
            description="Modification de la recette de fractionnement."
            back={{ href: "/parametrage/recettes", label: "Recettes de fractionnement" }}
        />
    );

    if (status === "loading" || status === "idle") {
        return (
            <div className="max-w-3xl">
                {header}
                <Card>
                    <LoadingState />
                </Card>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="max-w-3xl">
                {header}
                <Card>
                    <ErrorState title="Recette introuvable" message={apiErrorMessage(error, "Impossible de charger la recette.")} onRetry={() => refetch()} />
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            {header}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <Card>
                    <CardHeader title="Informations générales" />
                    <CardBody className="grid gap-4 sm:grid-cols-2">
                        <Field label="Code" hint="Le code ne peut pas être modifié">
                            <Input type="text" value={code} disabled className="font-mono" />
                        </Field>

                        <Field label="Libellé" required error={errors.libelle}>
                            <Input
                                type="text"
                                value={formData.libelle}
                                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                            />
                        </Field>

                        <Field label="Code site" hint="Laisser vide pour une recette globale.">
                            <Input
                                type="text"
                                value={formData.site_code}
                                onChange={(e) => setFormData({ ...formData, site_code: e.target.value })}
                                placeholder="Optionnel"
                            />
                        </Field>

                        <label htmlFor="recette-active" className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-gray-800">
                            <input
                                id="recette-active"
                                type="checkbox"
                                checked={formData.actif}
                                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Recette active
                        </label>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader
                        title="Composants"
                        description="Produits obtenus à partir d’une poche source."
                        actions={
                            <Button size="sm" variant="secondary" onClick={addComposant} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                                Ajouter un composant
                            </Button>
                        }
                    />
                    <CardBody className="space-y-3">
                        {errors.composants && <Alert tone="danger">{errors.composants}</Alert>}

                        {composants.map((composant, index) => (
                            <fieldset
                                key={index}
                                className="grid items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                            >
                                <legend className="sr-only">Composant {index + 1}</legend>
                                <Field label="Type">
                                    <Select
                                        value={composant.type_produit}
                                        onChange={(e) =>
                                            updateComposant(index, "type_produit", e.target.value)
                                        }
                                    >
                                        <option value="CGR">CGR</option>
                                        <option value="PFC">PFC</option>
                                        <option value="CP">CP</option>
                                    </Select>
                                </Field>

                                <Field label="Volume (ml)" error={errors[`composant_${index}_volume`]}>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={composant.volume_ml}
                                        onChange={(e) =>
                                            updateComposant(index, "volume_ml", parseInt(e.target.value) || 0)
                                        }
                                    />
                                </Field>

                                <Field label="Quantité" error={errors[`composant_${index}_quantite`]}>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={composant.quantite}
                                        onChange={(e) =>
                                            updateComposant(index, "quantite", parseInt(e.target.value) || 0)
                                        }
                                    />
                                </Field>

                                <button
                                    type="button"
                                    onClick={() => removeComposant(index)}
                                    disabled={composants.length === 1}
                                    aria-label={`Retirer le composant ${index + 1}`}
                                    title="Retirer"
                                    className="justify-self-end rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 sm:mt-7"
                                >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </fieldset>
                        ))}
                    </CardBody>
                </Card>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        {formData.actif && (
                            <Button
                                type="button"
                                variant="danger"
                                onClick={handleDelete}
                                loading={deleteMutation.isLoading}
                                icon={<Power className="h-4 w-4" aria-hidden="true" />}
                            >
                                Désactiver
                            </Button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" onClick={() => router.back()}>
                            Annuler
                        </Button>
                        <Button type="submit" loading={updateMutation.isLoading}>
                            Enregistrer
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
