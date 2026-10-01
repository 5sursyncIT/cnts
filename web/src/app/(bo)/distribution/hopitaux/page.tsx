"use client";

import { useCreateHopital, useHopitaux, useUpdateHopital } from "@cnts/api";
import type { Hopital } from "@cnts/api";
import { useCallback, useState } from "react";
import { Building2, Pencil, Plus } from "lucide-react";
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
  Table,
  TBody,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
} from "@/components/ui";

export default function HopitauxPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingHopital, setEditingHopital] = useState<Hopital | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nom: "",
    adresse: "",
    contact: "",
    convention_actif: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Queries and Mutations
  const { data: hopitaux, status, refetch } = useHopitaux(apiClient, {
    limit: 100,
  });

  const createMutation = useCreateHopital(apiClient);
  const updateMutation = useUpdateHopital(apiClient);

  const handleOpenCreate = () => {
    setEditingHopital(null);
    setFormData({
      nom: "",
      adresse: "",
      contact: "",
      convention_actif: true,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (hopital: Hopital) => {
    setEditingHopital(hopital);
    setFormData({
      nom: hopital.nom,
      adresse: hopital.adresse || "",
      contact: hopital.contact || "",
      convention_actif: hopital.convention_actif,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleClose = useCallback(() => {
    setShowModal(false);
    setEditingHopital(null);
    setFormError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingHopital) {
        await updateMutation.mutate({
          id: editingHopital.id,
          data: {
            nom: formData.nom,
            adresse: formData.adresse || undefined,
            contact: formData.contact || undefined,
            convention_actif: formData.convention_actif,
          },
        });
      } else {
        await createMutation.mutate({
          nom: formData.nom,
          adresse: formData.adresse || undefined,
          contact: formData.contact || undefined,
          convention_actif: formData.convention_actif,
        });
      }

      await refetch();
      toast.success(editingHopital ? "Hôpital mis à jour" : "Hôpital ajouté");
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
        title="Hôpitaux"
        description="Établissements de santé conventionnés"
        back={{ href: "/distribution", label: "Distribution" }}
        actions={
          <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Ajouter un hôpital
          </Button>
        }
      />

      <Card>
        {status === "loading" && <LoadingState />}

        {status === "error" && (
          <ErrorState message="Les hôpitaux n’ont pas pu être chargés." onRetry={() => refetch()} />
        )}

        {status === "success" && hopitaux?.length === 0 && (
          <EmptyState
            title="Aucun hôpital enregistré"
            description="Ajoutez un premier établissement pour pouvoir créer des commandes."
            icon={<Building2 className="h-6 w-6" aria-hidden="true" />}
            action={
              <Button size="sm" onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                Ajouter un hôpital
              </Button>
            }
          />
        )}

        {status === "success" && hopitaux && hopitaux.length > 0 && (
          <Table>
            <THead>
              <tr>
                <Th>Établissement</Th>
                <Th>Contact / adresse</Th>
                <Th>Convention</Th>
                <Th align="right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {hopitaux.map((hopital) => (
                <Tr key={hopital.id}>
                  <Td>
                    <p className="font-medium text-gray-900">{hopital.nom}</p>
                    <p className="mt-0.5 font-mono text-xs text-gray-500">ID {hopital.id.slice(0, 8)}…</p>
                  </Td>
                  <Td>
                    <p>{hopital.contact || "—"}</p>
                    {hopital.adresse ? <p className="max-w-xs truncate text-gray-600">{hopital.adresse}</p> : null}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {hopital.convention_actif ? (
                      <Badge tone="success" dot>
                        Convention active
                      </Badge>
                    ) : (
                      <Badge tone="neutral" dot>
                        Inactive
                      </Badge>
                    )}
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(hopital)}
                      icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                      aria-label={`Modifier ${hopital.nom}`}
                    >
                      Modifier
                    </Button>
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
        title={editingHopital ? "Modifier l’hôpital" : "Ajouter un hôpital"}
        footer={
          <>
            <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" form="hopital-form" loading={isLoading}>
              {isLoading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </>
        }
      >
        <form id="hopital-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert tone="danger">{formError}</Alert>}

          <Field label="Nom de l’établissement" required>
            <Input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex. : Hôpital Principal"
            />
          </Field>

          <Field label="Contact (téléphone / e-mail)">
            <Input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="Ex. : +221 77…"
            />
          </Field>

          <Field label="Adresse">
            <Textarea
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              rows={3}
              placeholder="Adresse complète"
            />
          </Field>

          <label htmlFor="hopital-convention" className="flex items-center gap-2 text-sm text-gray-800">
            <input
              id="hopital-convention"
              type="checkbox"
              checked={formData.convention_actif}
              onChange={(e) => setFormData({ ...formData, convention_actif: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Convention active (peut recevoir des produits)
          </label>
        </form>
      </Modal>
    </div>
  );
}
