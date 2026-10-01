"use client";

import { usePochesStock, type MotifDestruction, type Poche } from "@cnts/api";
import { AlertTriangle, CheckCircle2, Clock, Info, Package, RefreshCw, Settings2, Split } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  StatCard,
  StatusBadge,
  Table,
  TBody,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
  type BadgeTone,
} from "@/components/ui";

const TYPE_TONES: Record<string, BadgeTone> = {
  ST: "danger",
  CGR: "warning",
  PFC: "info",
  CP: "purple",
};

const MOTIFS_DESTRUCTION: Record<MotifDestruction, string> = {
  PEREMPTION: "Péremption",
  SEROLOGIE_POSITIVE: "Sérologie positive / non qualifiée",
  NON_CONFORMITE: "Non-conformité (volume, aspect, étiquetage)",
  RUPTURE_CHAINE_FROID: "Rupture de la chaîne du froid",
  RAPPEL: "Rappel de lot",
  CASSE_FUITE: "Casse / fuite",
  AUTRE: "Autre",
};

export default function StockPage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statutFilter, setStatutFilter] = useState<string>("EN_STOCK");
  const [sortByExpiration, setSortByExpiration] = useState(true);
  const [aDetruire, setADetruire] = useState<Poche | null>(null);
  const [motif, setMotif] = useState<MotifDestruction>("PEREMPTION");
  const [commentaire, setCommentaire] = useState("");
  const [destructionError, setDestructionError] = useState<string | null>(null);
  const [destructionBusy, setDestructionBusy] = useState(false);

  const ouvrirDestruction = (poche: Poche) => {
    const perimee = new Date(poche.date_peremption).getTime() < Date.now();
    setADetruire(poche);
    setMotif(perimee ? "PEREMPTION" : poche.statut_stock === "RAPPELEE" ? "RAPPEL" : "NON_CONFORMITE");
    setCommentaire("");
    setDestructionError(null);
  };

  const confirmerDestruction = async () => {
    if (!aDetruire) return;
    setDestructionBusy(true);
    setDestructionError(null);
    try {
      await apiClient.poches.detruire(aDetruire.id, { motif, commentaire: commentaire.trim() || undefined });
      setADetruire(null);
      toast.success("Poche mise au rebut");
      refetch();
    } catch (e) {
      setDestructionError(apiErrorMessage(e, "La mise au rebut a échoué."));
    } finally {
      setDestructionBusy(false);
    }
  };

  // Charger les poches en stock
  const { data: poches, status, error, refetch } = usePochesStock(apiClient, {
    type_produit: typeFilter || undefined,
    statut_stock: statutFilter || undefined,
    limit: 500,
  });

  // Trier par date de péremption si activé
  const sortedPoches = poches
    ? [...poches].sort((a, b) => {
      if (!sortByExpiration) return 0;
      return (
        new Date(a.date_peremption).getTime() -
        new Date(b.date_peremption).getTime()
      );
    })
    : [];

  // Calculer les statistiques
  const stats = sortedPoches.reduce(
    (acc, poche) => {
      acc.total++;
      if (poche.type_produit === "ST") acc.st++;
      if (poche.type_produit === "CGR") acc.cgr++;
      if (poche.type_produit === "PFC") acc.pfc++;
      if (poche.type_produit === "CP") acc.cp++;
      if (poche.statut_distribution === "DISPONIBLE") acc.disponible++;

      // Alertes péremption (7 jours)
      const daysUntilExpiry = Math.ceil(
        (new Date(poche.date_peremption).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
        acc.expiringSoon++;
      }
      if (daysUntilExpiry < 0) {
        acc.expired++;
      }

      return acc;
    },
    {
      total: 0,
      st: 0,
      cgr: 0,
      pfc: 0,
      cp: 0,
      disponible: 0,
      expiringSoon: 0,
      expired: 0,
    }
  );

  // Calculer les jours jusqu'à péremption
  const getDaysUntilExpiry = (datePeremption: string) => {
    return Math.ceil(
      (new Date(datePeremption).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock"
        description="Inventaire des poches de sang et fractionnement"
        actions={
          <>
            <ButtonLink href="/stock/regles" variant="secondary" icon={<Settings2 className="h-4 w-4" aria-hidden="true" />}>
              Règles produits
            </ButtonLink>
            <ButtonLink href="/stock/fractionnement" icon={<Split className="h-4 w-4" aria-hidden="true" />}>
              Fractionner
            </ButtonLink>
          </>
        }
      />

      {/* Statistiques */}
      {status === "success" && poches && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total" value={stats.total} icon={<Package className="h-5 w-5" aria-hidden="true" />} />
          <StatCard label="Disponibles" value={stats.disponible} tone="success" icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} />
          <StatCard
            label="Expirent sous 7 j"
            value={stats.expiringSoon}
            tone={stats.expiringSoon > 0 ? "warning" : "neutral"}
            icon={<Clock className="h-5 w-5" aria-hidden="true" />}
          />
          <StatCard
            label="Expirées"
            value={stats.expired}
            tone={stats.expired > 0 ? "danger" : "neutral"}
            icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          />
          <StatCard label="Sang total (ST)" value={stats.st} />
          <StatCard label="CGR" value={stats.cgr} />
          <StatCard label="PFC" value={stats.pfc} />
          <StatCard label="CP" value={stats.cp} />
        </div>
      )}

      <Card>
        {/* Filtres */}
        <div className="grid gap-3 border-b border-gray-100 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <Field label="Type de produit">
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Tous les types</option>
              <option value="ST">Sang total (ST)</option>
              <option value="CGR">Concentré de globules rouges (CGR)</option>
              <option value="PFC">Plasma frais congelé (PFC)</option>
              <option value="CP">Concentré plaquettaire (CP)</option>
            </Select>
          </Field>

          <Field label="Statut stock">
            <Select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
              <option value="">Tous</option>
              <option value="EN_STOCK">En stock</option>
              <option value="FRACTIONNEE">Fractionnée</option>
              <option value="RAPPELEE">Rappelée</option>
              <option value="DETRUITE">Détruite (rebut)</option>
            </Select>
          </Field>

          <label htmlFor="sort-fefo" className="flex h-10 items-center gap-2 text-sm text-gray-800">
            <input
              id="sort-fefo"
              type="checkbox"
              checked={sortByExpiration}
              onChange={(e) => setSortByExpiration(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Tri FEFO (péremption)
          </label>

          <div className="flex lg:justify-end">
            <Button variant="secondary" onClick={() => refetch()} icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}>
              Actualiser
            </Button>
          </div>
        </div>

        {/* Liste des poches */}
        {status === "loading" && <LoadingState rows={6} />}

        {status === "error" && (
          <ErrorState message={apiErrorMessage(error, "Le stock n’a pas pu être chargé.")} onRetry={() => refetch()} />
        )}

        {status === "success" && sortedPoches.length === 0 && (
          <EmptyState
            title="Aucune poche"
            description="Aucune poche ne correspond aux filtres sélectionnés."
          />
        )}

        {status === "success" && sortedPoches.length > 0 && (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Type</Th>
                  <Th>Groupe</Th>
                  <Th>Volume</Th>
                  <Th>Péremption</Th>
                  <Th>Emplacement</Th>
                  <Th>Statut stock</Th>
                  <Th>Distribution</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </THead>
              <TBody>
                {sortedPoches.map((poche) => {
                  const daysUntilExpiry = getDaysUntilExpiry(poche.date_peremption);
                  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
                  const isExpired = daysUntilExpiry < 0;

                  return (
                    <Tr key={poche.id} className={isExpired ? "bg-red-50/60" : isExpiringSoon ? "bg-amber-50/60" : ""}>
                      <Td className="whitespace-nowrap">
                        <Badge tone={TYPE_TONES[poche.type_produit] ?? "neutral"}>{poche.type_produit}</Badge>
                      </Td>
                      <Td className="whitespace-nowrap font-medium text-gray-900">{poche.groupe_sanguin || "—"}</Td>
                      <Td className="whitespace-nowrap">{poche.volume_ml ? `${poche.volume_ml} mL` : "—"}</Td>
                      <Td className="whitespace-nowrap">
                        <div
                          className={
                            isExpired
                              ? "font-semibold text-red-700"
                              : isExpiringSoon
                                ? "font-semibold text-amber-700"
                                : "text-gray-900"
                          }
                        >
                          {new Date(poche.date_peremption).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {isExpired ? `Expirée depuis ${Math.abs(daysUntilExpiry)} j` : `${daysUntilExpiry} j restant(s)`}
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap">{poche.emplacement_stock}</Td>
                      <Td className="whitespace-nowrap">
                        <StatusBadge status={poche.statut_stock} />
                      </Td>
                      <Td className="whitespace-nowrap">
                        <StatusBadge status={poche.statut_distribution} />
                      </Td>
                      <Td align="right" className="whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {poche.type_produit === "ST" && poche.statut_stock === "EN_STOCK" && (
                            <ButtonLink href={`/stock/fractionnement?poche_id=${poche.id}`} variant="ghost" size="sm">
                              Fractionner
                            </ButtonLink>
                          )}
                          <ButtonLink href={`/dons/${poche.don_id}`} variant="ghost" size="sm">
                            Voir le don
                          </ButtonLink>
                          {(poche.statut_stock === "EN_STOCK" || poche.statut_stock === "RAPPELEE") &&
                            poche.statut_distribution !== "RESERVE" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-700 hover:bg-red-50"
                                onClick={() => ouvrirDestruction(poche)}
                              >
                                Mettre au rebut
                              </Button>
                            )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
              <span>{sortedPoches.length} poche(s) affichée(s)</span>
              {sortByExpiration && (
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  Tri FEFO activé (premier périmé, premier sorti)
                </span>
              )}
            </div>
          </>
        )}
      </Card>

      <Modal
        open={aDetruire !== null}
        onClose={() => setADetruire(null)}
        title="Mettre la poche au rebut"
        description={
          aDetruire
            ? `${aDetruire.type_produit} ${aDetruire.groupe_sanguin ?? ""} — péremption ${new Date(aDetruire.date_peremption).toLocaleDateString("fr-FR")}. Action tracée et irréversible.`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setADetruire(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={confirmerDestruction} loading={destructionBusy}>
              Confirmer la mise au rebut
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {destructionError ? <Alert tone="danger">{destructionError}</Alert> : null}
          <Field label="Motif" required>
            <Select value={motif} onChange={(e) => setMotif(e.target.value as MotifDestruction)}>
              {(Object.keys(MOTIFS_DESTRUCTION) as MotifDestruction[]).map((m) => (
                <option key={m} value={m}>{MOTIFS_DESTRUCTION[m]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Commentaire">
            <Textarea rows={2} maxLength={1000} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
