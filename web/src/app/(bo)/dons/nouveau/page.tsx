"use client";

import {
  useSearchDonneurs,
  useDonneur,
  useCheckEligibilite,
  useCreateDon,
} from "@cnts/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

export default function NouveauDonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const donneurIdFromUrl = searchParams.get("donneur_id");

  const { mutate: createDon, status: createStatus, error: createError } = useCreateDon(apiClient);

  const [selectedDonneurId, setSelectedDonneurId] = useState<string>(
    donneurIdFromUrl || ""
  );
  const [formData, setFormData] = useState({
    date_don: new Date().toISOString().split("T")[0],
    type_don: "SANG_TOTAL",
  });

  // Recherche donneur
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce la recherche (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fermer les résultats au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recherche via le hook
  const { data: searchResults, status: searchStatus } = useSearchDonneurs(apiClient, debouncedQuery);

  // Charger le donneur sélectionné
  const {
    data: donneur,
    status: donneurStatus,
    refetch: refetchDonneur,
  } = useDonneur(apiClient, selectedDonneurId);

  // Vérifier l'éligibilité
  const {
    data: eligibilite,
    status: eligibiliteStatus,
    refetch: refetchEligibilite,
  } = useCheckEligibilite(apiClient, selectedDonneurId);

  // Recharger l'éligibilité quand le donneur change
  useEffect(() => {
    if (selectedDonneurId) {
      refetchDonneur();
      refetchEligibilite();
    }
  }, [selectedDonneurId, refetchDonneur, refetchEligibilite]);

  const selectDonneur = useCallback((d: { id: string; nom: string; prenom: string; numero_carte: string | null }) => {
    setSelectedDonneurId(d.id);
    setSearchQuery(d.numero_carte ? `${d.numero_carte} — ${d.nom} ${d.prenom}` : `${d.nom} ${d.prenom}`);
    setShowResults(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDonneurId) {
      alert("Veuillez sélectionner un donneur");
      return;
    }

    if (!eligibilite?.eligible) {
      const confirmProceed = window.confirm(
        "Le donneur n'est pas éligible. Voulez-vous quand même créer ce don ?"
      );
      if (!confirmProceed) return;
    }

    try {
      const don = await createDon({
        donneur_id: selectedDonneurId,
        date_don: formData.date_don,
        type_don: formData.type_don,
      });
      router.push(`/dons/${don.id}`);
    } catch (err) {
      console.error("Erreur création don:", err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dons"
          className="text-blue-600 hover:text-blue-900 text-sm mb-2 inline-block"
        >
          &larr; Retour à la liste
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau Don</h1>
        <p className="text-gray-700 mt-1">
          Enregistrer une nouvelle collecte de sang
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
            {/* Erreur globale */}
            {createStatus === "error" && createError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="text-sm font-medium text-red-900">
                  Erreur lors de la création
                </div>
                <div className="text-sm text-red-600 mt-1">
                  {createError.status === 404
                    ? "Donneur introuvable"
                    : `Erreur ${createError.status}: ${JSON.stringify(
                      createError.body
                    )}`}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Recherche donneur */}
              <div ref={searchRef} className="relative">
                <label
                  htmlFor="search-donneur"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Rechercher un donneur <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    id="search-donneur"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(true);
                      if (!e.target.value) setSelectedDonneurId("");
                    }}
                    onFocus={() => {
                      if (searchQuery.length >= 2) setShowResults(true);
                    }}
                    placeholder="N° carte, nom, prénom ou téléphone..."
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                    autoComplete="off"
                  />
                  {selectedDonneurId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedDonneurId("");
                        setShowResults(false);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Résultats de recherche */}
                {showResults && debouncedQuery.length >= 2 && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                    {searchStatus === "loading" && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Recherche en cours...
                      </div>
                    )}
                    {searchStatus === "success" && searchResults && searchResults.length === 0 && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Aucun donneur trouvé pour &laquo; {debouncedQuery} &raquo;
                      </div>
                    )}
                    {searchStatus === "success" && searchResults && searchResults.length > 0 && (
                      <ul className="divide-y divide-gray-100">
                        {searchResults.map((d) => (
                          <li key={d.id}>
                            <button
                              type="button"
                              onClick={() => selectDonneur(d)}
                              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                                selectedDonneurId === d.id ? "bg-blue-50 border-l-2 border-blue-500" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-semibold text-gray-900">
                                    {d.nom} {d.prenom}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    {d.sexe === "H" ? "Homme" : "Femme"}
                                  </span>
                                </div>
                                {d.groupe_sanguin && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                    {d.groupe_sanguin}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                {d.numero_carte && (
                                  <span className="flex items-center gap-1">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    {d.numero_carte}
                                  </span>
                                )}
                                {d.telephone && (
                                  <span className="flex items-center gap-1">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {d.telephone}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {d.dernier_don
                                    ? `Dernier don: ${new Date(d.dernier_don).toLocaleDateString("fr-FR")}`
                                    : "Jamais donné"}
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="mt-2 text-sm text-gray-500">
                  Saisissez le numéro de carte, le nom ou le téléphone du donneur
                </div>
                {!donneurIdFromUrl && (
                  <div className="mt-1 text-sm text-gray-800">
                    Ou{" "}
                    <Link href="/donneurs/nouveau" className="text-blue-600 hover:text-blue-900">
                      créer un nouveau donneur
                    </Link>
                  </div>
                )}
              </div>

              {/* Date du don */}
              <div>
                <label
                  htmlFor="date_don"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date du don <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  id="date_don"
                  value={formData.date_don}
                  onChange={(e) =>
                    setFormData({ ...formData, date_don: e.target.value })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  La date ne peut pas être dans le futur
                </p>
              </div>

              {/* Type de don */}
              <div>
                <label
                  htmlFor="type_don"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type de don <span className="text-red-600">*</span>
                </label>
                <select
                  id="type_don"
                  value={formData.type_don}
                  onChange={(e) =>
                    setFormData({ ...formData, type_don: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                >
                  <option value="SANG_TOTAL">Sang Total (ST)</option>
                  <option value="PLASMAPHERESE">Plasmaphérèse</option>
                  <option value="CYTAPHERESE">Cytaphérèse</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Une poche ST sera créée automatiquement après enregistrement
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <Link
                href="/dons"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={
                  createStatus === "loading" || !selectedDonneurId
                }
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createStatus === "loading" ? "Création..." : "Créer le don"}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar - Éligibilité */}
        <div className="space-y-6">
          {selectedDonneurId && donneurStatus === "success" && donneur && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Donneur sélectionné</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">Nom</div>
                  <div className="text-gray-900">
                    {donneur.nom} {donneur.prenom}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Sexe</div>
                  <div className="text-gray-900">
                    {donneur.sexe === "H" ? "Homme" : "Femme"}
                  </div>
                </div>
                {donneur.groupe_sanguin && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Groupe sanguin</div>
                    <div className="text-gray-900 font-semibold">{donneur.groupe_sanguin}</div>
                  </div>
                )}
                {donneur.numero_carte && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">N° Carte</div>
                    <div className="text-gray-900 font-mono text-sm">{donneur.numero_carte}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Dernier don
                  </div>
                  <div className="text-gray-900">
                    {donneur.dernier_don
                      ? new Date(donneur.dernier_don).toLocaleDateString(
                        "fr-FR"
                      )
                      : "Jamais"}
                  </div>
                </div>
                <Link
                  href={`/donneurs/${donneur.id}`}
                  className="block text-sm text-blue-600 hover:text-blue-900"
                >
                  Voir la fiche complète &rarr;
                </Link>
              </div>
            </div>
          )}

          {selectedDonneurId && eligibiliteStatus === "success" && eligibilite && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Vérification d&apos;éligibilité</h2>
              <div
                className={`p-4 rounded-lg mb-4 ${eligibilite.eligible
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
                  }`}
              >
                <div
                  className={`text-lg font-semibold mb-2 ${eligibilite.eligible ? "text-green-900" : "text-red-900"
                    }`}
                >
                  {eligibilite.eligible ? "\u2713 Éligible" : "\u2717 Non éligible"}
                </div>
                {eligibilite.raison && (
                  <div
                    className={`text-sm ${eligibilite.eligible ? "text-green-700" : "text-red-700"
                      }`}
                  >
                    {eligibilite.raison}
                  </div>
                )}
              </div>

              {eligibilite.eligible_le && !eligibilite.eligible && (
                <div className="text-sm space-y-2">
                  <div className="font-medium text-gray-700">
                    Sera éligible le:
                  </div>
                  <div className="text-gray-900">
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
                  {eligibilite.delai_jours !== null && eligibilite.delai_jours !== undefined && (
                    <div className="text-gray-800">
                      Dans {eligibilite.delai_jours} jour(s)
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedDonneurId && eligibiliteStatus === "loading" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-700">
                Vérification de l&apos;éligibilité...
              </div>
            </div>
          )}

          {!selectedDonneurId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2 text-sm">
                Workflow de création
              </h3>
              <ul className="text-xs text-blue-900 space-y-1">
                <li>1. Rechercher un donneur (carte, nom, téléphone)</li>
                <li>2. Vérifier son éligibilité</li>
                <li>3. Renseigner date et type de don</li>
                <li>4. Créer le don (génère DIN + poche ST)</li>
                <li>5. Passer aux analyses biologiques</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
