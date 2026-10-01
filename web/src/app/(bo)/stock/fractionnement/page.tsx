"use client";

import {
  usePochesStock,
  useRecettes,
  useFractionner,
  useFractionnerAvecRecette,
} from "@cnts/api";
import type { ComposantFractionnement } from "@cnts/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, Plus, Split, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import { Alert, Button, ButtonLink, Card, CardBody, CardHeader, Field, Input, PageHeader, Select } from "@/components/ui";

export default function FractionnementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pocheIdFromUrl = searchParams.get("poche_id");

  const [selectedPocheId, setSelectedPocheId] = useState<string>(
    pocheIdFromUrl || ""
  );
  const [mode, setMode] = useState<"recette" | "manuel">("recette");
  const [selectedRecetteCode, setSelectedRecetteCode] = useState<string>("");
  const [composants, setComposants] = useState<ComposantFractionnement[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { mutate: fractionner } = useFractionner(apiClient);
  const { mutate: fractionnerAvecRecette } = useFractionnerAvecRecette(apiClient);

  // Charger les poches ST EN_STOCK
  const { data: pochesDisponibles } = usePochesStock(apiClient, {
    type_produit: "ST",
    statut_stock: "EN_STOCK",
    limit: 100,
  });

  // Charger les recettes actives
  const { data: recettes } = useRecettes(apiClient, { actif: true });

  // Trouver la poche sélectionnée
  const pocheSelectionnee = pochesDisponibles?.find(
    (p) => p.id === selectedPocheId
  );

  // Trouver la recette sélectionnée
  const recetteSelectionnee = recettes?.find(
    (r) => r.code === selectedRecetteCode
  );

  // Initialiser les composants avec la recette sélectionnée
  useEffect(() => {
    if (mode === "recette" && recetteSelectionnee) {
      setComposants(
        recetteSelectionnee.composants.map((c) => ({
          type_produit: c.type_produit as "CGR" | "PFC" | "CP",
          volume_ml: c.volume_ml,
        }))
      );
    }
  }, [mode, recetteSelectionnee]);

  // Ajouter un composant manuel
  const ajouterComposant = () => {
    setComposants([
      ...composants,
      { type_produit: "CGR", volume_ml: 280 },
    ]);
  };

  // Supprimer un composant
  const supprimerComposant = (index: number) => {
    setComposants(composants.filter((_, i) => i !== index));
  };

  // Modifier un composant
  const modifierComposant = (
    index: number,
    field: keyof ComposantFractionnement,
    value: any
  ) => {
    const nouveauxComposants = [...composants];
    nouveauxComposants[index] = {
      ...nouveauxComposants[index],
      [field]: value,
    };
    setComposants(nouveauxComposants);
  };

  // Calculer le volume total
  const volumeTotal = composants.reduce((sum, c) => sum + c.volume_ml, 0);

  // Soumettre le fractionnement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPocheId) {
      toast.error("Veuillez sélectionner une poche source");
      return;
    }

    if (composants.length === 0) {
      toast.error("Veuillez ajouter au moins un composant");
      return;
    }

    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      if (mode === "recette" && selectedRecetteCode) {
        // Fractionnement avec recette
        const result = await fractionnerAvecRecette({
          code: selectedRecetteCode,
          data: {
            source_poche_id: selectedPocheId,
          },
        });
        setSuccessMessage(`Fractionnement réussi : ${result.poches.length} poche(s) créée(s)`);
        toast.success("Fractionnement enregistré");
      } else {
        // Fractionnement manuel
        const result = await fractionner({
          source_poche_id: selectedPocheId,
          composants,
        });
        setSuccessMessage(`Fractionnement réussi : ${result.poches.length} poche(s) créée(s)`);
        toast.success("Fractionnement enregistré");
      }

      // Rediriger vers le stock après 2 secondes
      setTimeout(() => {
        router.push("/stock");
      }, 2000);
    } catch (err) {
      console.error("Erreur fractionnement:", err);
      setErrorMessage(apiErrorMessage(err, "Erreur lors du fractionnement"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fractionnement"
        description="Séparation d’une poche de sang total en composants sanguins (CGR, PFC, CP)"
        back={{ href: "/stock", label: "Stock" }}
      />

      {successMessage && (
        <Alert tone="success">
          <p className="font-medium">{successMessage}</p>
          <p className="mt-0.5 text-xs">Redirection vers le stock…</p>
        </Alert>
      )}

      {errorMessage && (
        <Alert tone="danger">
          <p className="font-medium">Erreur de fractionnement</p>
          <p className="mt-0.5">{errorMessage}</p>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader title="Poche source" />
              <CardBody>
                <Field
                  label="Poche de sang total en stock"
                  required
                  hint={pochesDisponibles?.length === 0 ? "Aucune poche ST disponible pour fractionnement." : undefined}
                >
                  <Select value={selectedPocheId} onChange={(e) => setSelectedPocheId(e.target.value)}>
                    <option value="">— Choisir une poche —</option>
                    {pochesDisponibles?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.groupe_sanguin || "?"} — {p.volume_ml || "?"} mL — péremption{" "}
                        {new Date(p.date_peremption).toLocaleDateString("fr-FR")}
                      </option>
                    ))}
                  </Select>
                </Field>
              </CardBody>
            </Card>

            {selectedPocheId && (
              <Card>
                <CardHeader title="Mode de fractionnement" />
                <CardBody className="space-y-5">
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1" role="group" aria-label="Mode de fractionnement">
                    <button
                      type="button"
                      aria-pressed={mode === "recette"}
                      onClick={() => setMode("recette")}
                      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        mode === "recette" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Recette prédéfinie
                    </button>
                    <button
                      type="button"
                      aria-pressed={mode === "manuel"}
                      onClick={() => {
                        setMode("manuel");
                        setComposants([]);
                      }}
                      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        mode === "manuel" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Manuel
                    </button>
                  </div>

                  {mode === "recette" && (
                    <div>
                      <Field label="Recette" required>
                        <Select value={selectedRecetteCode} onChange={(e) => setSelectedRecetteCode(e.target.value)}>
                          <option value="">— Choisir une recette —</option>
                          {recettes?.map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.libelle} ({r.composants.length} composant(s))
                            </option>
                          ))}
                        </Select>
                      </Field>
                      {recettes?.length === 0 && (
                        <p className="mt-2 text-sm text-gray-600">
                          Aucune recette active.{" "}
                          <Link href="/stock/recettes" className="font-medium text-blue-600 hover:text-blue-700">
                            Créer une recette
                          </Link>
                        </p>
                      )}
                    </div>
                  )}

                  {((mode === "recette" && recetteSelectionnee) || mode === "manuel") && (
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">Composants à créer</h3>
                        {mode === "manuel" && (
                          <Button variant="secondary" size="sm" onClick={ajouterComposant} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                            Ajouter
                          </Button>
                        )}
                      </div>

                      {composants.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-600">
                          Aucun composant défini
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {composants.map((composant, index) => (
                            <div key={index} className="flex flex-wrap items-end gap-3 rounded-lg bg-gray-50 p-3">
                              <Field label="Type" className="min-w-[8rem] flex-1">
                                <Select
                                  value={composant.type_produit}
                                  onChange={(e) => modifierComposant(index, "type_produit", e.target.value)}
                                  disabled={mode === "recette"}
                                >
                                  <option value="CGR">CGR</option>
                                  <option value="PFC">PFC</option>
                                  <option value="CP">CP</option>
                                </Select>
                              </Field>
                              <Field label="Volume (mL)" className="min-w-[8rem] flex-1">
                                <Input
                                  type="number"
                                  value={composant.volume_ml}
                                  onChange={(e) => modifierComposant(index, "volume_ml", parseInt(e.target.value, 10))}
                                  disabled={mode === "recette"}
                                  min="1"
                                />
                              </Field>
                              {mode === "manuel" && (
                                <Button
                                  variant="ghost"
                                  className="text-red-700 hover:bg-red-50"
                                  onClick={() => supprimerComposant(index)}
                                  aria-label={`Supprimer le composant ${index + 1}`}
                                  icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                        <div className="flex justify-between">
                          <span className="font-medium">Volume total des composants</span>
                          <span className="font-semibold tabular-nums">{volumeTotal} mL</span>
                        </div>
                        {pocheSelectionnee && (
                          <div className="mt-1 flex justify-between text-xs text-blue-800">
                            <span>Volume source</span>
                            <span className="tabular-nums">{pocheSelectionnee.volume_ml || "?"} mL</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {selectedPocheId && composants.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2">
                <ButtonLink href="/stock" variant="secondary">
                  Annuler
                </ButtonLink>
                <Button type="submit" loading={submitting} icon={<Split className="h-4 w-4" aria-hidden="true" />}>
                  Fractionner la poche
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {pocheSelectionnee && (
            <Card>
              <CardHeader title="Poche sélectionnée" />
              <CardBody>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Type</dt>
                    <dd className="font-medium text-gray-900">{pocheSelectionnee.type_produit}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Groupe sanguin</dt>
                    <dd className="font-medium text-gray-900">{pocheSelectionnee.groupe_sanguin || "Non déterminé"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Volume</dt>
                    <dd className="font-medium text-gray-900">{pocheSelectionnee.volume_ml || "?"} mL</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Péremption</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(pocheSelectionnee.date_peremption).toLocaleDateString("fr-FR")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Emplacement</dt>
                    <dd className="font-medium text-gray-900">{pocheSelectionnee.emplacement_stock}</dd>
                  </div>
                </dl>
                <Link
                  href={`/dons/${pocheSelectionnee.don_id}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Voir le don
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </CardBody>
            </Card>
          )}

          <Alert tone="info">
            <p className="font-medium">Produits dérivés du sang</p>
            <ul className="mt-1 space-y-0.5">
              <li><strong>CGR</strong> : concentré de globules rouges (~280 mL, 42 j)</li>
              <li><strong>PFC</strong> : plasma frais congelé (~220 mL, 365 j)</li>
              <li><strong>CP</strong> : concentré plaquettaire (~50 mL, 5 j)</li>
            </ul>
          </Alert>

          <Alert tone="warning">
            <p className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Règles de fractionnement
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li>Seules les poches de sang total peuvent être fractionnées</li>
              <li>La poche doit être en stock</li>
              <li>Volume total ≤ volume source + tolérance (250 mL)</li>
              <li>Péremption calculée selon les règles produit</li>
              <li>Action irréversible</li>
            </ul>
          </Alert>
        </div>
      </div>
    </div>
  );
}
