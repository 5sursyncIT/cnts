"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LigneCommande, Receveur, ReservationCommande } from "@cnts/api";

import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  LoadingState,
  Select,
  StatusBadge,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

type Props = {
  commandeId: string;
  lignes: LigneCommande[];
  /** Affectation et cross-match possibles uniquement sur une commande VALIDEE. */
  editable: boolean;
  onChanged?: () => void;
};

function receveurLabel(r: Receveur) {
  const nom = [r.prenom, r.nom].filter(Boolean).join(" ") || "Receveur sans nom";
  return `${nom}${r.groupe_sanguin ? ` (${r.groupe_sanguin})` : ""}`;
}

/**
 * Étapes préalables au service d'une commande validée :
 * 1. affecter un receveur à chaque ligne (poches réservées FEFO) ;
 * 2. enregistrer un cross-match compatible pour chaque CGR.
 * Le backend refuse de servir tant que ces deux conditions ne sont pas remplies.
 */
export function AffectationPanel({ commandeId, lignes, editable, onChanged }: Props) {
  const [reservations, setReservations] = useState<ReservationCommande[]>([]);
  const [receveurs, setReceveurs] = useState<Receveur[]>([]);
  const [choix, setChoix] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, rec] = await Promise.all([
        apiClient.commandes.reservations(commandeId),
        apiClient.receveurs.list({ limit: 500 }),
      ]);
      setReservations(res);
      setReceveurs(rec);
    } catch (e) {
      setError(apiErrorMessage(e, "Impossible de charger les réservations."));
    } finally {
      setLoading(false);
    }
  }, [commandeId]);

  useEffect(() => {
    load();
  }, [load]);

  const receveursById = useMemo(() => new Map(receveurs.map((r) => [r.id, r])), [receveurs]);
  const parLigne = useMemo(() => {
    const m = new Map<string, ReservationCommande[]>();
    for (const r of reservations) {
      const key = r.ligne_commande_id ?? "";
      m.set(key, [...(m.get(key) ?? []), r]);
    }
    return m;
  }, [reservations]);

  async function run(action: () => Promise<unknown>, key?: string, successMessage?: string) {
    setBusy(true);
    setPending(key ?? null);
    setError(null);
    try {
      await action();
      if (successMessage) toast.success(successMessage);
      await load();
      onChanged?.();
    } catch (e) {
      const msg = apiErrorMessage(e, "L’opération a échoué.");
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  const aAffecter = lignes.filter((l) => (parLigne.get(l.id) ?? []).some((r) => !r.receveur_id));
  const crossmatchManquants = reservations.filter((r) => r.receveur_id && r.crossmatch_requis && r.crossmatch !== "COMPATIBLE");
  const pret = reservations.length > 0 && aAffecter.length === 0 && crossmatchManquants.length === 0;

  return (
    <Card>
      <CardHeader
        title="Poches réservées et receveurs"
        description="Affectation des receveurs et cross-match avant le service"
        actions={
          reservations.length > 0 ? (
            <Badge tone={pret ? "success" : "warning"} dot>
              {pret ? "Prête à servir" : "Préparation incomplète"}
            </Badge>
          ) : undefined
        }
      />

      {error ? (
        <div className="px-5 pt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}

      {loading ? (
        <LoadingState rows={4} />
      ) : reservations.length === 0 ? (
        <EmptyState
          title={editable ? "Aucune poche réservée" : "Aucune réservation active"}
          description={editable ? "Les réservations ont peut-être expiré : revalidez la commande." : undefined}
        />
      ) : (
        <div className="divide-y divide-gray-100">
          {lignes.map((ligne) => {
            const rows = parLigne.get(ligne.id) ?? [];
            if (rows.length === 0) return null;
            const nonAffectees = rows.filter((r) => !r.receveur_id);
            return (
              <section key={ligne.id} className="space-y-3 py-4" aria-label={`Ligne ${ligne.type_produit}`}>
                <div className="flex flex-wrap items-end justify-between gap-3 px-5">
                  <p className="font-medium text-gray-900">
                    {ligne.type_produit}
                    {ligne.groupe_sanguin ? ` ${ligne.groupe_sanguin}` : ""} — {rows.length} poche(s)
                  </p>
                  {editable && nonAffectees.length > 0 && (
                    <div className="flex flex-wrap items-end gap-2">
                      <Field label="Receveur" className="min-w-[14rem]">
                        <Select
                          value={choix[ligne.id] ?? ""}
                          onChange={(e) => setChoix({ ...choix, [ligne.id]: e.target.value })}
                        >
                          <option value="">Choisir un receveur</option>
                          {receveurs.map((r) => (
                            <option key={r.id} value={r.id}>
                              {receveurLabel(r)}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Button
                        disabled={busy || !choix[ligne.id]}
                        loading={busy && pending === `aff-${ligne.id}`}
                        onClick={() =>
                          run(
                            () =>
                              apiClient.commandes.affecter(commandeId, {
                                affectations: [{ ligne_commande_id: ligne.id, receveur_id: choix[ligne.id], quantite: ligne.quantite }],
                              }),
                            `aff-${ligne.id}`,
                            "Receveur affecté"
                          )
                        }
                      >
                        Affecter
                      </Button>
                    </div>
                  )}
                </div>

                <Table>
                  <THead>
                    <tr>
                      <Th>DIN</Th>
                      <Th>Groupe</Th>
                      <Th>Péremption</Th>
                      <Th>Receveur</Th>
                      <Th>Cross-match</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {rows.map((r) => {
                      const rec = r.receveur_id ? receveursById.get(r.receveur_id) : undefined;
                      return (
                        <Tr key={r.reservation_id}>
                          <Td className="whitespace-nowrap font-mono text-gray-900">{r.din}</Td>
                          <Td>{r.groupe_sanguin ?? "—"}</Td>
                          <Td className="whitespace-nowrap">{new Date(r.date_peremption).toLocaleDateString("fr-FR")}</Td>
                          <Td>
                            {rec ? (
                              receveurLabel(rec)
                            ) : r.receveur_id ? (
                              "Receveur affecté"
                            ) : (
                              <Badge tone="warning">À affecter</Badge>
                            )}
                          </Td>
                          <Td>
                            {!r.crossmatch_requis ? (
                              <span className="text-gray-500">Non requis</span>
                            ) : !r.receveur_id ? (
                              <span className="text-gray-500">Après affectation</span>
                            ) : r.crossmatch === "COMPATIBLE" ? (
                              <StatusBadge status="COMPATIBLE" />
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                {r.crossmatch === "INCOMPATIBLE" && <StatusBadge status="INCOMPATIBLE" />}
                                {editable && (
                                  <>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      disabled={busy}
                                      className="text-emerald-800"
                                      onClick={() =>
                                        run(
                                          () => apiClient.crossMatch.create({ poche_id: r.poche_id, receveur_id: r.receveur_id!, resultat: "COMPATIBLE" }),
                                          `cm-${r.reservation_id}`,
                                          "Cross-match compatible enregistré"
                                        )
                                      }
                                      aria-label={`Cross-match compatible pour la poche ${r.din}`}
                                    >
                                      Compatible
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      disabled={busy}
                                      className="text-brand-700"
                                      onClick={() =>
                                        run(
                                          () => apiClient.crossMatch.create({ poche_id: r.poche_id, receveur_id: r.receveur_id!, resultat: "INCOMPATIBLE" }),
                                          `cm-${r.reservation_id}`,
                                          "Cross-match incompatible enregistré"
                                        )
                                      }
                                      aria-label={`Cross-match incompatible pour la poche ${r.din}`}
                                    >
                                      Incompatible
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </Td>
                        </Tr>
                      );
                    })}
                  </TBody>
                </Table>
              </section>
            );
          })}
        </div>
      )}

      {editable && reservations.length > 0 && !pret && (
        <p className="border-t border-gray-100 px-5 py-4 text-xs text-gray-600">
          Pour servir : affectez un receveur à chaque ligne
          {crossmatchManquants.length > 0 ? ` et enregistrez ${crossmatchManquants.length} cross-match compatible(s)` : ""}.
          Un cross-match incompatible impose d’annuler la commande et d’en créer une nouvelle.
        </p>
      )}
    </Card>
  );
}
