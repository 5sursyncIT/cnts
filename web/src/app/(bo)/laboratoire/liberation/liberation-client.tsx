"use client";

import {
  useDon,
  useDons,
  useAnalyses,
  useCheckLiberation,
  useLibererDon,
} from "@cnts/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, RefreshCw, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
} from "@/components/ui";

export default function LiberationClient({ canValidate }: { canValidate: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const donIdFromUrl = searchParams.get("don_id");

  const [selectedDonId, setSelectedDonId] = useState<string>(donIdFromUrl || "");
  const [searchDin, setSearchDin] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [liberationStatus, setLiberationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const { mutate: libererDon } = useLibererDon(apiClient);

  // Charger les dons EN_ATTENTE (potentiellement prêts pour libération)
  const { data: donsEnAttente } = useDons(apiClient, {
    statut: "EN_ATTENTE",
    limit: 100,
  });

  // Charger le don sélectionné
  const { data: don, refetch: refetchDon } = useDon(
    apiClient,
    selectedDonId
  );

  // Charger les analyses
  const { data: analyses } = useAnalyses(apiClient, {
    don_id: selectedDonId || undefined,
  });

  // Vérifier l'état de libération
  const { data: liberation, refetch: refetchLiberation } = useCheckLiberation(
    apiClient,
    selectedDonId
  );

  // Recherche par DIN
  const handleSearchByDin = () => {
    const foundDon = donsEnAttente?.find((d) => d.din === searchDin.trim());
    if (foundDon) {
      setSelectedDonId(foundDon.id);
      setSearchDin("");
    } else {
      toast.error("Don introuvable avec ce DIN");
    }
  };

  // Confirmation et libération
  const handleLiberer = async () => {
    if (!selectedDonId || !canValidate) return;

    setLiberationStatus("loading");
    setErrorMessage("");

    try {
      await libererDon(selectedDonId);
      setLiberationStatus("success");
      setShowConfirmModal(false);
      toast.success("Don libéré");

      // Recharger les données
      await refetchDon();
      await refetchLiberation();

      // Rediriger vers la fiche du don après 2 secondes
      setTimeout(() => {
        router.push(`/dons/${selectedDonId}`);
      }, 2000);
    } catch (err) {
      console.error("Erreur libération:", err);
      setLiberationStatus("error");
      setErrorMessage(apiErrorMessage(err, "Erreur lors de la libération"));
    }
  };

  const TESTS_REQUIS = ["ABO", "RH", "VIH", "VHB", "VHC", "SYPHILIS"];

  const GROUPAGE_VALIDE = ["A", "B", "AB", "O", "POS", "NEG"];
  const resultTone = (resultat: string) =>
    resultat === "NEGATIF" || GROUPAGE_VALIDE.includes(resultat)
      ? "success"
      : resultat === "POSITIF"
        ? "danger"
        : "warning";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Libération biologique"
        description="Validation finale et libération des dons pour distribution"
        back={{ href: "/laboratoire", label: "Laboratoire" }}
      />

      {liberationStatus === "success" && (
        <Alert tone="success">Don libéré avec succès. Redirection vers la fiche du don…</Alert>
      )}

      {liberationStatus === "error" && (
        <Alert tone="danger">
          <p className="font-medium">Erreur lors de la libération</p>
          <p className="mt-0.5">{errorMessage}</p>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Section principale */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Sélectionner un don" />
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-end gap-2">
                <Field label="Recherche par DIN" className="min-w-0 flex-1">
                  <Input
                    type="text"
                    value={searchDin}
                    onChange={(e) => setSearchDin(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchByDin()}
                    placeholder="Ex. : CNTS2600X123456"
                    className="font-mono"
                  />
                </Field>
                <Button variant="secondary" onClick={handleSearchByDin} icon={<Search className="h-4 w-4" aria-hidden="true" />}>
                  Rechercher
                </Button>
              </div>

              <Field label="Ou sélectionner dans la liste des dons en attente">
                <Select value={selectedDonId} onChange={(e) => setSelectedDonId(e.target.value)}>
                  <option value="">— Choisir un don —</option>
                  {donsEnAttente?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.din} — {new Date(d.date_don).toLocaleDateString("fr-FR")}
                    </option>
                  ))}
                </Select>
              </Field>
            </CardBody>
          </Card>

          {!selectedDonId && (
            <Card>
              <EmptyState
                title="Aucun don sélectionné"
                description="Recherchez un don par son DIN ou choisissez-le dans la liste pour vérifier s’il est libérable."
              />
            </Card>
          )}

          {/* Résumé des analyses */}
          {selectedDonId && don && (
            <Card>
              <CardHeader title="Résultats des analyses" />
              {!analyses || analyses.length === 0 ? (
                <EmptyState
                  title="Aucune analyse enregistrée"
                  action={
                    <Link
                      href={`/laboratoire/analyses?don_id=${selectedDonId}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Ajouter des analyses
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {TESTS_REQUIS.map((testType) => {
                    const analyse = analyses.find((a) => a.type_test === testType);
                    return (
                      <li key={testType} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900">{testType}</div>
                          {analyse && analyse.note && <div className="mt-0.5 text-sm text-gray-600">{analyse.note}</div>}
                        </div>
                        {analyse ? (
                          <Badge tone={resultTone(analyse.resultat)} dot>
                            {analyse.resultat}
                          </Badge>
                        ) : (
                          <Badge tone="danger">Manquant</Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          )}

          {/* Informations du don */}
          {selectedDonId && don && (
            <Card>
              <CardHeader title="Don sélectionné" />
              <CardBody>
                <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-gray-500">DIN</dt>
                    <dd className="font-mono text-gray-900">{don.din}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Date</dt>
                    <dd className="text-gray-900">{new Date(don.date_don).toLocaleDateString("fr-FR")}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Type</dt>
                    <dd className="text-gray-900">{don.type_don}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Statut actuel</dt>
                    <dd className="mt-0.5">
                      <StatusBadge status={don.statut_qualification} />
                    </dd>
                  </div>
                </dl>
                <Link
                  href={`/dons/${don.id}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Voir la fiche complète
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Colonne latérale : validation */}
        <div className="space-y-6">
          {liberation && (
            <Card>
              <CardHeader title="Validation de libération" />
              <CardBody className="space-y-4">
                <div
                  className={`rounded-lg border p-4 ${liberation.liberable ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
                >
                  <div
                    className={`flex items-center gap-2 text-base font-semibold ${liberation.liberable ? "text-emerald-900" : "text-red-900"}`}
                  >
                    {liberation.liberable ? (
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-5 w-5" aria-hidden="true" />
                    )}
                    {liberation.liberable ? "Libérable" : "Non libérable"}
                  </div>
                  {liberation.raison && (
                    <p className={`mt-1 text-sm ${liberation.liberable ? "text-emerald-800" : "text-red-800"}`}>{liberation.raison}</p>
                  )}
                </div>

                {liberation.tests_manquants.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-gray-800">Tests manquants</p>
                    <div className="flex flex-wrap gap-1.5">
                      {liberation.tests_manquants.map((test) => (
                        <Badge key={test} tone="danger">{test}</Badge>
                      ))}
                    </div>
                    <Link
                      href={`/laboratoire/analyses?don_id=${selectedDonId}`}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Compléter les analyses
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                )}

                {liberation.tests_positifs.length > 0 && (
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-red-800">
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      Tests positifs
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {liberation.tests_positifs.map((test) => (
                        <Badge key={test} tone="danger" dot>{test}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {canValidate && liberation.liberable && don?.statut_qualification !== "LIBERE" && (
                  <div>
                    <Button
                      variant="success"
                      className="w-full"
                      onClick={() => setShowConfirmModal(true)}
                      loading={liberationStatus === "loading"}
                    >
                      Libérer le don
                    </Button>
                    <p className="mt-2 text-center text-xs text-gray-500">
                      La libération mettra à jour le statut du don et des poches.
                    </p>
                  </div>
                )}

                {don?.statut_qualification === "LIBERE" && (
                  <Alert tone="success">Ce don a déjà été libéré.</Alert>
                )}

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => refetchLiberation()}
                  icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
                >
                  Recalculer
                </Button>
              </CardBody>
            </Card>
          )}

          <Alert tone="danger">
            <p className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Règle de libération
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li>Les 6 tests doivent être effectués</li>
              <li>Le groupage (ABO + Rh) doit être déterminé</li>
              <li>Les sérologies (VIH, VHB, VHC, Syphilis) doivent être négatives</li>
              <li>Toute anomalie bloque la libération</li>
            </ul>
          </Alert>

          <Alert tone="info">
            <p className="font-medium">Étapes de libération</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              <li>Vérifier toutes les analyses</li>
              <li>Confirmer la conformité biologique</li>
              <li>Libérer le don</li>
              <li>Les poches deviennent disponibles</li>
              <li>Le don peut être fractionné ou distribué</li>
            </ol>
          </Alert>
        </div>
      </div>

      <Modal
        open={showConfirmModal}
        onClose={() => {
          if (liberationStatus !== "loading") setShowConfirmModal(false);
        }}
        title="Confirmer la libération biologique"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)} disabled={liberationStatus === "loading"}>
              Annuler
            </Button>
            <Button variant="success" onClick={handleLiberer} loading={liberationStatus === "loading"}>
              Confirmer la libération
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs font-medium text-gray-600">Don</div>
            <div className="font-mono text-gray-900">{don?.din}</div>
          </div>
          <div className="text-gray-700">
            <p className="font-medium text-gray-900">Conséquences de la libération :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Le don passe au statut « Libéré »</li>
              <li>Les poches associées deviennent « Disponible »</li>
              <li>Action irréversible</li>
            </ul>
          </div>
          {analyses && (
            <p className="text-xs text-gray-600">
              <span className="font-medium">Résumé :</span> {analyses.length} analyse(s) validée(s)
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
