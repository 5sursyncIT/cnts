"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApiClient } from "./client";
import type * as T from "./types";

// ============================================================================
// CUSTOM HOOKS HELPERS (Simple React Query alternative)
// ============================================================================

function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: { onSuccess?: (data: TData) => void; onError?: (error: any) => void }
) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<any>(null);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setStatus("loading");
      try {
        const result = await mutationFn(variables);
        setData(result);
        setStatus("success");
        options?.onSuccess?.(result);
        return result;
      } catch (e) {
        setError(e);
        setStatus("error");
        options?.onError?.(e);
        throw e;
      }
    },
    [mutationFn, options]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setData(null);
    setError(null);
  }, []);

  return { mutate, reset, status, data, error, isIdle: status === "idle", isLoading: status === "loading", isSuccess: status === "success", isError: status === "error" };
}

function useQuery<TData>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: { enabled?: boolean }
) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    setStatus("loading");
    try {
      const result = await queryFn();
      setData(result);
      setStatus("success");
    } catch (e) {
      setError(e);
      setStatus("error");
    }
  }, [queryFn]);

  useEffect(() => {
    if (options?.enabled !== false) {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey.join(","), options?.enabled]);

  return { data, status, error, refetch: fetch, isLoading: status === "loading", isSuccess: status === "success", isError: status === "error" };
}

// ============================================================================
// CMS HOOKS
// ============================================================================

export function useArticles(api: ApiClient, params?: Parameters<ApiClient["articles"]["list"]>[0]) {
  return useQuery(["articles", JSON.stringify(params)], () => api.articles.list(params));
}

export function useArticle(api: ApiClient, slug: string) {
  return useQuery(["article", slug], () => api.articles.get(slug), { enabled: !!slug });
}

export function useCreateArticle(api: ApiClient) {
  return useMutation((data: T.ArticleCreate) => api.articles.create(data));
}

export function useUpdateArticle(api: ApiClient) {
  return useMutation((payload: { id: T.UUID; data: T.ArticleUpdate }) =>
    api.articles.update(payload.id, payload.data)
  );
}

export function useDeleteArticle(api: ApiClient) {
  return useMutation((id: T.UUID) => api.articles.delete(id));
}

// ============================================================================
// UPLOAD HOOK
// ============================================================================

export function useUpload(api: ApiClient) {
  return useMutation((file: File) => api.upload(file));
}

// ============================================================================
// DONNEURS HOOKS
// ============================================================================

export function useDonneurs(api: ApiClient, params?: any) {
  return useQuery(["donneurs", JSON.stringify(params)], () => api.donneurs.list(params));
}

export function useDonneur(api: ApiClient, id: T.UUID) {
  return useQuery(["donneur", id], () => api.donneurs.get(id), { enabled: !!id });
}

export function useCreateDonneur(api: ApiClient) {
  return useMutation((data: T.DonneurCreate) => api.donneurs.create(data));
}

export function useUpdateDonneur(api: ApiClient) {
  return useMutation((payload: { id: T.UUID; data: T.DonneurUpdate }) =>
    api.donneurs.update(payload.id, payload.data)
  );
}

// ... existing code ...



export function useDeleteDonneur(api: ApiClient) {
  return useMutation((id: T.UUID) => api.donneurs.delete(id));
}

export function useSearchDonneurs(api: ApiClient, search: string) {
  return useQuery(
    ["donneurs-search", search],
    () => api.donneurs.list({ q: search, limit: 20 }),
    { enabled: search.length >= 2 },
  );
}

// ============================================================================
// FIDELISATION - CARTES DONNEUR HOOKS
// ============================================================================

export function useCreateCarteDonneur(api: ApiClient) {
  return useMutation((data: T.CarteDonneurCreate) => api.fidelisation.createCarte(data));
}

export function useCheckEligibilite(api: ApiClient, id: T.UUID) {
  return useQuery(["eligibilite", id], () => api.donneurs.checkEligibilite(id), { enabled: !!id });
}

// ============================================================================
// DONS HOOKS
// ============================================================================

export function useDons(api: ApiClient, params?: Parameters<ApiClient["dons"]["list"]>[0]) {
  return useQuery(["dons", JSON.stringify(params)], () => api.dons.list(params));
}

export function useDon(api: ApiClient, id: T.UUID) {
  return useQuery(["don", id], () => api.dons.get(id), { enabled: !!id });
}

export function useCreateDon(api: ApiClient) {
  return useMutation((data: T.DonCreate) => api.dons.create(data));
}

// ============================================================================
// POCHES HOOKS
// ============================================================================

export function usePoches(api: ApiClient, params?: Parameters<ApiClient["poches"]["list"]>[0]) {
  return useQuery(["poches", JSON.stringify(params)], () => api.poches.list(params));
}

export function usePoche(api: ApiClient, id: T.UUID) {
  return useQuery(["poche", id], () => api.poches.get(id), { enabled: !!id });
}

export function useStockSummary(api: ApiClient) {
  return useQuery(["stock-summary"], () => api.poches.getStockSummary());
}

export function useAlertesPeremption(api: ApiClient, jours: number = 7) {
  return useQuery(["alertes-peremption", String(jours)], () => api.poches.getAlertesPeremption(jours));
}

export function useDeletePoche(api: ApiClient) {
  return useMutation((id: T.UUID) => api.poches.delete(id));
}

// ============================================================================
// STOCK HOOKS
// ============================================================================

export function usePochesStock(api: ApiClient, params?: Parameters<ApiClient["stock"]["listPochesStock"]>[0]) {
  return useQuery(["poches-stock", JSON.stringify(params)], () => api.stock.listPochesStock(params));
}

export function useProductRules(api: ApiClient) {
  return useQuery(["product-rules"], () => api.stock.listProductRules());
}

export function useProductRule(api: ApiClient, typeProduit: string) {
  return useQuery(["product-rule", typeProduit], () => api.stock.getProductRule(typeProduit), { enabled: !!typeProduit });
}

export function useRecettes(api: ApiClient, params?: Parameters<ApiClient["stock"]["listRecettes"]>[0]) {
  return useQuery(["recettes", JSON.stringify(params)], () => api.stock.listRecettes(params));
}

export function useRecette(api: ApiClient, code: string) {
  return useQuery(["recette", code], () => api.stock.getRecette(code), { enabled: !!code });
}

export function useFractionner(api: ApiClient) {
  return useMutation((data: T.FractionnementCreate) => api.stock.fractionner(data));
}

export function useFractionnerAvecRecette(api: ApiClient) {
  return useMutation((payload: { code: string; data: T.FractionnementRecettePayload }) =>
    api.stock.fractionnerAvecRecette(payload.code, payload.data)
  );
}

export function useUpsertProductRule(api: ApiClient) {
  return useMutation((payload: { typeProduit: string; data: T.ProductRuleCreate }) =>
    api.stock.upsertProductRule(payload.typeProduit, payload.data)
  );
}

export function useCreateRecette(api: ApiClient) {
  return useMutation((data: T.RecetteFractionnementCreate) => api.stock.createRecette(data));
}

export function useUpdateRecette(api: ApiClient) {
  return useMutation((payload: { code: string; data: T.RecetteFractionnementCreate }) =>
    api.stock.updateRecette(payload.code, payload.data)
  );
}

export function useDeleteRecette(api: ApiClient) {
  return useMutation((code: string) => api.stock.deleteRecette(code));
}

// ============================================================================
// PARAMETRAGE - PEREMPTION
// ============================================================================

export function useExpirationRules(
  api: ApiClient,
  params?: Parameters<ApiClient["parametrage"]["listExpirationRules"]>[0]
) {
  return useQuery(["expiration-rules", JSON.stringify(params)], () =>
    api.parametrage.listExpirationRules(params)
  );
}

export function useCreateExpirationRule(api: ApiClient) {
  return useMutation((data: T.ExpirationRuleCreate) => api.parametrage.createExpirationRule(data));
}

export function useUpdateExpirationRule(api: ApiClient) {
  return useMutation((payload: { id: T.UUID; data: T.ExpirationRuleUpdate }) =>
    api.parametrage.updateExpirationRule(payload.id, payload.data)
  );
}

export function useDeleteExpirationRule(api: ApiClient) {
  return useMutation((id: T.UUID) => api.parametrage.deleteExpirationRule(id));
}

export function useRegions(api: ApiClient) {
  return useQuery(["regions"], () => api.parametrage.listRegions());
}

// ============================================================================
// DISTRIBUTION - HOPITAUX HOOKS
// ============================================================================

export function useHopitaux(api: ApiClient, params?: Parameters<ApiClient["hopitaux"]["list"]>[0]) {
  return useQuery(["hopitaux", JSON.stringify(params)], () => api.hopitaux.list(params));
}

export function useHopital(api: ApiClient, id: T.UUID) {
  return useQuery(["hopital", id], () => api.hopitaux.get(id), { enabled: !!id });
}

export function useCreateHopital(api: ApiClient) {
  return useMutation((data: T.HopitalCreate) => api.hopitaux.create(data));
}

export function useUpdateHopital(api: ApiClient) {
  return useMutation((payload: { id: T.UUID; data: T.HopitalUpdate }) =>
    api.hopitaux.update(payload.id, payload.data)
  );
}

// ============================================================================
// DISTRIBUTION - COMMANDES HOOKS
// ============================================================================

export function useCommandes(api: ApiClient, params?: Parameters<ApiClient["commandes"]["list"]>[0]) {
  return useQuery(["commandes", JSON.stringify(params)], () => api.commandes.list(params));
}

export function useCommande(api: ApiClient, id: T.UUID) {
  return useQuery(["commande", id], () => api.commandes.get(id), { enabled: !!id });
}

export function useCommandeEvents(
  api: ApiClient,
  id: T.UUID,
  params?: Parameters<ApiClient["commandes"]["events"]>[1]
) {
  return useQuery(["commande-events", id, JSON.stringify(params)], () => api.commandes.events(id, params), {
    enabled: !!id,
  });
}

export function useCreateCommande(api: ApiClient) {
  return useMutation((data: T.CommandeCreate) => api.commandes.create(data));
}

export function useValiderCommande(api: ApiClient) {
  return useMutation((payload: { id: T.UUID; data?: T.CommandeValiderPayload }) =>
    api.commandes.valider(payload.id, payload.data)
  );
}

export function useAffecterCommande(api: ApiClient) {
  return useMutation((payload: { id: T.UUID; data: T.CommandeAffecterPayload }) =>
    api.commandes.affecter(payload.id, payload.data)
  );
}

export function useConfirmerCommande(api: ApiClient) {
  return useMutation((payload: { id: T.UUID; data: T.CommandeConfirmationPayload }) =>
    api.commandes.confirmer(payload.id, payload.data)
  );
}

export function useServirCommande(api: ApiClient) {
  return useMutation((id: T.UUID) => api.commandes.servir(id));
}

export function useAnnulerCommande(api: ApiClient) {
  return useMutation((id: T.UUID) => api.commandes.annuler(id));
}

export function useSweepReservations(api: ApiClient) {
  return useMutation(() => api.commandes.sweepReservations());
}

// ============================================================================
// DISTRIBUTION - RECEVEURS HOOKS
// ============================================================================

export function useReceveurs(api: ApiClient, params?: Parameters<ApiClient["receveurs"]["list"]>[0]) {
  return useQuery(["receveurs", JSON.stringify(params)], () => api.receveurs.list(params));
}

export function useReceveur(api: ApiClient, id: T.UUID) {
  return useQuery(["receveur", id], () => api.receveurs.get(id), { enabled: !!id });
}

export function useCreateReceveur(api: ApiClient) {
  return useMutation((data: T.ReceveurCreate) => api.receveurs.create(data));
}

export function useUpdateReceveur(api: ApiClient) {
  return useMutation((payload: { id: T.UUID; data: T.ReceveurUpdate }) =>
    api.receveurs.update(payload.id, payload.data)
  );
}

export function useDeleteReceveur(api: ApiClient) {
  return useMutation((id: T.UUID) => api.receveurs.delete(id));
}

// ============================================================================
// CROSS-MATCH HOOKS
// ============================================================================

export function useCreateCrossMatch(api: ApiClient) {
  return useMutation((data: T.CrossMatchCreate) => api.crossMatch.create(data));
}

// ============================================================================
// ANALYSES HOOKS
// ============================================================================

export function useAnalyses(api: ApiClient, params?: Parameters<ApiClient["analyses"]["list"]>[0]) {
  return useQuery(["analyses", JSON.stringify(params)], () => api.analyses.list(params));
}

export function useAnalyse(api: ApiClient, id: T.UUID) {
  return useQuery(["analyse", id], () => api.analyses.get(id), { enabled: !!id });
}

export function useCreateAnalyse(api: ApiClient) {
  return useMutation((data: T.AnalyseCreate) => api.analyses.create(data));
}

// ============================================================================
// LIBERATION HOOKS
// ============================================================================

export function useCheckLiberation(api: ApiClient, donId: T.UUID) {
  return useQuery(["liberation-check", donId], () => api.liberation.check(donId), { enabled: !!donId });
}

export function useLibererDon(api: ApiClient) {
  return useMutation((donId: T.UUID) => api.liberation.liberer(donId));
}

// ============================================================================
// HEMOVIGILANCE HOOKS
// ============================================================================

export function useActesTransfusionnels(api: ApiClient, params?: Parameters<ApiClient["hemovigilance"]["listActesTransfusionnels"]>[0]) {
  return useQuery(["actes-transfusionnels", JSON.stringify(params)], () => api.hemovigilance.listActesTransfusionnels(params));
}

export function useActeTransfusionnel(api: ApiClient, id: T.UUID) {
  return useQuery(["acte-transfusionnel", id], () => api.hemovigilance.getActeTransfusionnel(id), { enabled: !!id });
}

export function useRappels(api: ApiClient, params?: Parameters<ApiClient["hemovigilance"]["listRappels"]>[0]) {
  return useQuery(["rappels", JSON.stringify(params)], () => api.hemovigilance.listRappels(params));
}

export function useRappel(api: ApiClient, id: T.UUID) {
  return useQuery(["rappel", id], () => api.hemovigilance.getRappel(id), { enabled: !!id });
}

export function useCreateRappel(api: ApiClient) {
  return useMutation((data: Parameters<ApiClient["hemovigilance"]["createRappel"]>[0]) =>
    api.hemovigilance.createRappel(data)
  );
}

export function useCreateRappelAuto(api: ApiClient) {
  return useMutation((data: Parameters<ApiClient["hemovigilance"]["createRappelAuto"]>[0]) =>
    api.hemovigilance.createRappelAuto(data)
  );
}

export function useNotifierRappel(api: ApiClient) {
  return useMutation((payload: { id: T.UUID; data: T.RappelActionCreate }) =>
    api.hemovigilance.notifierRappel(payload.id, payload.data)
  );
}

export function useRappelActions(api: ApiClient, id: T.UUID, params?: { limit?: number }) {
  return useQuery(["rappel-actions", id, JSON.stringify(params)], () => api.hemovigilance.listRappelActions(id, params), {
    enabled: !!id,
  });
}

export function useRappelImpacts(api: ApiClient, id: T.UUID, params?: { limit?: number }) {
  return useQuery(["rappel-impacts", id, JSON.stringify(params)], () => api.hemovigilance.getRappelImpacts(id, params), {
    enabled: !!id,
  });
}

export function useRapportAutorites(api: ApiClient) {
  return useQuery(["hemovigilance-rapport-autorites"], () => api.hemovigilance.rapportAutorites());
}

export function useFluxPartenaires(api: ApiClient, params?: { cursor?: string; hopital_id?: T.UUID; limit?: number }) {
  return useQuery(["hemovigilance-flux-partenaires", JSON.stringify(params)], () =>
    api.hemovigilance.fluxPartenaires(params)
  );
}


// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

export function useAnalyticsDashboard(api: ApiClient, params?: Parameters<ApiClient["analytics"]["getDashboard"]>[0]) {
  return useQuery(["analytics-dashboard", JSON.stringify(params)], () => api.analytics.getDashboard(params));
}

// ============================================================================
// USER MANAGEMENT HOOKS
// ============================================================================

export function useUsers(api: ApiClient, params?: Parameters<ApiClient["users"]["list"]>[0]) {
  return useQuery(["users", JSON.stringify(params)], () => api.users.list(params));
}

export function useUser(api: ApiClient, id: T.UUID | null) {
  return useQuery(["user", id ?? ""], () => api.users.get(id!), { enabled: !!id });
}

export function useCreateUser(api: ApiClient) {
  return useMutation((data: T.UserCreate) => api.users.create(data));
}

export function useUpdateUser(api: ApiClient) {
  return useMutation((payload: { id: T.UUID; data: T.UserUpdate }) =>
    api.users.update(payload.id, payload.data)
  );
}

export function useDeleteUser(api: ApiClient) {
  return useMutation((id: T.UUID) => api.users.delete(id));
}

export function useResetUserPassword(api: ApiClient) {
  return useMutation((payload: { id: T.UUID; data: T.PasswordResetPayload }) =>
    api.users.resetPassword(payload.id, payload.data)
  );
}

// ============================================================================
// ANALYTICS HOOKS (Extended)
// ============================================================================

export function useTrendDons(api: ApiClient, params: Parameters<ApiClient["analytics"]["trendDons"]>[0]) {
  return useQuery(["analytics-trend-dons", JSON.stringify(params)], () => api.analytics.trendDons(params), { enabled: !!params.start_date && !!params.end_date });
}

export function useTrendStock(api: ApiClient, params: Parameters<ApiClient["analytics"]["trendStock"]>[0]) {
  return useQuery(["analytics-trend-stock", JSON.stringify(params)], () => api.analytics.trendStock(params), { enabled: !!params.start_date && !!params.end_date });
}

export function useTrendDistribution(api: ApiClient, params: Parameters<ApiClient["analytics"]["trendDistribution"]>[0]) {
  return useQuery(["analytics-trend-distribution", JSON.stringify(params)], () => api.analytics.trendDistribution(params), { enabled: !!params.start_date && !!params.end_date });
}

export function useKPIs(api: ApiClient) {
  const collection = useQuery(["analytics- kpi-collection"], () => api.analytics.kpiCollectionRate());
  const wastage = useQuery(["analytics-kpi-wastage"], () => api.analytics.kpiWastageRate());
  const liberation = useQuery(["analytics-kpi-liberation"], () => api.analytics.kpiLiberationRate());
  const stock = useQuery(["analytics-kpi-stock"], () => api.analytics.kpiStockAvailable());

  return {
    collection,
    wastage,
    liberation,
    stock,
    isLoading: collection.status === "loading" || wastage.status === "loading" || liberation.status === "loading" || stock.status === "loading",
    isError: collection.status === "error" || wastage.status === "error" || liberation.status === "error" || stock.status === "error",
  };
}

export function useStockBreakdown(api: ApiClient) {
  return useQuery(["analytics-stock-breakdown"], () => api.analytics.stockBreakdown());
}
