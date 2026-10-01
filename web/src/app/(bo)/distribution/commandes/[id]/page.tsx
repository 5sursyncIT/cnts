"use client";

import {
  useCommande,
  useCommandeEvents,
  useConfirmerCommande,
  useHopital,
  useValiderCommande,
  useAnnulerCommande,
  useServirCommande,
} from "@cnts/api";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import { AlertTriangle, CheckCircle2, Circle, ClipboardCheck, MapPin, Phone, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  LoadingState,
  Modal,
  PageHeader,
  StatusBadge,
  statusLabel,
} from "@/components/ui";

import { AffectationPanel } from "./affectation-panel";

export default function CommandeDetailPage() {
  const params = useParams();
  const commandeId = params.id as string;

  const [showConfirmValidation, setShowConfirmValidation] = useState(false);
  const [showConfirmReservation, setShowConfirmReservation] = useState(false);
  const [showConfirmService, setShowConfirmService] = useState(false);
  const [showConfirmAnnulation, setShowConfirmAnnulation] = useState(false);

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshState, setRefreshState] = useState<"idle" | "loading" | "error">("idle");
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const inflightRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  const { data: commande, status, error, refetch } = useCommande(
    apiClient,
    commandeId
  );
  const {
    data: commandeEvents,
    refetch: refetchEvents,
  } = useCommandeEvents(apiClient, commandeId, {
    limit: 50,
  });
  const { data: hopital } = useHopital(
    apiClient,
    commande?.hopital_id || ""
  );

  const { mutate: validerCommande, status: validerStatus } =
    useValiderCommande(apiClient);
  const { mutate: servirCommande, status: servirStatus } =
    useServirCommande(apiClient);
  const { mutate: annulerCommande, status: annulerStatus } =
    useAnnulerCommande(apiClient);
  const { mutate: confirmerCommande, status: confirmerStatus } =
    useConfirmerCommande(apiClient);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("bo.autoRefreshEnabled");
    if (stored === "false") setAutoRefreshEnabled(false);

    const onRefreshSetting = (event: Event) => {
      const customEvent = event as CustomEvent<{ enabled?: boolean }>;
      if (typeof customEvent.detail?.enabled === "boolean") {
        setAutoRefreshEnabled(customEvent.detail.enabled);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "bo.autoRefreshEnabled") {
        setAutoRefreshEnabled(event.newValue !== "false");
      }
    };

    window.addEventListener("bo:autoRefreshChanged", onRefreshSetting as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("bo:autoRefreshChanged", onRefreshSetting as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const refreshData = useCallback(async (options?: { force?: boolean }) => {
    const now = Date.now();
    if (!options?.force && now - lastFetchAtRef.current < 5000) return;
    if (inflightRef.current) return;
    inflightRef.current = true;
    lastFetchAtRef.current = now;
    setRefreshState("loading");
    setRefreshError(null);
    try {
      await Promise.all([refetch(), refetchEvents()]);
      setRefreshState("idle");
    } catch (err) {
      setRefreshState("error");
      setRefreshError(err instanceof Error ? err.message : "Connexion interrompue");
    } finally {
      inflightRef.current = false;
    }
  }, [refetch, refetchEvents]);

  useEffect(() => {
    let intervalId: number | null = null;
    if (autoRefreshEnabled) {
      intervalId = window.setInterval(() => {
        refreshData();
      }, 15000) as unknown as number;
    }
    return () => {
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [autoRefreshEnabled, refreshData]);

  const closeValidation = useCallback(() => {
    if (validerStatus !== "loading") setShowConfirmValidation(false);
  }, [validerStatus]);
  const closeReservation = useCallback(() => {
    if (confirmerStatus !== "loading") setShowConfirmReservation(false);
  }, [confirmerStatus]);
  const closeService = useCallback(() => {
    if (servirStatus !== "loading") setShowConfirmService(false);
  }, [servirStatus]);
  const closeAnnulation = useCallback(() => {
    if (annulerStatus !== "loading") setShowConfirmAnnulation(false);
  }, [annulerStatus]);

  const refreshDotClass =
    refreshState === "loading"
      ? "bg-blue-500 animate-pulse"
      : refreshState === "error"
      ? "bg-red-500"
      : autoRefreshEnabled
      ? "bg-emerald-500"
      : "bg-gray-400";
  const refreshLabel = autoRefreshEnabled
    ? refreshState === "loading"
      ? "Mise à jour…"
      : refreshState === "error"
      ? "Connexion interrompue"
      : "Données à jour"
    : "Rafraîchissement désactivé";

  // Valider la commande
  const handleValider = async () => {
    try {
      await validerCommande({ id: commandeId });
      setShowConfirmValidation(false);
      toast.success("Commande validée, poches réservées");
      refetch();
    } catch (err) {
      console.error("Erreur validation:", err);
      toast.error(apiErrorMessage(err, "Erreur lors de la validation"));
    }
  };

  // Servir la commande
  const handleServir = async () => {
    try {
      await servirCommande(commandeId);
      setShowConfirmService(false);
      toast.success("Commande servie");
      refetch();
    } catch (err) {
      console.error("Erreur service:", err);
      toast.error(apiErrorMessage(err, "Erreur lors du service"));
    }
  };

  // Annuler la commande
  const handleAnnuler = async () => {
    try {
      await annulerCommande(commandeId);
      setShowConfirmAnnulation(false);
      toast.success("Commande annulée");
      refetch();
    } catch (err) {
      console.error("Erreur annulation:", err);
      toast.error(apiErrorMessage(err, "Erreur lors de l’annulation"));
    }
  };

  const handleConfirmerReservation = async () => {
    try {
      await confirmerCommande({ id: commandeId, data: {} });
      setShowConfirmReservation(false);
      toast.success("Réservation confirmée");
      refetch();
      refetchEvents();
    } catch (err) {
      console.error("Erreur confirmation:", err);
      toast.error(apiErrorMessage(err, "Erreur lors de la confirmation"));
    }
  };

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <PageHeader title="Commande" back={{ href: "/distribution/commandes", label: "Commandes" }} />
        <Card>
          <LoadingState rows={6} />
        </Card>
      </div>
    );
  }

  if (status === "error" || !commande) {
    return (
      <div className="space-y-6">
        <PageHeader title="Commande" back={{ href: "/distribution/commandes", label: "Commandes" }} />
        <Card>
          <ErrorState
            title={error?.status === 404 ? "Commande introuvable" : "Chargement impossible"}
            message={error?.status === 404 ? "Cette commande n’existe pas ou a été supprimée." : "Erreur inconnue."}
            onRetry={error?.status === 404 ? undefined : () => refetch()}
          />
        </Card>
      </div>
    );
  }

  const totalPoches = commande.lignes.reduce((sum, l) => sum + l.quantite, 0);
  const etapeFaite = (etape: "BROUILLON" | "VALIDEE" | "SERVIE") =>
    etape === "BROUILLON"
      ? commande.statut !== "BROUILLON"
      : etape === "VALIDEE"
      ? commande.statut === "VALIDEE" || commande.statut === "SERVIE"
      : commande.statut === "SERVIE";

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Commande — {hopital?.nom || "…"}
            <StatusBadge status={commande.statut} />
          </span>
        }
        description={
          <span className="inline-flex items-center gap-2" title={refreshError ?? undefined} role="status" aria-live="polite">
            <span className={`h-2 w-2 rounded-full ${refreshDotClass}`} aria-hidden="true" />
            {refreshLabel}
          </span>
        }
        back={{ href: "/distribution/commandes", label: "Commandes" }}
        actions={
          <>
            {commande.statut === "BROUILLON" && (
              <>
                <Button
                  onClick={() => setShowConfirmValidation(true)}
                  loading={validerStatus === "loading"}
                  icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                >
                  Valider la commande
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowConfirmAnnulation(true)}
                  loading={annulerStatus === "loading"}
                  className="text-brand-700"
                >
                  Annuler la commande
                </Button>
              </>
            )}

            {commande.statut === "VALIDEE" && (
              <>
                <Button
                  onClick={() => setShowConfirmReservation(true)}
                  loading={confirmerStatus === "loading"}
                  icon={<ClipboardCheck className="h-4 w-4" aria-hidden="true" />}
                >
                  Confirmer la réservation
                </Button>
                <Button
                  variant="success"
                  onClick={() => setShowConfirmService(true)}
                  loading={servirStatus === "loading"}
                  icon={<Truck className="h-4 w-4" aria-hidden="true" />}
                >
                  Servir la commande
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowConfirmAnnulation(true)}
                  loading={annulerStatus === "loading"}
                  className="text-brand-700"
                >
                  Annuler la commande
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Informations générales" />
            <CardBody>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Hôpital</dt>
                  <dd className="mt-1 text-sm text-gray-900">{hopital?.nom || "…"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date de demande</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(commande.date_demande).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Livraison prévue</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {commande.date_livraison_prevue
                      ? new Date(commande.date_livraison_prevue).toLocaleDateString("fr-FR")
                      : "Non spécifiée"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Créée le</dt>
                  <dd className="mt-1 text-sm text-gray-900">{new Date(commande.created_at).toLocaleDateString("fr-FR")}</dd>
                </div>
              </dl>

              {hopital && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="mb-2 text-sm font-medium text-gray-500">Contact hôpital</p>
                  <div className="space-y-1 text-sm text-gray-900">
                    {hopital.adresse && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        {hopital.adresse}
                      </p>
                    )}
                    {hopital.contact && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        {hopital.contact}
                      </p>
                    )}
                    {!hopital.adresse && !hopital.contact && <p className="text-gray-500">Aucune information</p>}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Lignes de commande" />
            <ul className="divide-y divide-gray-100">
              {commande.lignes.map((ligne) => (
                <li key={ligne.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {ligne.type_produit}
                      {ligne.groupe_sanguin && ` — ${ligne.groupe_sanguin}`}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-gray-500">Ligne #{ligne.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums text-gray-900">{ligne.quantite}</p>
                    <p className="text-xs text-gray-500">poche(s)</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between rounded-b-xl border-t border-gray-100 bg-gray-50 px-5 py-4">
              <span className="text-sm font-medium text-gray-700">Total de poches</span>
              <span className="text-xl font-semibold tabular-nums text-gray-900">{totalPoches}</span>
            </div>
          </Card>

          {(commande.statut === "VALIDEE" || commande.statut === "SERVIE") && (
            <AffectationPanel
              key={commande.statut}
              commandeId={commandeId}
              lignes={commande.lignes}
              editable={commande.statut === "VALIDEE"}
              onChanged={() => refetchEvents()}
            />
          )}
        </div>

        <aside className="space-y-4">
          {commande.statut === "BROUILLON" && (
            <Card>
              <CardBody>
                <h2 className="mb-1 text-sm font-semibold text-gray-900">Prochaine étape</h2>
                <p className="mb-3 text-sm text-gray-600">
                  Validez la commande pour réserver automatiquement les poches disponibles selon la règle FEFO.
                </p>
                <Button className="w-full" onClick={() => setShowConfirmValidation(true)}>
                  Valider maintenant
                </Button>
              </CardBody>
            </Card>
          )}

          {commande.statut === "VALIDEE" && (
            <Alert tone="info">
              <p className="mb-1 font-medium">Commande validée</p>
              <p className="mb-3 text-xs">
                Les poches ont été réservées (FEFO). Affectez les receveurs et enregistrez les cross-matchs CGR, puis
                servez la commande.
              </p>
              <div className="space-y-2">
                <Button className="w-full" onClick={() => setShowConfirmReservation(true)}>
                  Confirmer la réservation
                </Button>
                <Button variant="success" className="w-full" onClick={() => setShowConfirmService(true)}>
                  Servir maintenant
                </Button>
              </div>
            </Alert>
          )}

          {commande.statut === "SERVIE" && (
            <Alert tone="success">
              <p className="mb-1 flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Commande servie
              </p>
              <p className="text-xs">Les poches ont été distribuées. La commande est terminée.</p>
            </Alert>
          )}

          {commande.statut === "ANNULEE" && (
            <Alert tone="danger">
              <p className="mb-1 flex items-center gap-2 font-medium">
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Commande annulée
              </p>
              <p className="text-xs">Cette commande a été annulée. Les réservations ont été libérées.</p>
            </Alert>
          )}

          <Card>
            <CardHeader title="Suivi en temps réel" />
            <CardBody className="py-4">
              {!commandeEvents || commandeEvents.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun événement récent</p>
              ) : (
                <ul className="space-y-2">
                  {commandeEvents.slice(0, 10).map((evt) => (
                    <li key={evt.id} className="flex items-center justify-between gap-3 text-xs text-gray-700">
                      <span className="font-medium">{statusLabel(evt.event_type)}</span>
                      <span className="whitespace-nowrap text-gray-500">
                        {new Date(evt.created_at).toLocaleString("fr-FR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Circuit de distribution" />
            <CardBody className="py-4">
              <ol className="space-y-2 text-sm">
                {(
                  [
                    ["BROUILLON", "Brouillon", "Commande créée"],
                    ["VALIDEE", "Validée", "Poches réservées"],
                    ["SERVIE", "Servie", "Poches distribuées"],
                  ] as const
                ).map(([key, label, desc], i) => {
                  const fait = etapeFaite(key);
                  return (
                    <li key={key} className="flex items-start gap-2">
                      {fait ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
                      )}
                      <span className={fait ? "text-gray-500" : "text-gray-900"}>
                        {i + 1}. <strong>{label}</strong> : {desc}
                        {fait ? <span className="sr-only"> (étape franchie)</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </CardBody>
          </Card>

          <Alert tone="warning">
            <p className="mb-1 flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Règles de distribution
            </p>
            <ul className="list-inside list-disc space-y-1 text-xs">
              <li>Seules les poches disponibles sont réservables</li>
              <li>Réservation automatique FEFO (péremption)</li>
              <li>Les réservations expirent après un délai (24 h par défaut)</li>
              <li>Le service marque les poches distribuées (irréversible)</li>
            </ul>
          </Alert>
        </aside>
      </div>

      <Modal
        open={showConfirmValidation}
        onClose={closeValidation}
        title="Confirmer la validation"
        footer={
          <>
            <Button variant="secondary" onClick={closeValidation} disabled={validerStatus === "loading"}>
              Annuler
            </Button>
            <Button onClick={handleValider} loading={validerStatus === "loading"}>
              {validerStatus === "loading" ? "Validation…" : "Confirmer"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            La validation va réserver automatiquement les poches disponibles selon la règle FEFO (premier périmé, premier
            sorti).
          </p>
          <Alert tone="info">
            <strong>{totalPoches}</strong> poche(s) seront réservées.
          </Alert>
        </div>
      </Modal>

      <Modal
        open={showConfirmReservation}
        onClose={closeReservation}
        title="Confirmer la réservation"
        footer={
          <>
            <Button variant="secondary" onClick={closeReservation} disabled={confirmerStatus === "loading"}>
              Annuler
            </Button>
            <Button onClick={handleConfirmerReservation} loading={confirmerStatus === "loading"}>
              {confirmerStatus === "loading" ? "Confirmation…" : "Confirmer"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            La confirmation enregistre l’accord de l’hôpital pour les poches réservées et déclenche le suivi.
          </p>
          <Alert tone="info">
            <strong>{totalPoches}</strong> poche(s) confirmées.
          </Alert>
        </div>
      </Modal>

      <Modal
        open={showConfirmService}
        onClose={closeService}
        title="Confirmer le service"
        footer={
          <>
            <Button variant="secondary" onClick={closeService} disabled={servirStatus === "loading"}>
              Annuler
            </Button>
            <Button variant="success" onClick={handleServir} loading={servirStatus === "loading"}>
              {servirStatus === "loading" ? "Service…" : "Confirmer le service"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Le service va marquer les poches comme distribuées. Cette action est <strong>irréversible</strong>.
          </p>
          <Alert tone="danger">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Action irréversible
            </p>
            <p className="mt-1 text-xs">Les poches ne pourront plus être utilisées pour d’autres commandes.</p>
          </Alert>
        </div>
      </Modal>

      <Modal
        open={showConfirmAnnulation}
        onClose={closeAnnulation}
        title="Annuler la commande ?"
        footer={
          <>
            <Button variant="secondary" onClick={closeAnnulation} disabled={annulerStatus === "loading"}>
              Non, garder
            </Button>
            <Button variant="danger" onClick={handleAnnuler} loading={annulerStatus === "loading"}>
              {annulerStatus === "loading" ? "Annulation…" : "Oui, annuler"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          L’annulation va libérer toutes les réservations associées à cette commande.
        </p>
      </Modal>
    </div>
  );
}
