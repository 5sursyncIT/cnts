/**
 * React hooks pour l'utilisation du client API
 * Compatible avec Next.js App Router (Server + Client Components)
 */

import { useCallback, useEffect, useState } from "react";
import type { ApiClient, ApiError } from "./client";

// ============================================================================
// TYPES HELPERS
// ============================================================================

export type AsyncState<T> =
  | { status: "idle"; data: undefined; error: undefined }
  | { status: "loading"; data: undefined; error: undefined }
  | { status: "success"; data: T; error: undefined }
  | { status: "error"; data: undefined; error: ApiError };

export type MutationState<T> =
  | { status: "idle"; data: undefined; error: undefined; isLoading: false }
  | { status: "loading"; data: undefined; error: undefined; isLoading: true }
  | { status: "success"; data: T; error: undefined; isLoading: false }
  | { status: "error"; data: undefined; error: ApiError; isLoading: false };

// ============================================================================
// GENERIC HOOKS
// ============================================================================

/**
 * Hook générique pour les requêtes GET avec chargement automatique
 */
export function useQuery<T>(
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
  }
): AsyncState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<AsyncState<T>>({
    status: "idle",
    data: undefined,
    error: undefined,
  });

  const enabled = options?.enabled ?? true;
  const refetchOnMount = options?.refetchOnMount ?? true;

  const execute = useCallback(async () => {
    if (!enabled) return;

    setState({ status: "loading", data: undefined, error: undefined });

    try {
      const data = await queryFn();
      setState({ status: "success", data, error: undefined });
    } catch (err) {
      setState({
        status: "error",
        data: undefined,
        error: err as ApiError,
      });
    }
  }, [queryFn, enabled]);

  useEffect(() => {
    if (refetchOnMount) {
      execute();
    }
  }, [execute, refetchOnMount]);

  return {
    ...state,
    refetch: execute,
  };
}

/**
 * Hook générique pour les mutations (POST, PUT, DELETE)
 */
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>
): MutationState<TData> & {
  mutate: (variables: TVariables) => Promise<TData>;
  reset: () => void;
} {
  const [state, setState] = useState<MutationState<TData>>({
    status: "idle",
    data: undefined,
    error: undefined,
    isLoading: false,
  });

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setState({
        status: "loading",
        data: undefined,
        error: undefined,
        isLoading: true,
      });

      try {
        const data = await mutationFn(variables);
        setState({ status: "success", data, error: undefined, isLoading: false });
        return data;
      } catch (err) {
        const error = err as ApiError;
        setState({
          status: "error",
          data: undefined,
          error,
          isLoading: false,
        });
        throw error;
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setState({
      status: "idle",
      data: undefined,
      error: undefined,
      isLoading: false,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

// ============================================================================
// HOOKS SPÉCIFIQUES PAR MODULE
// ============================================================================

/**
 * Hook pour charger la liste des donneurs
 */
export function useDonneurs(
  api: ApiClient,
  params?: Parameters<ApiClient["donneurs"]["list"]>[0]
) {
  const serializedParams = JSON.stringify(params);
  const queryFn = useCallback(() => api.donneurs.list(params), [api, serializedParams]);
  return useQuery(queryFn);
}

/**
 * Hook pour charger un donneur par ID
 */
export function useDonneur(api: ApiClient, id: string | null) {
  const queryFn = useCallback(() => api.donneurs.get(id!), [api, id]);
  return useQuery(queryFn, {
    enabled: id !== null,
  });
}

/**
 * Hook pour créer un donneur
 */
export function useCreateDonneur(api: ApiClient) {
  return useMutation((data: Parameters<ApiClient["donneurs"]["create"]>[0]) =>
    api.donneurs.create(data)
  );
}

/**
 * Hook pour mettre à jour un donneur
 */
export function useUpdateDonneur(api: ApiClient) {
  return useMutation(
    ({ id, data }: { id: string; data: Parameters<ApiClient["donneurs"]["update"]>[1] }) =>
      api.donneurs.update(id, data)
  );
}

/**
 * Hook pour supprimer un donneur
 */
export function useDeleteDonneur(api: ApiClient) {
  return useMutation((id: string) => api.donneurs.delete(id));
}

/**
 * Hook pour vérifier l'éligibilité d'un donneur
 */
export function useCheckEligibilite(api: ApiClient, donneurId: string | null) {
  const queryFn = useCallback(() => api.donneurs.checkEligibilite(donneurId!), [api, donneurId]);
  return useQuery(queryFn, {
    enabled: donneurId !== null,
  });
}

/**
 * Hook pour charger la liste des dons
 */
export function useDons(
  api: ApiClient,
  params?: Parameters<ApiClient["dons"]["list"]>[0]
) {
  const serializedParams = JSON.stringify(params);
  const queryFn = useCallback(() => api.dons.list(params), [api, serializedParams]);
  return useQuery(queryFn);
}

/**
 * Hook pour charger un don par ID
 */
export function useDon(api: ApiClient, id: string | null) {
  const queryFn = useCallback(() => api.dons.get(id!), [api, id]);
  return useQuery(queryFn, {
    enabled: id !== null,
  });
}

/**
 * Hook pour créer un don
 */
export function useCreateDon(api: ApiClient) {
  return useMutation((data: Parameters<ApiClient["dons"]["create"]>[0]) =>
    api.dons.create(data)
  );
}

/**
 * Hook pour charger la liste des analyses
 */
export function useAnalyses(
  api: ApiClient,
  params?: Parameters<ApiClient["analyses"]["list"]>[0]
) {
  const serializedParams = JSON.stringify(params);
  const queryFn = useCallback(() => api.analyses.list(params), [api, serializedParams]);
  return useQuery(queryFn);
}

/**
 * Hook pour créer une analyse
 */
export function useCreateAnalyse(api: ApiClient) {
  return useMutation((data: Parameters<ApiClient["analyses"]["create"]>[0]) =>
    api.analyses.create(data)
  );
}

/**
 * Hook pour vérifier si un don peut être libéré
 */
export function useCheckLiberation(api: ApiClient, donId: string | null) {
  const queryFn = useCallback(() => api.liberation.check(donId!), [api, donId]);
  return useQuery(queryFn, {
    enabled: donId !== null,
  });
}

/**
 * Hook pour libérer un don
 */
export function useLibererDon(api: ApiClient) {
  return useMutation((donId: string) => api.liberation.liberer(donId));
}

/**
 * Hook pour charger la liste des poches
 */
export function usePoches(
  api: ApiClient,
  params?: Parameters<ApiClient["poches"]["list"]>[0]
) {
  const serializedParams = JSON.stringify(params);
  const queryFn = useCallback(() => api.poches.list(params), [api, serializedParams]);
  return useQuery(queryFn);
}

/**
 * Hook pour charger le résumé du stock
 */
export function useStockSummary(api: ApiClient) {
  const queryFn = useCallback(() => api.poches.getStockSummary(), [api]);
  return useQuery(queryFn);
}

/**
 * Hook pour charger les alertes de péremption
 */
export function useAlertesPeremption(api: ApiClient, jours: number = 7) {
  const queryFn = useCallback(() => api.poches.getAlertesPeremption(jours), [api, jours]);
  return useQuery(queryFn);
}

/**
 * Hook pour charger les poches en stock
 */
export function usePochesStock(
  api: ApiClient,
  params?: Parameters<ApiClient["stock"]["listPochesStock"]>[0]
) {
  const serializedParams = JSON.stringify(params);
  const queryFn = useCallback(() => api.stock.listPochesStock(params), [api, serializedParams]);
  return useQuery(queryFn);
}

/**
 * Hook pour fractionner une poche
 */
export function useFractionner(api: ApiClient) {
  return useMutation((data: Parameters<ApiClient["stock"]["fractionner"]>[0]) =>
    api.stock.fractionner(data)
  );
}

/**
 * Hook pour fractionner avec une recette
 */
export function useFractionnerAvecRecette(api: ApiClient) {
  return useMutation(
    ({ code, data }: { code: string; data: any }) =>
      api.stock.fractionnerAvecRecette(code, data)
  );
}

/**
 * Hook pour charger les recettes de fractionnement
 */
export function useRecettes(
  api: ApiClient,
  params?: Parameters<ApiClient["stock"]["listRecettes"]>[0]
) {
  const serializedParams = JSON.stringify(params);
  const queryFn = useCallback(() => api.stock.listRecettes(params), [api, serializedParams]);
  return useQuery(queryFn);
}

/**
 * Hook pour charger les règles produits
 */
export function useProductRules(api: ApiClient) {
  const queryFn = useCallback(() => api.stock.listProductRules(), [api]);
  return useQuery(queryFn);
}

/**
 * Hook pour charger la liste des hôpitaux
 */
export function useHopitaux(
  api: ApiClient,
  params?: Parameters<ApiClient["hopitaux"]["list"]>[0]
) {
  const serializedParams = JSON.stringify(params);
  const queryFn = useCallback(() => api.hopitaux.list(params), [api, serializedParams]);
  return useQuery(queryFn);
}

/**
 * Hook pour charger un hôpital
 */
export function useHopital(api: ApiClient, id: string | null) {
  const queryFn = useCallback(() => (id ? api.hopitaux.get(id) : Promise.reject(new Error("No ID"))), [api, id]);
  return useQuery(queryFn, {
    enabled: !!id,
  });
}

/**
 * Hook pour créer un hôpital
 */
export function useCreateHopital(api: ApiClient) {
  return useMutation((data: Parameters<ApiClient["hopitaux"]["create"]>[0]) =>
    api.hopitaux.create(data)
  );
}

/**
 * Hook pour charger la liste des commandes
 */
export function useCommandes(
  api: ApiClient,
  params?: Parameters<ApiClient["commandes"]["list"]>[0]
) {
  const serializedParams = JSON.stringify(params);
  const queryFn = useCallback(() => api.commandes.list(params), [api, serializedParams]);
  return useQuery(queryFn);
}

/**
 * Hook pour charger une commande
 */
export function useCommande(api: ApiClient, id: string | null) {
  const queryFn = useCallback(() => (id ? api.commandes.get(id) : Promise.reject(new Error("No ID"))), [api, id]);
  return useQuery(queryFn, {
    enabled: !!id,
  });
}

/**
 * Hook pour créer une commande
 */
export function useCreateCommande(api: ApiClient) {
  return useMutation((data: Parameters<ApiClient["commandes"]["create"]>[0]) =>
    api.commandes.create(data)
  );
}

/**
 * Hook pour valider une commande
 */
export function useValiderCommande(api: ApiClient) {
  return useMutation(
    ({ id, payload }: { id: string; payload?: any }) =>
      api.commandes.valider(id, payload)
  );
}

/**
 * Hook pour servir une commande
 */
export function useServirCommande(api: ApiClient) {
  return useMutation((id: string) => api.commandes.servir(id));
}

/**
 * Hook pour annuler une commande
 */
export function useAnnulerCommande(api: ApiClient) {
  return useMutation((id: string) => api.commandes.annuler(id));
}

/**
 * Hook pour charger la liste des receveurs
 */
export function useReceveurs(
  api: ApiClient,
  params?: Parameters<ApiClient["receveurs"]["list"]>[0]
) {
  const serializedParams = JSON.stringify(params);
  const queryFn = useCallback(() => api.receveurs.list(params), [api, serializedParams]);
  return useQuery(queryFn);
}

/**
 * Hook pour créer un receveur
 */
export function useCreateReceveur(api: ApiClient) {
  return useMutation((data: Parameters<ApiClient["receveurs"]["create"]>[0]) =>
    api.receveurs.create(data)
  );
}

/**
 * Hook pour créer un cross-match
 */
export function useCreateCrossMatch(api: ApiClient) {
  return useMutation((data: Parameters<ApiClient["crossMatch"]["create"]>[0]) =>
    api.crossMatch.create(data)
  );
}

/**
 * Hook pour charger le tableau de bord analytique
 */
export function useAnalyticsDashboard(
  api: ApiClient,
  params?: Parameters<ApiClient["analytics"]["getDashboard"]>[0]
) {
  const serializedParams = JSON.stringify(params);
  const queryFn = useCallback(() => api.analytics.getDashboard(params), [api, serializedParams]);
  return useQuery(queryFn);
}
