"use client";

import {
  useCommande,
  useHopital,
  useValiderCommande,
  useAnnulerCommande,
  useServirCommande,
} from "@cnts/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function CommandeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const commandeId = params.id as string;

  const [showConfirmValidation, setShowConfirmValidation] = useState(false);
  const [showConfirmService, setShowConfirmService] = useState(false);
  const [showConfirmAnnulation, setShowConfirmAnnulation] = useState(false);

  const { data: commande, status, error, refetch } = useCommande(
    apiClient,
    commandeId
  );
  const { data: hopital } = useHopital(
    apiClient,
    commande?.hopital_id || null
  );

  const { mutate: validerCommande, status: validerStatus } =
    useValiderCommande(apiClient);
  const { mutate: servirCommande, status: servirStatus } =
    useServirCommande(apiClient);
  const { mutate: annulerCommande, status: annulerStatus } =
    useAnnulerCommande(apiClient);

  // Valider la commande
  const handleValider = async () => {
    try {
      await validerCommande({ id: commandeId });
      setShowConfirmValidation(false);
      refetch();
    } catch (err) {
      console.error("Erreur validation:", err);
      alert("Erreur lors de la validation");
    }
  };

  // Servir la commande
  const handleServir = async () => {
    try {
      await servirCommande(commandeId);
      setShowConfirmService(false);
      refetch();
    } catch (err) {
      console.error("Erreur service:", err);
      alert("Erreur lors du service");
    }
  };

  // Annuler la commande
  const handleAnnuler = async () => {
    try {
      await annulerCommande(commandeId);
      setShowConfirmAnnulation(false);
      refetch();
    } catch (err) {
      console.error("Erreur annulation:", err);
      alert("Erreur lors de l'annulation");
    }
  };

  if (status === "loading") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (status === "error" || !commande) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-600 mb-2">Erreur de chargement</div>
          <div className="text-sm text-gray-600">
            {error?.status === 404
              ? "Commande introuvable"
              : "Erreur inconnue"}
          </div>
          <Link
            href="/distribution/commandes"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            ← Retour aux commandes
          </Link>
        </div>
      </div>
    );
  }

  const totalPoches = commande.lignes.reduce((sum, l) => sum + l.quantite, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/distribution/commandes"
          className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
        >
          ← Retour aux commandes
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">
              Commande - {hopital?.nom || "Chargement..."}
            </h1>
            <div className="flex gap-3 mt-2">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  commande.statut === "BROUILLON"
                    ? "bg-gray-100 text-gray-800"
                    : commande.statut === "VALIDEE"
                    ? "bg-blue-100 text-blue-800"
                    : commande.statut === "SERVIE"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {commande.statut}
              </span>
            </div>
          </div>

          {/* Actions selon statut */}
          <div className="flex gap-3">
            {commande.statut === "BROUILLON" && (
              <>
                <button
                  onClick={() => setShowConfirmValidation(true)}
                  disabled={validerStatus === "loading"}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {validerStatus === "loading"
                    ? "Validation..."
                    : "Valider la commande"}
                </button>
                <button
                  onClick={() => setShowConfirmAnnulation(true)}
                  disabled={annulerStatus === "loading"}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition disabled:opacity-50"
                >
                  Annuler
                </button>
              </>
            )}

            {commande.statut === "VALIDEE" && (
              <>
                <button
                  onClick={() => setShowConfirmService(true)}
                  disabled={servirStatus === "loading"}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
                >
                  {servirStatus === "loading"
                    ? "Service..."
                    : "Servir la commande"}
                </button>
                <button
                  onClick={() => setShowConfirmAnnulation(true)}
                  disabled={annulerStatus === "loading"}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition disabled:opacity-50"
                >
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Informations générales
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Hôpital</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {hopital?.nom || "Chargement..."}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Date de demande
                </dt>
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
                <dt className="text-sm font-medium text-gray-500">
                  Livraison prévue
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {commande.date_livraison_prevue
                    ? new Date(
                        commande.date_livraison_prevue
                      ).toLocaleDateString("fr-FR")
                    : "Non spécifiée"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Créée le
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(commande.created_at).toLocaleDateString("fr-FR")}
                </dd>
              </div>
            </dl>

            {hopital && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Contact hôpital
                </div>
                <div className="text-sm text-gray-900">
                  {hopital.adresse && (
                    <div className="mb-1">📍 {hopital.adresse}</div>
                  )}
                  {hopital.contact && <div>📞 {hopital.contact}</div>}
                  {!hopital.adresse && !hopital.contact && (
                    <div className="text-gray-500">Aucune information</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lignes de commande */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Lignes de commande</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {commande.lignes.map((ligne) => (
                <div key={ligne.id} className="p-6 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">
                      {ligne.type_produit}
                      {ligne.groupe_sanguin && ` - ${ligne.groupe_sanguin}`}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Ligne #{ligne.id.slice(0, 8)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {ligne.quantite}
                    </div>
                    <div className="text-xs text-gray-500">poche(s)</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Total de poches
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {totalPoches}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Workflow */}
        <div className="space-y-6">
          {commande.statut === "BROUILLON" && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2 text-sm">
                Prochaine étape
              </h3>
              <p className="text-xs text-gray-700 mb-3">
                Valider la commande pour réserver automatiquement les poches
                disponibles selon FEFO.
              </p>
              <button
                onClick={() => setShowConfirmValidation(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
              >
                Valider maintenant
              </button>
            </div>
          )}

          {commande.statut === "VALIDEE" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2 text-sm">
                Commande validée
              </h3>
              <p className="text-xs text-blue-800 mb-3">
                Les poches ont été réservées. Vous pouvez maintenant affecter
                les receveurs et servir la commande.
              </p>
              <button
                onClick={() => setShowConfirmService(true)}
                className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition"
              >
                Servir maintenant
              </button>
            </div>
          )}

          {commande.statut === "SERVIE" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2 text-sm">
                ✓ Commande servie
              </h3>
              <p className="text-xs text-green-800">
                Les poches ont été distribuées et marquées DISTRIBUE. La
                commande est terminée.
              </p>
            </div>
          )}

          {commande.statut === "ANNULEE" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-900 mb-2 text-sm">
                ✗ Commande annulée
              </h3>
              <p className="text-xs text-red-800">
                Cette commande a été annulée. Les réservations ont été libérées.
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2 text-sm">
              Workflow de distribution
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li
                className={
                  commande.statut !== "BROUILLON" ? "line-through" : ""
                }
              >
                1. <strong>BROUILLON</strong>: Commande créée
              </li>
              <li
                className={
                  commande.statut === "VALIDEE" || commande.statut === "SERVIE"
                    ? "line-through"
                    : ""
                }
              >
                2. <strong>VALIDEE</strong>: Poches réservées
              </li>
              <li className={commande.statut === "SERVIE" ? "line-through" : ""}>
                3. <strong>SERVIE</strong>: Poches distribuées
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2 text-sm">
              ⚠️ Règles de distribution
            </h3>
            <ul className="text-xs text-yellow-800 space-y-1">
              <li>• Seules les poches DISPONIBLE sont réservables</li>
              <li>• Réservation automatique FEFO (péremption)</li>
              <li>• Réservations expireront après délai (default: 24h)</li>
              <li>• Service marque poches DISTRIBUE (irréversible)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de confirmation validation */}
      {showConfirmValidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Confirmer la validation
            </h3>
            <div className="mb-6 space-y-3">
              <p className="text-sm text-gray-700">
                La validation va automatiquement réserver les poches disponibles
                selon FEFO (First Expired, First Out).
              </p>
              <div className="p-3 bg-blue-50 rounded-md">
                <div className="text-sm font-medium text-blue-900">
                  {totalPoches} poche(s) seront réservées
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmValidation(false)}
                disabled={validerStatus === "loading"}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleValider}
                disabled={validerStatus === "loading"}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {validerStatus === "loading" ? "Validation..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation service */}
      {showConfirmService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmer le service</h3>
            <div className="mb-6 space-y-3">
              <p className="text-sm text-gray-700">
                Le service va marquer les poches comme DISTRIBUE. Cette action
                est <strong>irréversible</strong>.
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="text-sm font-medium text-red-900">
                  ⚠️ Action irréversible
                </div>
                <div className="text-xs text-red-700 mt-1">
                  Les poches ne pourront plus être utilisées pour d'autres
                  commandes
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmService(false)}
                disabled={servirStatus === "loading"}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleServir}
                disabled={servirStatus === "loading"}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
              >
                {servirStatus === "loading" ? "Service..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation annulation */}
      {showConfirmAnnulation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Confirmer l'annulation
            </h3>
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                L'annulation va libérer toutes les réservations associées à cette
                commande.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmAnnulation(false)}
                disabled={annulerStatus === "loading"}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
              >
                Non, garder
              </button>
              <button
                onClick={handleAnnuler}
                disabled={annulerStatus === "loading"}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
              >
                {annulerStatus === "loading" ? "Annulation..." : "Oui, annuler"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
