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
import { Calendar, CheckCircle2, CreditCard, Info, Phone, Search, ShieldAlert, X, XCircle } from "lucide-react";
import { toast } from "sonner";

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
  Field,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";

export default function NouveauDonClient({ canOverride }: { canOverride: boolean }) {
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
  const [overrideEligibility, setOverrideEligibility] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

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
      toast.error("Veuillez sélectionner un donneur");
      return;
    }

    if (formData.date_don === new Date().toISOString().slice(0, 10)
        && eligibilite?.eligible === false && !overrideEligibility) {
      toast.error("Le donneur n’est pas éligible. Une dérogation médicale motivée est nécessaire.");
      return;
    }
    if (overrideEligibility && (!canOverride || overrideReason.trim().length < 10)) {
      toast.error("La dérogation exige un motif médical d’au moins 10 caractères.");
      return;
    }

    try {
      const don = await createDon({
        donneur_id: selectedDonneurId,
        date_don: formData.date_don,
        type_don: formData.type_don,
        ignorer_eligibilite: overrideEligibility,
        motif_derogation: overrideEligibility ? overrideReason.trim() : undefined,
      });
      toast.success("Don enregistré");
      router.push(`/dons/${don.id}`);
    } catch (err) {
      console.error("Erreur création don:", err);
      toast.error(apiErrorMessage(err, "Création du don impossible"));
    }
  };

  const resultsOpen = showResults && debouncedQuery.length >= 2;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Nouveau don"
        description="Enregistrer une nouvelle collecte de sang"
        back={{ href: "/dons", label: "Retour à la liste" }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardBody className="space-y-6">
                {createStatus === "error" && createError && (
                  <Alert tone="danger">
                    <p className="font-medium">Erreur lors de la création</p>
                    <p className="mt-1">
                      {createError.status === 404
                        ? "Donneur introuvable"
                        : apiErrorMessage(createError, "Création du don impossible")}
                    </p>
                  </Alert>
                )}

                {/* Recherche donneur */}
                <div ref={searchRef} className="relative space-y-1.5">
                  <div className="relative">
                    <label htmlFor="search-donneur" className="block space-y-1.5">
                      <span className="block text-sm font-medium text-gray-800">
                        Rechercher un donneur
                        <span className="ml-0.5 text-brand-600" aria-hidden="true">*</span>
                      </span>
                      <span className="relative block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                        <input
                          id="search-donneur"
                          type="text"
                          role="combobox"
                          aria-expanded={resultsOpen}
                          aria-controls="search-donneur-results"
                          aria-autocomplete="list"
                          aria-describedby="search-donneur-hint"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                            if (!e.target.value) setSelectedDonneurId("");
                          }}
                          onFocus={() => {
                            if (searchQuery.length >= 2) setShowResults(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setShowResults(false);
                          }}
                          placeholder="N° carte, nom, prénom ou téléphone…"
                          className="block w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 h-11 pl-10 pr-10"
                          autoComplete="off"
                        />
                      </span>
                    </label>
                    {selectedDonneurId && (
                      <button
                        type="button"
                        aria-label="Effacer le donneur sélectionné"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedDonneurId("");
                          setShowResults(false);
                        }}
                        className="absolute bottom-0 right-0 flex h-11 items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  {resultsOpen && (
                    <div
                      id="search-donneur-results"
                      className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
                    >
                      {searchStatus === "loading" && (
                        <p className="p-4 text-center text-sm text-gray-500" role="status">
                          Recherche en cours…
                        </p>
                      )}
                      {searchStatus === "success" && searchResults && searchResults.length === 0 && (
                        <p className="p-4 text-center text-sm text-gray-500" role="status">
                          Aucun donneur trouvé pour « {debouncedQuery} »
                        </p>
                      )}
                      {searchStatus === "success" && searchResults && searchResults.length > 0 && (
                        <ul className="divide-y divide-gray-100">
                          {searchResults.map((d) => (
                            <li key={d.id}>
                              <button
                                type="button"
                                onClick={() => selectDonneur(d)}
                                aria-pressed={selectedDonneurId === d.id}
                                className={`w-full px-4 py-3 text-left transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${
                                  selectedDonneurId === d.id ? "border-l-2 border-blue-500 bg-blue-50" : ""
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <span className="font-semibold text-gray-900">
                                      {d.nom} {d.prenom}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-500">
                                      {d.sexe === "H" ? "Homme" : "Femme"}
                                    </span>
                                  </div>
                                  {d.groupe_sanguin && <Badge tone="danger">{d.groupe_sanguin}</Badge>}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                  {d.numero_carte && (
                                    <span className="flex items-center gap-1">
                                      <CreditCard className="h-3 w-3" aria-hidden="true" />
                                      {d.numero_carte}
                                    </span>
                                  )}
                                  {d.telephone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" aria-hidden="true" />
                                      {d.telephone}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" aria-hidden="true" />
                                    {d.dernier_don
                                      ? `Dernier don : ${new Date(d.dernier_don).toLocaleDateString("fr-FR")}`
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

                  <p id="search-donneur-hint" className="text-xs text-gray-500">
                    Saisissez le numéro de carte, le nom ou le téléphone du donneur
                    {!donneurIdFromUrl && (
                      <>
                        {" "}— ou{" "}
                        <Link href="/donneurs/nouveau" className="text-blue-600 hover:text-blue-800">
                          créer un nouveau donneur
                        </Link>
                      </>
                    )}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date du don" required hint="La date ne peut pas être dans le futur">
                    <Input
                      type="date"
                      id="date_don"
                      value={formData.date_don}
                      onChange={(e) =>
                        setFormData({ ...formData, date_don: e.target.value })
                      }
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </Field>

                  <Field label="Type de don" required>
                    <Select
                      id="type_don"
                      value={formData.type_don}
                      onChange={(e) =>
                        setFormData({ ...formData, type_don: e.target.value })
                      }
                    >
                      <option value="SANG_TOTAL">Sang total (ST)</option>
                      <option value="PLASMAPHERESE">Plasmaphérèse</option>
                      <option value="CYTAPHERESE">Cytaphérèse</option>
                    </Select>
                  </Field>
                </div>
                <p className="-mt-3 text-xs text-gray-500">
                  Une poche ST est créée uniquement pour un don de sang total. Pour l’aphérèse, enregistrer le produit collecté séparément avant la libération.
                </p>

                {canOverride && (
                  <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <label htmlFor="derogation" className="flex items-center gap-2 text-sm font-medium text-amber-900">
                      <input
                        id="derogation"
                        type="checkbox"
                        className="h-4 w-4 rounded border-amber-400"
                        checked={overrideEligibility}
                        onChange={(event) => setOverrideEligibility(event.target.checked)}
                      />
                      <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                      Dérogation médicale d’éligibilité
                    </label>
                    {overrideEligibility && (
                      <Field label="Motif médical documenté" required hint="Au moins 10 caractères">
                        <Textarea
                          id="motif-derogation"
                          value={overrideReason}
                          minLength={10}
                          onChange={(event) => setOverrideReason(event.target.value)}
                        />
                      </Field>
                    )}
                  </div>
                )}
              </CardBody>

              <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 px-5 py-4">
                <ButtonLink href="/dons" variant="secondary">
                  Annuler
                </ButtonLink>
                <Button
                  type="submit"
                  variant="success"
                  loading={createStatus === "loading"}
                  disabled={!selectedDonneurId}
                >
                  {createStatus === "loading" ? "Création…" : "Créer le don"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Colonne latérale : donneur et éligibilité */}
        <div className="space-y-6">
          {selectedDonneurId && donneurStatus === "success" && donneur && (
            <Card>
              <CardHeader title="Donneur sélectionné" />
              <CardBody>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-gray-600">Nom</dt>
                    <dd className="text-gray-900">{donneur.nom} {donneur.prenom}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">Sexe</dt>
                    <dd className="text-gray-900">{donneur.sexe === "H" ? "Homme" : "Femme"}</dd>
                  </div>
                  {donneur.groupe_sanguin && (
                    <div>
                      <dt className="font-medium text-gray-600">Groupe sanguin</dt>
                      <dd className="font-semibold text-brand-700">{donneur.groupe_sanguin}</dd>
                    </div>
                  )}
                  {donneur.numero_carte && (
                    <div>
                      <dt className="font-medium text-gray-600">N° carte</dt>
                      <dd className="font-mono text-gray-900">{donneur.numero_carte}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-medium text-gray-600">Dernier don</dt>
                    <dd className="text-gray-900">
                      {donneur.dernier_don
                        ? new Date(donneur.dernier_don).toLocaleDateString("fr-FR")
                        : "Jamais"}
                    </dd>
                  </div>
                </dl>
                <Link href={`/donneurs/${donneur.id}`} className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800">
                  Voir la fiche complète →
                </Link>
              </CardBody>
            </Card>
          )}

          {selectedDonneurId && eligibiliteStatus === "success" && eligibilite && (
            <Card>
              <CardHeader title="Vérification d’éligibilité" />
              <CardBody className="space-y-4">
                <Alert tone={eligibilite.eligible ? "success" : "danger"}>
                  <p className="flex items-center gap-2 text-base font-semibold">
                    {eligibilite.eligible ? (
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-5 w-5" aria-hidden="true" />
                    )}
                    {eligibilite.eligible ? "Éligible" : "Non éligible"}
                  </p>
                  {eligibilite.raison && <p className="mt-1">{eligibilite.raison}</p>}
                </Alert>

                {eligibilite.eligible_le && !eligibilite.eligible && (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-gray-600">Sera éligible le</p>
                    <p className="text-gray-900">
                      {new Date(eligibilite.eligible_le).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {eligibilite.delai_jours !== null && eligibilite.delai_jours !== undefined && (
                      <p className="text-gray-600">Dans {eligibilite.delai_jours} jour(s)</p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {selectedDonneurId && eligibiliteStatus === "loading" && (
            <Card>
              <LoadingState rows={3} label="Vérification de l’éligibilité…" />
            </Card>
          )}

          {!selectedDonneurId && (
            <Alert tone="info">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">Étapes de création</p>
                  <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs">
                    <li>Rechercher un donneur (carte, nom, téléphone)</li>
                    <li>Vérifier son éligibilité</li>
                    <li>Renseigner la date et le type de don</li>
                    <li>Créer le don (génère le DIN et la poche ST)</li>
                    <li>Passer aux analyses biologiques</li>
                  </ol>
                </div>
              </div>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
