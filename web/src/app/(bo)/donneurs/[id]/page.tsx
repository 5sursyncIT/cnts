"use client";

import { useDonneur, useCheckEligibilite, useDons, useUpdateDonneur, useDeleteDonneur, useRegions, useCreateCarteDonneur } from "@cnts/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Archive, CheckCircle2, Droplet, Info, Pencil, Plus, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { DocumentsSection } from "./documents-section";
import { RendezVousSection } from "./rendez-vous-section";

import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
} from "@/components/ui";

const GROUPES_SANGUINS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function NonRenseigne() {
  return <span className="italic text-gray-400">Non renseigné</span>;
}

function InfoItem({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{children}</dd>
    </div>
  );
}

export default function DonneurDetailPage() {
  const params = useParams();
  const router = useRouter();
  const donneurId = params.id as string;
  const [isEditing, setIsEditing] = useState(false);
  // Stable : la Modal ré-exécute son effet (focus) quand onClose change.
  const closeEdit = useCallback(() => setIsEditing(false), []);

  const { data: regions } = useRegions(apiClient);

  const {
    data: donneur,
    status: donneurStatus,
    error: donneurError,
    refetch: refetchDonneur,
  } = useDonneur(apiClient, donneurId);

  const { mutate: updateDonneur, status: updateStatus } = useUpdateDonneur(apiClient);
  const { mutate: deleteDonneur, status: deleteStatus } = useDeleteDonneur(apiClient);
  const { mutate: createCarte, status: createCarteStatus } = useCreateCarteDonneur(apiClient);
  const [showCarteForm, setShowCarteForm] = useState(false);
  const [numeroCarte, setNumeroCarte] = useState("");

  const handleDelete = async () => {
    if (!confirm("Archiver ce donneur ? Sa fiche sera masquée des listes, mais ses dons restent conservés pour la traçabilité (hémovigilance). Action réservée aux administrateurs.")) {
      return;
    }

    try {
      await deleteDonneur(donneurId);
      toast.success("Donneur archivé");
      router.push("/donneurs");
    } catch (err: any) {
      console.error("Erreur lors de la suppression", err);
      toast.error(
        err?.status === 403
          ? "Action réservée aux administrateurs."
          : apiErrorMessage(err, "Erreur lors de la suppression.")
      );
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await updateDonneur({
        id: donneurId,
        data: {
          nom: formData.get("nom") as string,
          prenom: formData.get("prenom") as string,
          sexe: formData.get("sexe") as "H" | "F",
          date_naissance: (formData.get("date_naissance") as string) || null,
          groupe_sanguin: (formData.get("groupe_sanguin") as string) || null,
          cni: (formData.get("cni") as string) || null,
          adresse: (formData.get("adresse") as string) || null,
          region: (formData.get("region") as string) || null,
          departement: (formData.get("departement") as string) || null,
          telephone: (formData.get("telephone") as string) || null,
          email: (formData.get("email") as string) || null,
          profession: (formData.get("profession") as string) || null,
        }
      });
      setIsEditing(false);
      toast.success("Donneur mis à jour");
      refetchDonneur();
    } catch (err) {
      console.error("Erreur lors de la mise à jour", err);
      toast.error(apiErrorMessage(err, "Erreur lors de la mise à jour"));
    }
  };

  const handleCreateCarte = async () => {
    if (!numeroCarte.trim()) return;
    try {
      await createCarte({ donneur_id: donneurId, numero_carte: numeroCarte.trim() });
      setShowCarteForm(false);
      setNumeroCarte("");
      toast.success("Carte donneur attribuée");
      refetchDonneur();
    } catch (err: any) {
      toast.error(apiErrorMessage(err, "Erreur lors de la création de la carte"));
    }
  };

  const {
    data: eligibilite,
    status: eligibiliteStatus,
    refetch: refetchEligibilite,
  } = useCheckEligibilite(apiClient, donneurId);

  const {
    data: dons,
    status: donsStatus,
    refetch: refetchDons,
  } = useDons(apiClient, { donneur_id: donneurId, limit: 50 });

  if (donneurStatus === "loading") {
    return (
      <div className="space-y-6">
        <PageHeader title="Fiche donneur" back={{ href: "/donneurs", label: "Retour à la liste" }} />
        <Card>
          <LoadingState rows={6} />
        </Card>
      </div>
    );
  }

  if (donneurStatus === "error" || !donneur) {
    return (
      <div className="space-y-6">
        <PageHeader title="Fiche donneur" back={{ href: "/donneurs", label: "Retour à la liste" }} />
        <Card>
          <ErrorState
            title={donneurError?.status === 404 ? "Donneur introuvable" : "Chargement impossible"}
            message={donneurError?.status === 404 ? "Ce donneur n’existe pas ou a été archivé." : apiErrorMessage(donneurError, "Erreur inconnue")}
            onRetry={donneurError?.status === 404 ? undefined : () => refetchDonneur()}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/donneurs", label: "Retour à la liste" }}
        title={`${donneur.nom}, ${donneur.prenom}`}
        description={
          <span className="mt-1 flex flex-wrap gap-2">
            <Badge tone={donneur.sexe === "H" ? "info" : "purple"}>{donneur.sexe === "H" ? "Homme" : "Femme"}</Badge>
            {donneur.groupe_sanguin ? <Badge tone="danger">{donneur.groupe_sanguin}</Badge> : null}
            {eligibilite && (
              <Badge tone={eligibilite.eligible ? "success" : "danger"} dot>
                {eligibilite.eligible ? "Éligible" : "Non éligible"}
              </Badge>
            )}
          </span>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsEditing(true)} icon={<Pencil className="h-4 w-4" aria-hidden="true" />}>
              Modifier
            </Button>
            <Button
              variant="ghost"
              onClick={handleDelete}
              loading={deleteStatus === "loading"}
              className="text-brand-700 hover:bg-red-50"
              icon={<Archive className="h-4 w-4" aria-hidden="true" />}
            >
              Archiver
            </Button>
            <ButtonLink href={`/dons/nouveau?donneur_id=${donneurId}`} variant="success" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              Créer un don
            </ButtonLink>
          </>
        }
      />

      <Modal
        open={isEditing}
        onClose={closeEdit}
        title="Modifier le donneur"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeEdit}>
              Annuler
            </Button>
            <Button type="submit" form="donneur-edit-form" loading={updateStatus === "loading"}>
              {updateStatus === "loading" ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </>
        }
      >
        <form id="donneur-edit-form" onSubmit={handleUpdate} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" required>
            <Input name="nom" defaultValue={donneur.nom} />
          </Field>
          <Field label="Prénom" required>
            <Input name="prenom" defaultValue={donneur.prenom} />
          </Field>
          <Field label="Sexe">
            <Select name="sexe" defaultValue={donneur.sexe}>
              <option value="H">Homme</option>
              <option value="F">Femme</option>
            </Select>
          </Field>
          <Field label="Date de naissance">
            <Input
              type="date"
              name="date_naissance"
              defaultValue={donneur.date_naissance ? new Date(donneur.date_naissance).toISOString().split('T')[0] : ""}
            />
          </Field>
          <Field label="Groupe sanguin">
            <Select name="groupe_sanguin" defaultValue={donneur.groupe_sanguin || ""}>
              <option value="">Non renseigné</option>
              {GROUPES_SANGUINS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
          </Field>
          <div className="space-y-1.5">
            <p className="block text-sm font-medium text-gray-800">N° carte donneur</p>
            <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm">
              {donneur.numero_carte ? (
                <span className="font-mono text-gray-800">{donneur.numero_carte}</span>
              ) : (
                <span className="italic text-gray-400">Non attribuée</span>
              )}
            </div>
            <p className="text-xs text-gray-500">Géré via Fidélisation &gt; Cartes donneur</p>
          </div>
          <Field label="CNI (nouveau)" hint="Le CNI n’est pas stocké pour des raisons de confidentialité">
            <Input name="cni" placeholder="Laisser vide pour conserver" autoComplete="off" />
          </Field>
          <Field label="Téléphone">
            <Input type="tel" name="telephone" defaultValue={donneur.telephone || ""} />
          </Field>
          <Field label="E-mail">
            <Input type="email" name="email" defaultValue={donneur.email || ""} />
          </Field>
          <Field label="Région">
            <Select name="region" defaultValue={donneur.region || ""}>
              <option value="">Choisir une région</option>
              {regions?.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </Select>
          </Field>
          <Field label="Département">
            <Input name="departement" defaultValue={donneur.departement || ""} />
          </Field>
          <Field label="Adresse">
            <Input name="adresse" defaultValue={donneur.adresse || ""} />
          </Field>
          <Field label="Profession">
            <Input name="profession" defaultValue={donneur.profession || ""} />
          </Field>
        </form>
      </Modal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Informations" />
            <CardBody>
              <dl className="grid gap-4 sm:grid-cols-2">
                <InfoItem label="N° carte donneur" wide>
                  {donneur.numero_carte ? (
                    <span className="font-mono text-sm text-gray-900">{donneur.numero_carte}</span>
                  ) : showCarteForm ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Input
                        type="text"
                        value={numeroCarte}
                        onChange={(e) => setNumeroCarte(e.target.value)}
                        placeholder="Ex. : CNTS-2026-00001"
                        aria-label="Numéro de carte"
                        className="w-full sm:w-64"
                      />
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleCreateCarte}
                        disabled={!numeroCarte.trim()}
                        loading={createCarteStatus === "loading"}
                      >
                        Valider
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setShowCarteForm(false); setNumeroCarte(""); }}
                      >
                        Annuler
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowCarteForm(true)}
                      icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                    >
                      Attribuer une carte
                    </Button>
                  )}
                </InfoItem>
                <InfoItem label="Identifiant">
                  <code className="break-all rounded bg-gray-100 px-2 py-1 text-xs">{donneur.id}</code>
                </InfoItem>
                <InfoItem label="Date de naissance">
                  {donneur.date_naissance
                    ? new Date(donneur.date_naissance).toLocaleDateString("fr-FR")
                    : <NonRenseigne />}
                </InfoItem>
                <InfoItem label="Groupe sanguin">
                  {donneur.groupe_sanguin ? <span className="font-bold text-brand-700">{donneur.groupe_sanguin}</span> : <NonRenseigne />}
                </InfoItem>
                <InfoItem label="Téléphone">{donneur.telephone || <NonRenseigne />}</InfoItem>
                <InfoItem label="E-mail">
                  {donneur.email ? (
                    <a href={`mailto:${donneur.email}`} className="break-all text-blue-600 hover:underline">
                      {donneur.email}
                    </a>
                  ) : (
                    <NonRenseigne />
                  )}
                </InfoItem>
                <InfoItem label="Adresse">{donneur.adresse || <NonRenseigne />}</InfoItem>
                <InfoItem label="Dernier don">
                  {donneur.dernier_don
                    ? new Date(donneur.dernier_don).toLocaleDateString("fr-FR")
                    : "Jamais"}
                </InfoItem>
                <InfoItem label="Créé le">
                  {donneur.created_at ? new Date(donneur.created_at).toLocaleDateString("fr-FR") : "—"}
                </InfoItem>
              </dl>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Historique des dons"
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchDons()}
                  icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
                >
                  Actualiser
                </Button>
              }
            />

            {donsStatus === "loading" && <LoadingState rows={3} />}

            {donsStatus === "error" && (
              <ErrorState message="Impossible de charger l’historique des dons." onRetry={() => refetchDons()} />
            )}

            {donsStatus === "success" && dons && dons.length === 0 && (
              <EmptyState
                icon={<Droplet className="h-6 w-6" aria-hidden="true" />}
                title="Aucun don enregistré"
                description="Ce donneur n’a encore effectué aucun don."
                action={
                  <ButtonLink href={`/dons/nouveau?donneur_id=${donneurId}`} size="sm" variant="success" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                    Créer un don
                  </ButtonLink>
                }
              />
            )}

            {donsStatus === "success" && dons && dons.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {dons.map((don) => (
                  <li key={don.id}>
                    <Link
                      href={`/dons/${don.id}`}
                      className="flex items-start justify-between gap-3 px-5 py-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-medium text-gray-900">DIN : {don.din}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          {new Date(don.date_don).toLocaleDateString("fr-FR")} · {don.type_don}
                        </p>
                      </div>
                      <StatusBadge status={don.statut_qualification} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <RendezVousSection donneurId={donneurId} />
          {/* L'API limite le dépôt au module donneurs : quiconque voit cette fiche peut déposer. */}
          <DocumentsSection donneurId={donneurId} canWrite />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Éligibilité" />
            <CardBody>
              {eligibiliteStatus === "loading" && <LoadingState rows={3} className="p-0" label="Calcul…" />}

              {eligibiliteStatus === "success" && eligibilite && (
                <div className="space-y-4">
                  <Alert tone={eligibilite.eligible ? "success" : "danger"}>
                    <p className="flex items-center gap-2 text-base font-semibold">
                      {eligibilite.eligible ? (
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-5 w-5" aria-hidden="true" />
                      )}
                      {eligibilite.eligible ? "Peut donner" : "Ne peut pas donner"}
                    </p>
                    {eligibilite.raison && <p className="mt-1">{eligibilite.raison}</p>}
                  </Alert>

                  {eligibilite.eligible_le && (
                    <div className="text-sm">
                      <p className="font-medium text-gray-600">Éligible à partir du</p>
                      <p className="mt-1 text-gray-900">
                        {new Date(eligibilite.eligible_le).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}

                  {eligibilite.delai_jours !== null && (
                    <div className="text-sm">
                      <p className="font-medium text-gray-600">Délai restant</p>
                      <p className="mt-1 text-gray-900">{eligibilite.delai_jours} jours</p>
                    </div>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => refetchEligibilite()}
                    icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
                  >
                    Recalculer
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          <Alert tone="info">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Règles d’éligibilité</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
                  <li>Âge : 18 à 60 ans</li>
                  <li>Hommes : 3 mois entre dons (4 dons/an max)</li>
                  <li>Femmes : 4 mois entre dons (3 dons/an max)</li>
                  <li>Le calcul est fait depuis le dernier don enregistré</li>
                </ul>
              </div>
            </div>
          </Alert>
        </div>
      </div>
    </div>
  );
}
