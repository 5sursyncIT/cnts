"use client";

import { useDon, useDons, useAnalyses, useCreateAnalyse } from "@cnts/api";
import type { AnalyseCreate } from "@cnts/api";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
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
  Field,
  Input,
  PageHeader,
  Select,
  StatusBadge,
} from "@/components/ui";

const TESTS_REQUIS = [
  { type: "ABO", label: "Groupe ABO", options: ["A", "B", "AB", "O", "EN_ATTENTE"] },
  { type: "RH", label: "Rhésus", options: ["POS", "NEG", "EN_ATTENTE"] },
  { type: "VIH", label: "VIH", options: ["NEGATIF", "POSITIF", "EN_ATTENTE"] },
  { type: "VHB", label: "Hépatite B", options: ["NEGATIF", "POSITIF", "EN_ATTENTE"] },
  { type: "VHC", label: "Hépatite C", options: ["NEGATIF", "POSITIF", "EN_ATTENTE"] },
  { type: "SYPHILIS", label: "Syphilis", options: ["NEGATIF", "POSITIF", "EN_ATTENTE"] },
] as const;

export default function AnalysesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const donIdFromUrl = searchParams.get("don_id");

  const [selectedDonId, setSelectedDonId] = useState<string>(donIdFromUrl || "");
  const [searchDin, setSearchDin] = useState("");
  const [formData, setFormData] = useState<Record<string, { resultat: string; note: string }>>({
    ABO: { resultat: "", note: "" },
    RH: { resultat: "", note: "" },
    VIH: { resultat: "", note: "" },
    VHB: { resultat: "", note: "" },
    VHC: { resultat: "", note: "" },
    SYPHILIS: { resultat: "", note: "" },
  });
  const [submitting, setSubmitting] = useState(false);

  const { mutate: createAnalyse } = useCreateAnalyse(apiClient);
  const [correction, setCorrection] = useState<{ id: string; resultat: string; note: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const runAnalyseAction = async (action: () => Promise<unknown>) => {
    setActionBusy(true);
    setActionError(null);
    try {
      await action();
      setCorrection(null);
      await refetchAnalyses();
    } catch (err) {
      setActionError(apiErrorMessage(err, "L’opération a échoué."));
    } finally {
      setActionBusy(false);
    }
  };

  // Charger les dons EN_ATTENTE
  const { data: donsEnAttente } = useDons(apiClient, {
    statut: "EN_ATTENTE",
    limit: 100,
  });

  // Charger le don sélectionné
  const { data: don, refetch: refetchDon } = useDon(
    apiClient,
    selectedDonId || ""
  );

  // Charger les analyses existantes
  const { data: analysesData, refetch: refetchAnalyses } = useAnalyses(
    apiClient,
    { don_id: selectedDonId || undefined }
  );
  // Sans don sélectionné, l'API renverrait toutes les analyses : on n'affiche rien.
  const analysesExistantes = selectedDonId ? analysesData : null;

  // Réinitialiser le formulaire quand on change de don
  useEffect(() => {
    setFormData({
      ABO: { resultat: "", note: "" },
      RH: { resultat: "", note: "" },
      VIH: { resultat: "", note: "" },
      VHB: { resultat: "", note: "" },
      VHC: { resultat: "", note: "" },
      SYPHILIS: { resultat: "", note: "" },
    });
  }, [selectedDonId]);

  // Pré-remplir le groupe sanguin si disponible chez le donneur
  useEffect(() => {
    if (don?.donneur?.groupe_sanguin) {
      const groupe = don.donneur.groupe_sanguin;
      let abo = "";
      let rh = "";

      if (groupe.endsWith("+")) {
        rh = "POS";
        abo = groupe.slice(0, -1);
      } else if (groupe.endsWith("-")) {
        rh = "NEG";
        abo = groupe.slice(0, -1);
      } else {
        abo = groupe;
      }

      setFormData((prev) => {
        // Ne pas écraser si déjà saisi
        if (prev.ABO.resultat && prev.RH.resultat) return prev;

        return {
          ...prev,
          ABO: { ...prev.ABO, resultat: prev.ABO.resultat || abo },
          RH: { ...prev.RH, resultat: prev.RH.resultat || rh },
        };
      });
    }
  }, [don]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDonId) {
      toast.error("Veuillez sélectionner un don");
      return;
    }

    setSubmitting(true);

    try {
      const promises = TESTS_REQUIS.map(async (test) => {
        const data = formData[test.type];
        if (!data.resultat) return null;

        // Vérifier si l'analyse existe déjà
        const existante = analysesExistantes?.find(
          (a) => a.type_test === test.type
        );
        if (existante) return null;

        const payload: AnalyseCreate = {
          don_id: selectedDonId,
          type_test: test.type,
          resultat: data.resultat,
          note: data.note || undefined,
        };

        return createAnalyse(payload);
      });

      await Promise.all(promises);

      toast.success("Analyses enregistrées");
      setFormData({
        ABO: { resultat: "", note: "" },
        RH: { resultat: "", note: "" },
        VIH: { resultat: "", note: "" },
        VHB: { resultat: "", note: "" },
        VHC: { resultat: "", note: "" },
        SYPHILIS: { resultat: "", note: "" },
      });
      refetchAnalyses();
      refetchDon();

      // Rediriger vers libération si toutes les analyses sont complètes
      setTimeout(() => {
        router.push(`/laboratoire/liberation?don_id=${selectedDonId}`);
      }, 1500);
    } catch (err) {
      console.error("Erreur création analyses:", err);
      toast.error(apiErrorMessage(err, "Erreur lors de l’enregistrement des analyses"));
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (type: string, key: "resultat" | "note", value: string) =>
    setFormData({
      ...formData,
      [type]: { ...formData[type], [key]: value },
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analyses biologiques"
        description="Enregistrement des résultats de tests pour validation biologique"
        back={{ href: "/laboratoire", label: "Laboratoire" }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulaire principal */}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchByDin();
                      }
                    }}
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

          {/* Formulaire de saisie */}
          {selectedDonId && don ? (
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader title="Résultats des analyses" description="Les tests déjà saisis peuvent être validés ou corrigés." />
                <CardBody className="space-y-4">
                  {actionError ? <Alert tone="danger">{actionError}</Alert> : null}

                  <div className="divide-y divide-gray-100">
                    {TESTS_REQUIS.map((test) => {
                      const existante = analysesExistantes?.find((a) => a.type_test === test.type);

                      return (
                        <div key={test.type} className="py-4 first:pt-0 last:pb-0">
                          {existante ? (
                            <>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm font-medium text-gray-900">{test.label}</span>
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  <Badge tone={existante.resultat === "POSITIF" ? "danger" : existante.resultat === "EN_ATTENTE" ? "warning" : "success"}>
                                    Résultat : {existante.resultat}
                                  </Badge>
                                  {existante.validateur_id ? (
                                    <Badge tone="info" dot>Validé</Badge>
                                  ) : (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      disabled={actionBusy || existante.resultat === "EN_ATTENTE"}
                                      onClick={() => runAnalyseAction(() => apiClient.analyses.valider(existante.id))}
                                    >
                                      Valider
                                    </Button>
                                  )}
                                  {don?.statut_qualification !== "LIBERE" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={actionBusy}
                                      onClick={() => setCorrection({ id: existante.id, resultat: existante.resultat, note: existante.note ?? "" })}
                                    >
                                      Corriger
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {correction?.id === existante.id && (
                                <div className="mt-3 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                  <Field label="Nouveau résultat" hint="Une revalidation sera requise.">
                                    <Select
                                      value={correction.resultat}
                                      onChange={(e) => setCorrection({ ...correction, resultat: e.target.value })}
                                    >
                                      {test.options.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </Select>
                                  </Field>
                                  <Field label="Motif de la correction" required>
                                    <Input
                                      type="text"
                                      value={correction.note}
                                      onChange={(e) => setCorrection({ ...correction, note: e.target.value })}
                                    />
                                  </Field>
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => setCorrection(null)}>
                                      Annuler
                                    </Button>
                                    <Button
                                      size="sm"
                                      loading={actionBusy}
                                      disabled={!correction.note.trim()}
                                      onClick={() =>
                                        runAnalyseAction(() =>
                                          apiClient.analyses.update(correction.id, { resultat: correction.resultat, note: correction.note.trim() })
                                        )
                                      }
                                    >
                                      Enregistrer la correction
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Field label={test.label}>
                                <Select
                                  value={formData[test.type].resultat}
                                  onChange={(e) => setField(test.type, "resultat", e.target.value)}
                                >
                                  <option value="">— Sélectionner —</option>
                                  {test.options.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </Select>
                              </Field>
                              <Field label="Note (facultative)">
                                <Input
                                  type="text"
                                  value={formData[test.type].note}
                                  onChange={(e) => setField(test.type, "note", e.target.value)}
                                />
                              </Field>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
                <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4">
                  <ButtonLink href="/laboratoire" variant="secondary">
                    Annuler
                  </ButtonLink>
                  <Button type="submit" loading={submitting} disabled={!selectedDonId}>
                    Enregistrer les analyses
                  </Button>
                </div>
              </form>
            </Card>
          ) : !selectedDonId ? (
            <Card>
              <EmptyState
                title="Aucun don sélectionné"
                description="Recherchez un don par son DIN ou choisissez-le dans la liste pour saisir ses résultats."
              />
            </Card>
          ) : null}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {don && (
            <Card>
              <CardHeader title="Don sélectionné" />
              <CardBody>
                <dl className="space-y-3 text-sm">
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
                    <dt className="text-gray-500">Statut</dt>
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

          {analysesExistantes && analysesExistantes.length > 0 && (
            <Card>
              <CardHeader title="Analyses déjà effectuées" />
              <CardBody>
                <ul className="space-y-2 text-sm">
                  {analysesExistantes.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2">
                      <span className="text-gray-700">{a.type_test}</span>
                      <span className="font-medium text-gray-900">{a.resultat}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          <Alert tone="info">
            <p className="font-medium">Tests obligatoires</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li>Groupage : ABO + Rhésus</li>
              <li>Sérologie : VIH, VHB, VHC, Syphilis</li>
              <li>Tous doivent être négatifs pour la libération</li>
            </ul>
          </Alert>
        </div>
      </div>
    </div>
  );
}
