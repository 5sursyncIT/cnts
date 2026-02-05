"use client";

import { useDonneur, useCheckEligibilite, useDons, useUpdateDonneur, useDeleteDonneur, useRegions } from "@cnts/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function DonneurDetailPage() {
  const params = useParams();
  const router = useRouter();
  const donneurId = params.id as string;
  const [isEditing, setIsEditing] = useState(false);

  const { data: regions } = useRegions(apiClient);

  const {
    data: donneur,
    status: donneurStatus,
    error: donneurError,
    refetch: refetchDonneur,
  } = useDonneur(apiClient, donneurId);

  const { mutate: updateDonneur, status: updateStatus } = useUpdateDonneur(apiClient);
  const { mutate: deleteDonneur, status: deleteStatus } = useDeleteDonneur(apiClient);

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce donneur ? Cette action est irréversible.")) {
      return;
    }

    try {
      await deleteDonneur(donneurId);
      router.push("/donneurs");
    } catch (err) {
      console.error("Erreur lors de la suppression", err);
      alert("Erreur lors de la suppression. Vérifiez que le donneur n'a pas de dons associés.");
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
          telephone: (formData.get("telephone") as string) || null,
          email: (formData.get("email") as string) || null,
        }
      });
      setIsEditing(false);
      refetchDonneur();
    } catch (err) {
      console.error("Erreur lors de la mise à jour", err);
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
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (donneurStatus === "error" || !donneur) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-600 mb-2">Erreur de chargement</div>
          <div className="text-sm text-gray-800">
            {donneurError?.status === 404
              ? "Donneur introuvable"
              : "Erreur inconnue"}
          </div>
          <Link
            href="/donneurs"
            className="mt-4 inline-block text-blue-600 hover:text-blue-900"
          >
            ← Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/donneurs"
          className="text-blue-600 hover:text-blue-900 text-sm mb-2 inline-block"
        >
          ← Retour à la liste
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {donneur.nom}, {donneur.prenom}
            </h1>
            <div className="flex gap-3 mt-2">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${donneur.sexe === "H"
                  ? "bg-blue-100 text-blue-900"
                  : "bg-pink-100 text-pink-800"
                  }`}
              >
                {donneur.sexe === "H" ? "Homme" : "Femme"}
              </span>
              {eligibilite && (
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${eligibilite.eligible
                    ? "bg-green-100 text-green-900"
                    : "bg-red-100 text-red-900"
                    }`}
                >
                  {eligibilite.eligible ? "✓ Éligible" : "✗ Non éligible"}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/dons/nouveau?donneur_id=${donneurId}`}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            + Créer un don
          </Link>
        </div>
      </div>

      {isEditing && donneur ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Modifier le donneur</h2>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input name="nom" defaultValue={donneur.nom} required className="w-full px-3 py-2 border rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input name="prenom" defaultValue={donneur.prenom} required className="w-full px-3 py-2 border rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                  <select name="sexe" defaultValue={donneur.sexe} className="w-full px-3 py-2 border rounded-md text-gray-900">
                    <option value="H">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                  <input type="date" name="date_naissance" defaultValue={donneur.date_naissance ? new Date(donneur.date_naissance).toISOString().split('T')[0] : ""} className="w-full px-3 py-2 border rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Groupe Sanguin</label>
                  <select name="groupe_sanguin" defaultValue={donneur.groupe_sanguin || ""} className="w-full px-3 py-2 border rounded-md text-gray-900">
                    <option value="">Non renseigné</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNI (nouveau)</label>
                  <input name="cni" placeholder="Laisser vide pour conserver" className="w-full px-3 py-2 border rounded-md text-gray-900" />
                  <p className="text-xs text-gray-500 mt-1">Le CNI n&apos;est pas stocké pour des raisons de confidentialité</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input name="telephone" defaultValue={donneur.telephone || ""} className="w-full px-3 py-2 border rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="email" defaultValue={donneur.email || ""} className="w-full px-3 py-2 border rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
                  <select name="region" defaultValue={donneur.region || ""} className="w-full px-3 py-2 border rounded-md text-gray-900">
                    <option value="">Choisir une région</option>
                    {regions?.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input name="adresse" defaultValue={donneur.adresse || ""} className="w-full px-3 py-2 border rounded-md text-gray-900" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateStatus === "loading"}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  {updateStatus === "loading" ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte d'identité */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Informations</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  Modifier
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteStatus === "loading"}
                  className="text-sm text-red-600 hover:text-red-900 disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {donneur.id}
                  </code>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  CNI (Hash)
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs" title={donneur.cni_hash}>
                    {donneur.cni_hash.substring(0, 16)}...
                  </code>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Numéro CNI
                </dt>
                <dd className="mt-1 text-sm text-gray-500 italic">
                  Protégé (RGPD)
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Date de naissance
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {donneur.date_naissance
                    ? new Date(donneur.date_naissance).toLocaleDateString("fr-FR")
                    : <span className="text-gray-400 italic">Non renseigné</span>}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Groupe Sanguin
                </dt>
                <dd className="mt-1 text-sm font-bold text-red-900">
                  {donneur.groupe_sanguin || <span className="text-gray-400 italic font-normal">Non renseigné</span>}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Téléphone
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {donneur.telephone || <span className="text-gray-400 italic">Non renseigné</span>}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {donneur.email ? (
                    <a href={`mailto:${donneur.email}`} className="text-blue-600 hover:underline">
                      {donneur.email}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Non renseigné</span>
                  )}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm font-medium text-gray-500">
                  Adresse
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {donneur.adresse || <span className="text-gray-400 italic">Non renseigné</span>}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Dernier don
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {donneur.dernier_don
                    ? new Date(donneur.dernier_don).toLocaleDateString("fr-FR")
                    : "Jamais"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Créé le
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(donneur.created_at).toLocaleDateString("fr-FR")}
                </dd>
              </div>
            </dl>
          </div>

          {/* Historique des dons */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Historique des dons</h2>
              <button
                onClick={() => refetchDons()}
                className="text-sm text-blue-600 hover:text-blue-900"
              >
                Actualiser
              </button>
            </div>

            {donsStatus === "loading" && (
              <div className="p-6 text-center text-gray-700">
                Chargement...
              </div>
            )}

            {donsStatus === "success" && dons && dons.length === 0 && (
              <div className="p-6 text-center text-gray-700">
                Aucun don enregistré pour ce donneur
              </div>
            )}

            {donsStatus === "success" && dons && dons.length > 0 && (
              <div className="divide-y divide-gray-200">
                {dons.map((don) => (
                  <Link
                    key={don.id}
                    href={`/dons/${don.id}`}
                    className="block p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">
                          DIN: {don.din}
                        </div>
                        <div className="text-sm text-gray-800 mt-1">
                          {new Date(don.date_don).toLocaleDateString("fr-FR")} -{" "}
                          {don.type_don}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${don.statut_qualification === "LIBERE"
                          ? "bg-green-100 text-green-900"
                          : "bg-yellow-100 text-yellow-900"
                          }`}
                      >
                        {don.statut_qualification}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Éligibilité */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Éligibilité</h2>

            {eligibiliteStatus === "loading" && (
              <div className="text-sm text-gray-700">Calcul...</div>
            )}

            {eligibiliteStatus === "success" && eligibilite && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${eligibilite.eligible
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                    }`}
                >
                  <div
                    className={`text-lg font-semibold mb-2 ${eligibilite.eligible
                      ? "text-green-900"
                      : "text-red-900"
                      }`}
                  >
                    {eligibilite.eligible
                      ? "✓ Peut donner"
                      : "✗ Ne peut pas donner"}
                  </div>
                  {eligibilite.raison && (
                    <div
                      className={`text-sm ${eligibilite.eligible
                        ? "text-green-700"
                        : "text-red-700"
                        }`}
                    >
                      {eligibilite.raison}
                    </div>
                  )}
                </div>

                {eligibilite.eligible_le && (
                  <div className="text-sm">
                    <div className="font-medium text-gray-700">
                      Éligible à partir du:
                    </div>
                    <div className="text-gray-900 mt-1">
                      {new Date(eligibilite.eligible_le).toLocaleDateString(
                        "fr-FR",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </div>
                  </div>
                )}

                {eligibilite.delai_jours !== null && (
                  <div className="text-sm">
                    <div className="font-medium text-gray-700">
                      Délai restant:
                    </div>
                    <div className="text-gray-900 mt-1">
                      {eligibilite.delai_jours} jours
                    </div>
                  </div>
                )}

                <button
                  onClick={() => refetchEligibilite()}
                  className="w-full mt-4 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                >
                  Recalculer
                </button>
              </div>
            )}
          </div>

          {/* Règles d'éligibilité */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2 text-sm">
              Règles d'éligibilité
            </h3>
            <ul className="text-xs text-blue-900 space-y-1">
              <li>• Hommes: 2 mois entre dons (60 jours)</li>
              <li>• Femmes: 4 mois entre dons (120 jours)</li>
              <li>• Le calcul est fait depuis le dernier don enregistré</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
