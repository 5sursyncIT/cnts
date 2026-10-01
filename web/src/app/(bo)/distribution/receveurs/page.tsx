"use client";

import { useCreateReceveur, useReceveurs, useUpdateReceveur, useDeleteReceveur, useHopitaux } from "@cnts/api";
import type { Receveur } from "@cnts/api";
import { useCallback, useState } from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

const GROUPES_SANGUINS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

export default function ReceveursPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingReceveur, setEditingReceveur] = useState<Receveur | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    sexe: "H",
    date_naissance: "",
    adresse: "",
    telephone: "",
    groupe_sanguin: "",
    hopital_id: "",
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Queries and Mutations
  const { data: receveurs, status, refetch } = useReceveurs(apiClient, {
    limit: 100,
  });

  const { data: hopitaux } = useHopitaux(apiClient, {
    convention_actif: true,
    limit: 100,
  });
  
  const createMutation = useCreateReceveur(apiClient);
  const updateMutation = useUpdateReceveur(apiClient);
  const deleteMutation = useDeleteReceveur(apiClient);

  const handleOpenCreate = () => {
    setEditingReceveur(null);
    setFormData({
      nom: "",
      prenom: "",
      sexe: "H",
      date_naissance: "",
      adresse: "",
      telephone: "",
      groupe_sanguin: "",
      hopital_id: "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (receveur: Receveur) => {
    setEditingReceveur(receveur);
    setFormData({
      nom: receveur.nom || "",
      prenom: receveur.prenom || "",
      sexe: receveur.sexe || "H",
      date_naissance: receveur.date_naissance || "",
      adresse: receveur.adresse || "",
      telephone: receveur.telephone || "",
      groupe_sanguin: receveur.groupe_sanguin || "",
      hopital_id: receveur.hopital_id || "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleClose = useCallback(() => {
    setShowModal(false);
    setEditingReceveur(null);
    setFormError(null);
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce receveur ?")) {
      try {
        await deleteMutation.mutate(id);
        await refetch();
        toast.success("Receveur supprimé");
      } catch (err) {
        toast.error(apiErrorMessage(err, "Erreur lors de la suppression"));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const payload = {
        nom: formData.nom,
        prenom: formData.prenom || undefined,
        sexe: (formData.sexe as "H" | "F") || undefined,
        date_naissance: formData.date_naissance || undefined,
        adresse: formData.adresse || undefined,
        telephone: formData.telephone || undefined,
        hopital_id: formData.hopital_id || undefined,
        groupe_sanguin: formData.groupe_sanguin || undefined,
      };

      if (editingReceveur) {
        await updateMutation.mutate({
          id: editingReceveur.id,
          data: payload,
        });
      } else {
        await createMutation.mutate(payload);
      }
      
      await refetch();
      toast.success(editingReceveur ? "Receveur mis à jour" : "Receveur ajouté");
      handleClose();
    } catch (err: unknown) {
      const msg = apiErrorMessage(err, "Une erreur est survenue");
      setFormError(msg);
      toast.error(msg);
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receveurs"
        description="Patients receveurs de produits sanguins"
        back={{ href: "/distribution", label: "Distribution" }}
        actions={
          <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Ajouter un receveur
          </Button>
        }
      />

      <Card>
        {status === "loading" && <LoadingState />}

        {status === "error" && (
          <ErrorState message="Les receveurs n’ont pas pu être chargés." onRetry={() => refetch()} />
        )}

        {status === "success" && receveurs?.length === 0 && (
          <EmptyState
            title="Aucun receveur enregistré"
            icon={<UserRound className="h-6 w-6" aria-hidden="true" />}
            action={
              <Button size="sm" onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                Ajouter un receveur
              </Button>
            }
          />
        )}

        {status === "success" && receveurs && receveurs.length > 0 && (
          <Table>
            <THead>
              <tr>
                <Th>Patient</Th>
                <Th>Groupe sanguin</Th>
                <Th>Établissement / contact</Th>
                <Th align="right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {receveurs.map((receveur) => (
                <Tr key={receveur.id}>
                  <Td>
                    <p className="font-medium text-gray-900">
                      {receveur.prenom} {receveur.nom}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {receveur.sexe === "H" ? "Homme" : receveur.sexe === "F" ? "Femme" : "Sexe non renseigné"} ·{" "}
                      {receveur.date_naissance
                        ? new Date(receveur.date_naissance).toLocaleDateString("fr-FR")
                        : "Date de naissance inconnue"}
                    </p>
                  </Td>
                  <Td>
                    {receveur.groupe_sanguin ? (
                      <Badge tone="danger">{receveur.groupe_sanguin}</Badge>
                    ) : (
                      <span className="italic text-gray-400">Inconnu</span>
                    )}
                  </Td>
                  <Td>
                    <p className="font-medium text-gray-900">{receveur.hopital?.nom || "—"}</p>
                    <p className="max-w-xs truncate text-gray-600">{receveur.adresse || "—"}</p>
                    {receveur.telephone ? <p className="text-xs text-gray-500">{receveur.telephone}</p> : null}
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <div className="inline-flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(receveur)}
                        icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                        aria-label={`Modifier ${receveur.prenom ?? ""} ${receveur.nom}`.trim()}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-brand-700 hover:bg-red-50"
                        onClick={() => handleDelete(receveur.id)}
                        icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                        aria-label={`Supprimer ${receveur.prenom ?? ""} ${receveur.nom}`.trim()}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal
        open={showModal}
        onClose={handleClose}
        title={editingReceveur ? "Modifier le receveur" : "Ajouter un receveur"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" form="receveur-form" loading={isLoading}>
              {isLoading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </>
        }
      >
        <form id="receveur-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert tone="danger">{formError}</Alert>}

          <Field label="Établissement de soins (hôpital / clinique)">
            <Select value={formData.hopital_id} onChange={(e) => setFormData({ ...formData, hopital_id: e.target.value })}>
              <option value="">Aucun / non spécifié</option>
              {hopitaux?.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nom}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom" required>
              <Input
                type="text"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                placeholder="Ex. : Moussa"
              />
            </Field>
            <Field label="Nom" required>
              <Input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex. : Diop"
              />
            </Field>
            <Field label="Sexe" required>
              <Select value={formData.sexe} onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}>
                <option value="H">Homme</option>
                <option value="F">Femme</option>
              </Select>
            </Field>
            <Field label="Date de naissance">
              <Input
                type="date"
                value={formData.date_naissance}
                onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Adresse">
            <Input
              type="text"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              placeholder="Adresse complète"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Téléphone">
              <Input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="Ex. : 77 000 00 00"
              />
            </Field>
            <Field label="Groupe sanguin">
              <Select
                value={formData.groupe_sanguin}
                onChange={(e) => setFormData({ ...formData, groupe_sanguin: e.target.value })}
              >
                <option value="">Inconnu / à déterminer</option>
                {GROUPES_SANGUINS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
