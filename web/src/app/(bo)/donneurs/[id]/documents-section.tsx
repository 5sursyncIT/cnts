"use client";

import { useDeleteDocumentDonneur, useDocumentsDonneur, useUploadDocumentDonneur, type TypeDocumentDonneur } from "@cnts/api";
import { useCallback, useState } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Alert, Badge, Button, Card, CardHeader, EmptyState, ErrorState, Field, Input, LoadingState, Modal, Select, Textarea } from "@/components/ui";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import { tailleLisible } from "@/lib/rendez-vous";

const TYPES: { value: TypeDocumentDonneur; label: string }[] = [
  { value: "ATTESTATION", label: "Attestation" },
  { value: "CERTIFICAT", label: "Certificat" },
  { value: "COMPTE_RENDU", label: "Compte-rendu" },
  { value: "AUTRE", label: "Autre" },
];
const LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label])) as Record<string, string>;

/** Documents visibles par le donneur dans son espace (jamais de résultat d'analyse). */
export function DocumentsSection({ donneurId, canWrite }: { donneurId: string; canWrite: boolean }) {
  const { data, status, error, refetch } = useDocumentsDonneur(apiClient, donneurId);
  const upload = useUploadDocumentDonneur(apiClient);
  const remove = useDeleteDocumentDonneur(apiClient);
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const fermer = useCallback(() => {
    setOuvert(false);
    setErreur(null);
  }, []);

  const deposer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fichier = form.get("fichier");
    if (!(fichier instanceof File) || !fichier.size) return setErreur("Choisissez un fichier.");
    if (fichier.size > 10 * 1024 * 1024) return setErreur("Fichier trop volumineux (10 Mo maximum).");
    try {
      await upload.mutate({ donneurId, form });
      toast.success("Document déposé : il est visible dans l'espace du donneur.");
      fermer();
      refetch();
    } catch (err) {
      setErreur(apiErrorMessage(err, "Dépôt impossible."));
    }
  };

  const supprimer = async (docId: string, titre: string) => {
    if (!window.confirm(`Supprimer « ${titre} » ? Le donneur ne le verra plus.`)) return;
    try {
      await remove.mutate({ donneurId, docId });
      toast.success("Document supprimé.");
      refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Suppression impossible."));
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Documents remis au donneur"
        description="Visibles dans son espace en ligne. Les résultats d'analyses ne doivent jamais y être déposés."
        actions={
          canWrite ? (
            <Button size="sm" variant="secondary" icon={<Upload className="h-4 w-4" aria-hidden="true" />} onClick={() => setOuvert(true)}>
              Déposer
            </Button>
          ) : undefined
        }
      />
      {status === "loading" && <LoadingState rows={2} />}
      {status === "error" && <ErrorState message={apiErrorMessage(error, "Impossible de charger les documents.")} onRetry={() => refetch()} />}
      {status === "success" && (data ?? []).length === 0 && (
        <EmptyState icon={<FileText className="h-6 w-6" aria-hidden="true" />} title="Aucun document" description="Aucun document n'a été remis à ce donneur." />
      )}
      {status === "success" && (data ?? []).length > 0 && (
        <ul className="divide-y divide-gray-100">
          {(data ?? []).map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  {d.titre} <Badge tone="neutral">{LABEL[d.type_document] ?? d.type_document}</Badge>
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(d.date_document).toLocaleDateString("fr-FR")} · {d.fichier_nom ?? "—"} · {tailleLisible(d.taille)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {d.fichier_nom && (
                  <a
                    href={apiClient.documentsDonneur.fileUrl(donneurId, d.id)}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    aria-label={`Télécharger ${d.titre}`}
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => supprimer(d.id, d.titre)}
                    className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-700"
                    aria-label={`Supprimer ${d.titre}`}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={ouvert}
        onClose={fermer}
        title="Déposer un document"
        description="PDF, PNG ou JPEG, 10 Mo maximum."
        footer={
          <>
            <Button variant="secondary" onClick={fermer} disabled={upload.isLoading}>
              Annuler
            </Button>
            <Button type="submit" form="document-donneur-form" loading={upload.isLoading}>
              Déposer
            </Button>
          </>
        }
      >
        <form id="document-donneur-form" onSubmit={deposer} className="space-y-4">
          {erreur && <Alert tone="danger">{erreur}</Alert>}
          <Field label="Titre" required>
            <Input name="titre" required minLength={2} maxLength={200} placeholder="Ex. : Attestation de don du 30/09/2026" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type" required>
              <Select name="type_document" required defaultValue="ATTESTATION">
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date du document" required>
              <Input name="date_document" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea name="description" rows={2} maxLength={2000} />
          </Field>
          <Field label="Fichier" required>
            <Input name="fichier" type="file" accept="application/pdf,image/png,image/jpeg" required />
          </Field>
        </form>
      </Modal>
    </Card>
  );
}
