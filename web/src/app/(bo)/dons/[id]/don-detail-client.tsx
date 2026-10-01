"use client";

import {
  useDon,
  useDonneur,
  useAnalyses,
  useCheckLiberation,
} from "@cnts/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, FlaskConical, Printer, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import { renderProductLabelHtml } from "@/lib/labels/product-label";
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
  LoadingState,
  PageHeader,
  StatusBadge,
  type BadgeTone,
} from "@/components/ui";
import ApheresisCollection from "./apheresis-collection";

const TESTS = ["ABO", "RH", "VIH", "VHB", "VHC", "SYPHILIS"];

function resultatTone(resultat: string): BadgeTone {
  if (resultat === "NEGATIF" || ["A", "B", "AB", "O", "POS", "NEG"].includes(resultat)) return "success";
  if (resultat === "POSITIF") return "danger";
  return "neutral";
}

export default function DonDetailClient({ canManageApheresis }: { canManageApheresis: boolean }) {
  const params = useParams();
  const donId = params.id as string;

  const { data: don, status: donStatus, error: donError, refetch: refetchDon } = useDon(apiClient, donId);
  const { data: donneur } = useDonneur(apiClient, don?.donneur_id || "");
  const { data: analyses, refetch: refetchAnalyses } = useAnalyses(apiClient, {
    don_id: donId,
  });
  const { data: liberation, refetch: refetchLiberation } = useCheckLiberation(
    apiClient,
    donId
  );

  const [downloadingEtiquette, setDownloadingEtiquette] = useState(false);

  const handleDownloadEtiquette = async (pocheId: string) => {
    // Fenêtre ouverte dans le geste utilisateur (sinon bloquée comme popup).
    const printWindow = window.open("", "_blank", "width=480,height=520");
    if (!printWindow) {
      toast.error("Autorisez les fenêtres pop-up pour imprimer l’étiquette.");
      return;
    }
    setDownloadingEtiquette(true);
    try {
      const etiquette = await apiClient.poches.etiquetteProduit(pocheId);
      printWindow.document.open();
      printWindow.document.write(renderProductLabelHtml(etiquette));
      printWindow.document.close();
    } catch (err) {
      printWindow.close();
      toast.error(apiErrorMessage(err, "Erreur lors de la génération de l’étiquette"));
    } finally {
      setDownloadingEtiquette(false);
    }
  };

  const back = { href: "/dons", label: "Retour à la liste" };

  if (donStatus === "loading") {
    return (
      <div className="space-y-6">
        <PageHeader title="Don" back={back} />
        <Card>
          <LoadingState rows={6} />
        </Card>
      </div>
    );
  }

  if (donStatus === "error" || !don) {
    return (
      <div className="space-y-6">
        <PageHeader title="Don" back={back} />
        <Card>
          <ErrorState
            title={donError?.status === 404 ? "Don introuvable" : "Chargement impossible"}
            message={donError?.status === 404 ? "Ce don n’existe pas." : apiErrorMessage(donError, "Erreur inconnue")}
            onRetry={donError?.status === 404 ? undefined : () => refetchDon()}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        back={back}
        title={<span className="font-mono">Don {don.din}</span>}
        description={
          <span className="mt-1 flex flex-wrap gap-2">
            <StatusBadge status={don.statut_qualification} />
            <Badge tone="neutral">{don.type_don}</Badge>
          </span>
        }
        actions={
          don.statut_qualification !== "LIBERE" ? (
            <ButtonLink
              href={`/laboratoire/analyses?don_id=${donId}`}
              icon={<FlaskConical className="h-4 w-4" aria-hidden="true" />}
            >
              Ajouter des analyses
            </ButtonLink>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Informations du don" />
            <CardBody>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">DIN</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <code className="rounded bg-gray-100 px-2 py-1">{don.din}</code>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date du don</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(don.date_don).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{don.type_don}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Créé le</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(don.created_at).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
                {donneur && (
                  <div className="border-t border-gray-100 pt-4 sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Donneur</dt>
                    <dd className="mt-1 text-sm">
                      <Link href={`/donneurs/${donneur.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                        {donneur.nom}, {donneur.prenom} ({donneur.sexe === "H" ? "Homme" : "Femme"}) →
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Analyses biologiques"
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchAnalyses()}
                  icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
                >
                  Actualiser
                </Button>
              }
            />

            {!analyses || analyses.length === 0 ? (
              <EmptyState
                icon={<FlaskConical className="h-6 w-6" aria-hidden="true" />}
                title="Aucune analyse enregistrée"
                action={
                  <ButtonLink href={`/laboratoire/analyses?don_id=${donId}`} size="sm" variant="secondary">
                    Ajouter des analyses
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="divide-y divide-gray-100">
                {TESTS.map((testType) => {
                  const analyse = analyses.find((a) => a.type_test === testType);
                  return (
                    <li key={testType} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{testType}</p>
                        {analyse && analyse.note && (
                          <p className="mt-1 text-sm text-gray-600">{analyse.note}</p>
                        )}
                      </div>
                      {analyse ? (
                        <Badge tone={resultatTone(analyse.resultat)}>{analyse.resultat}</Badge>
                      ) : (
                        <Badge tone="neutral">Non effectué</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {canManageApheresis && ["PLASMAPHERESE", "CYTAPHERESE"].includes(don.type_don) && (
            <ApheresisCollection don={don} onSaved={async () => {
              await refetchDon();
              await refetchLiberation();
            }} />
          )}

          <Card className="overflow-hidden">
            <CardHeader title="Poches créées" />

            {!don.poches || don.poches.length === 0 ? (
              <EmptyState title="Aucune poche créée" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {don.poches.map((poche) => (
                  <li key={poche.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {poche.type_produit}
                        {poche.groupe_sanguin && ` · ${poche.groupe_sanguin}`}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Péremption : {new Date(poche.date_peremption).toLocaleDateString("fr-FR")}
                        {poche.volume_ml && ` · ${poche.volume_ml} ml`}
                      </p>
                      {poche.emplacement_stock && (
                        <p className="mt-1 text-sm text-gray-500">{poche.emplacement_stock}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <StatusBadge status={poche.statut_distribution} />
                        <StatusBadge status={poche.statut_stock} />
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownloadEtiquette(poche.id)}
                        disabled={downloadingEtiquette}
                        icon={<Printer className="h-4 w-4" aria-hidden="true" />}
                      >
                        Étiquette
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {liberation && (
            <Card>
              <CardHeader title="Statut de libération" />
              <CardBody className="space-y-4">
                <Alert tone={liberation.liberable ? "success" : "danger"}>
                  <p className="flex items-center gap-2 text-base font-semibold">
                    {liberation.liberable ? (
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-5 w-5" aria-hidden="true" />
                    )}
                    {liberation.liberable ? "Libérable" : "Non libérable"}
                  </p>
                  {liberation.raison && <p className="mt-1">{liberation.raison}</p>}
                </Alert>

                {liberation.tests_manquants.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Tests manquants</p>
                    <div className="flex flex-wrap gap-1.5">
                      {liberation.tests_manquants.map((test) => (
                        <Badge key={test} tone="warning">{test}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {liberation.tests_positifs.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Tests positifs</p>
                    <div className="flex flex-wrap gap-1.5">
                      {liberation.tests_positifs.map((test) => (
                        <Badge key={test} tone="danger">{test}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {liberation.liberable && (
                    <ButtonLink href={`/laboratoire/liberation?don_id=${donId}`} variant="success" className="w-full">
                      Libérer le don
                    </ButtonLink>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => refetchLiberation()}
                    icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
                  >
                    Recalculer
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          <Alert tone="danger">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Règle d’or</p>
                <p className="mt-1 text-xs">
                  Aucune poche ne peut être distribuée sans libération biologique
                  validée. Tous les tests doivent être négatifs.
                </p>
              </div>
            </div>
          </Alert>
        </div>
      </div>
    </div>
  );
}
