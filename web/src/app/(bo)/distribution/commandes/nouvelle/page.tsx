"use client";

import { useHopitaux, useCreateCommande } from "@cnts/api";
import type { LigneCommandeCreate } from "@cnts/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
} from "@/components/ui";

export default function NouvelleCommandePage() {
  const router = useRouter();

  const [hopitalId, setHopitalId] = useState<string>("");
  const [dateLivraisonPrevue, setDateLivraisonPrevue] = useState<string>("");
  const [lignes, setLignes] = useState<LigneCommandeCreate[]>([
    { type_produit: "CGR", groupe_sanguin: "A_POS", quantite: 1 },
  ]);

  const { data: hopitaux } = useHopitaux(apiClient, {
    convention_actif: true,
    limit: 200,
  });

  const { mutate: createCommande, status: createStatus, error: createError } =
    useCreateCommande(apiClient);

  // Ajouter une ligne
  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      { type_produit: "CGR", groupe_sanguin: "A_POS", quantite: 1 },
    ]);
  };

  // Supprimer une ligne
  const supprimerLigne = (index: number) => {
    if (lignes.length === 1) {
      toast.error("Une commande doit contenir au moins une ligne");
      return;
    }
    setLignes(lignes.filter((_, i) => i !== index));
  };

  // Modifier une ligne
  const modifierLigne = (
    index: number,
    field: keyof LigneCommandeCreate,
    value: any
  ) => {
    const nouvellesLignes = [...lignes];
    nouvellesLignes[index] = {
      ...nouvellesLignes[index],
      [field]: value,
    };
    setLignes(nouvellesLignes);
  };

  // Calculer le total de poches
  const totalPoches = lignes.reduce((sum, l) => sum + l.quantite, 0);

  // Soumettre la commande
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hopitalId) {
      toast.error("Veuillez sélectionner un hôpital");
      return;
    }

    if (lignes.length === 0) {
      toast.error("Veuillez ajouter au moins une ligne");
      return;
    }

    try {
      const commande = await createCommande({
        hopital_id: hopitalId,
        date_livraison_prevue: dateLivraisonPrevue || undefined,
        lignes: lignes.map((l) => ({
          ...l,
          groupe_sanguin: l.groupe_sanguin || undefined,
        })),
      });

      toast.success("Commande créée");
      router.push(`/distribution/commandes/${commande.id}`);
    } catch (err) {
      console.error("Erreur création commande:", err);
      toast.error(apiErrorMessage(err, "Création de la commande impossible"));
    }
  };

  const GROUPES_SANGUINS = [
    { value: "A_POS", label: "A+" },
    { value: "A_NEG", label: "A-" },
    { value: "B_POS", label: "B+" },
    { value: "B_NEG", label: "B-" },
    { value: "AB_POS", label: "AB+" },
    { value: "AB_NEG", label: "AB-" },
    { value: "O_POS", label: "O+" },
    { value: "O_NEG", label: "O-" },
  ];

  const TYPES_PRODUITS = [
    { value: "ST", label: "Sang Total (ST)" },
    { value: "CGR", label: "Concentré Globules Rouges (CGR)" },
    { value: "PFC", label: "Plasma Frais Congelé (PFC)" },
    { value: "CP", label: "Concentré Plaquettaire (CP)" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle commande"
        description="Demande de produits sanguins pour un hôpital"
        back={{ href: "/distribution/commandes", label: "Commandes" }}
      />

      {createStatus === "error" && createError && (
        <Alert tone="danger">
          <p className="font-medium">Erreur lors de la création</p>
          <p className="mt-1">
            {createError.status === 404 ? "Hôpital introuvable." : apiErrorMessage(createError, "Création impossible")}
          </p>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader title="Informations générales" />
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Hôpital destinataire"
                  required
                  hint={
                    hopitaux?.length === 0 ? (
                      <>
                        Aucun hôpital disponible.{" "}
                        <Link href="/distribution/hopitaux" className="text-blue-700 hover:underline">
                          Gérer les hôpitaux
                        </Link>
                      </>
                    ) : undefined
                  }
                >
                  <Select value={hopitalId} onChange={(e) => setHopitalId(e.target.value)}>
                    <option value="">Sélectionner un hôpital</option>
                    {hopitaux?.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.nom}
                        {h.convention_actif ? "" : " (convention inactive)"}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Date de livraison prévue" hint="Facultative">
                  <Input
                    type="date"
                    value={dateLivraisonPrevue}
                    onChange={(e) => setDateLivraisonPrevue(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </Field>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Lignes de commande"
                actions={
                  <Button variant="secondary" size="sm" onClick={ajouterLigne} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                    Ajouter une ligne
                  </Button>
                }
              />
              <CardBody className="space-y-4">
                {lignes.map((ligne, index) => (
                  <fieldset key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <legend className="text-sm font-medium text-gray-800">Ligne {index + 1}</legend>
                      {lignes.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => supprimerLigne(index)}
                          aria-label={`Supprimer la ligne ${index + 1}`}
                          icon={<Trash2 className="h-4 w-4 text-brand-600" aria-hidden="true" />}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <Field label="Type de produit">
                        <Select value={ligne.type_produit} onChange={(e) => modifierLigne(index, "type_produit", e.target.value)}>
                          {TYPES_PRODUITS.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field label="Groupe sanguin">
                        <Select
                          value={ligne.groupe_sanguin || ""}
                          onChange={(e) => modifierLigne(index, "groupe_sanguin", e.target.value || undefined)}
                        >
                          <option value="">Indifférent</option>
                          {GROUPES_SANGUINS.map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field label="Quantité">
                        <Input
                          type="number"
                          value={ligne.quantite}
                          onChange={(e) => modifierLigne(index, "quantite", parseInt(e.target.value, 10))}
                          min="1"
                        />
                      </Field>
                    </div>
                  </fieldset>
                ))}

                <div className="flex justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  <span className="font-medium">Total de poches demandées</span>
                  <span className="font-semibold tabular-nums">{totalPoches}</span>
                </div>
              </CardBody>
            </Card>

            <div className="flex flex-wrap justify-end gap-3">
              <ButtonLink href="/distribution/commandes" variant="secondary">
                Annuler
              </ButtonLink>
              <Button type="submit" loading={createStatus === "loading"} disabled={!hopitalId}>
                {createStatus === "loading" ? "Création…" : "Créer la commande"}
              </Button>
            </div>
          </form>
        </div>

        <aside className="space-y-4">
          <Alert tone="info">
            <p className="mb-2 font-medium">Circuit de la commande</p>
            <ol className="list-inside list-decimal space-y-1 text-xs">
              <li>Création de la commande (brouillon)</li>
              <li>Validation (réservation des poches)</li>
              <li>Affectation des receveurs (cross-matching)</li>
              <li>Service de la commande (poches distribuées)</li>
            </ol>
          </Alert>

          <Alert tone="warning">
            <p className="mb-1 flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Réservation automatique
            </p>
            <p className="text-xs">
              À la validation, les poches sont réservées automatiquement selon la règle FEFO (premier périmé, premier
              sorti) parmi les poches disponibles.
            </p>
          </Alert>

          <Card>
            <CardBody>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">Compatibilités ABO/Rh</h2>
              <ul className="list-inside list-disc space-y-1 text-xs text-gray-700">
                <li>
                  <strong>O−</strong> : donneur universel
                </li>
                <li>
                  <strong>AB+</strong> : receveur universel
                </li>
                <li>
                  <strong>A</strong> reçoit : A, O
                </li>
                <li>
                  <strong>B</strong> reçoit : B, O
                </li>
                <li>
                  <strong>Rh+</strong> reçoit : Rh+ ou Rh−
                </li>
                <li>
                  <strong>Rh−</strong> reçoit : Rh− seulement
                </li>
              </ul>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
