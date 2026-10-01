"use client";

import { useDonneur, useCheckEligibilite } from "@cnts/api";
import { apiClient } from "@/lib/api-client";
import { useParams } from "next/navigation";
import { Calendar, CheckCircle, XCircle } from "lucide-react";

import { Badge, ButtonLink, Card, CardBody, CardHeader, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function EligibilitePage() {
  const params = useParams();
  const donneurId = params.id as string;

  const { data: donneur, status: donneurStatus, refetch: refetchDonneur } = useDonneur(apiClient, donneurId);
  const { data: eligibilite, status: eligibiliteStatus, refetch: refetchEligibilite } = useCheckEligibilite(apiClient, donneurId);

  const isLoading = donneurStatus === "loading" || eligibiliteStatus === "loading";
  const isError = donneurStatus === "error" || eligibiliteStatus === "error";

  const back = { href: `/donneurs/${donneurId}`, label: "Retour à la fiche donneur" };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader title="Vérification d’éligibilité" back={back} />
        <Card>
          <LoadingState rows={5} label="Chargement de l’éligibilité…" />
        </Card>
      </div>
    );
  }

  if (isError || !donneur) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader title="Vérification d’éligibilité" back={{ href: "/donneurs", label: "Retour à la liste" }} />
        <Card>
          <ErrorState
            message="Erreur lors du chargement des données."
            onRetry={() => {
              refetchDonneur();
              refetchEligibilite();
            }}
          />
        </Card>
      </div>
    );
  }

  const eligible = Boolean(eligibilite?.eligible);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Vérification d’éligibilité"
        description={`${donneur.prenom} ${donneur.nom}`}
        back={back}
        actions={
          <>
            <ButtonLink href={`/donneurs/${donneurId}`} variant="secondary">
              Voir le dossier complet
            </ButtonLink>
            {eligible && (
              <ButtonLink href={`/dons/nouveau?donneur_id=${donneurId}`} icon={<CheckCircle className="h-4 w-4" aria-hidden="true" />}>
                Enregistrer un don
              </ButtonLink>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className={cn(eligible ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50")}>
          <CardBody>
            <div className="flex items-center gap-4" role="status">
              {eligible ? (
                <CheckCircle className="h-10 w-10 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <XCircle className="h-10 w-10 shrink-0 text-red-600" aria-hidden="true" />
              )}
              <div>
                <h2 className={cn("text-lg font-bold", eligible ? "text-emerald-900" : "text-red-900")}>
                  {eligible ? "Éligible au don" : "Non éligible temporairement"}
                </h2>
                <p className={cn("text-sm", eligible ? "text-emerald-800" : "text-red-800")}>
                  {eligible
                    ? "Ce donneur peut effectuer un don aujourd’hui."
                    : eligibilite?.raison || "Le délai entre deux dons n’est pas respecté."}
                </p>
              </div>
            </div>

            {!eligible && eligibilite?.eligible_le && (
              <div className="mt-4 rounded-lg border border-red-100 bg-white p-4">
                <p className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  Prochaine date possible
                </p>
                <p className="ml-6 text-lg font-bold capitalize text-gray-900">
                  {new Date(eligibilite.eligible_le).toLocaleDateString("fr-FR", {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                {eligibilite.delai_jours && (
                  <p className="ml-6 mt-1 text-sm text-gray-600">Dans {eligibilite.delai_jours} jours</p>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Informations clés" />
          <CardBody>
            <dl className="divide-y divide-gray-100 text-sm">
              <div className="flex justify-between gap-4 py-2 first:pt-0">
                <dt className="text-gray-600">Sexe</dt>
                <dd className="font-medium text-gray-900">{donneur.sexe === "H" ? "Homme" : "Femme"}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-gray-600">Groupe sanguin</dt>
                <dd>
                  <Badge tone={donneur.groupe_sanguin ? "danger" : "neutral"}>{donneur.groupe_sanguin || "Inconnu"}</Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-gray-600">Dernier don</dt>
                <dd className="font-medium text-gray-900">
                  {donneur.dernier_don
                    ? new Date(donneur.dernier_don).toLocaleDateString("fr-FR")
                    : "Jamais"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2 last:pb-0">
                <dt className="text-gray-600">Intervalle requis</dt>
                <dd>
                  <Badge tone="info">{donneur.sexe === "H" ? "3 mois (Hommes)" : "4 mois (Femmes)"}</Badge>
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
