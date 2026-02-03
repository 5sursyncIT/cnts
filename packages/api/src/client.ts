import { createInstrumentedFetch } from "@cnts/monitoring";
import type * as T from "./types";

export type ApiClientOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

export type ApiError = {
  status: number;
  body: unknown;
};

async function readJsonSafe(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

async function requestJson<TResponse>(input: {
  fetchImpl: typeof fetch;
  url: string;
  init?: RequestInit;
}): Promise<TResponse> {
  const res = await input.fetchImpl(input.url, {
    ...input.init,
    headers: {
      "content-type": "application/json",
      ...(input.init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await readJsonSafe(res);
    throw { status: res.status, body } satisfies ApiError;
  }

  return (await readJsonSafe(res)) as TResponse;
}

function buildQueryString(params: Record<string, any>): string {
  const url = new URL("http://dummy");
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.search;
}

export function createApiClient(options: ApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchImpl = createInstrumentedFetch({ fetchImpl: options.fetchImpl });

  // Helper pour GET requests
  const get = <TResponse>(path: string, params?: Record<string, any>) => {
    const query = params ? buildQueryString(params) : "";
    return requestJson<TResponse>({
      fetchImpl,
      url: `${baseUrl}${path}${query}`,
    });
  };

  // Helper pour POST requests
  const post = <TResponse>(path: string, body?: any) =>
    requestJson<TResponse>({
      fetchImpl,
      url: `${baseUrl}${path}`,
      init: {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      },
    });

  // Helper pour PUT requests
  const put = <TResponse>(path: string, body?: any) =>
    requestJson<TResponse>({
      fetchImpl,
      url: `${baseUrl}${path}`,
      init: {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      },
    });

  // Helper pour DELETE requests
  const del = <TResponse>(path: string) =>
    requestJson<TResponse>({
      fetchImpl,
      url: `${baseUrl}${path}`,
      init: { method: "DELETE" },
    });

  return {
    // ========================================================================
    // HEALTH
    // ========================================================================
    health: () => get<{ status: string }>("/health"),
    healthDb: () => get<{ status: string }>("/health/db"),

    // ========================================================================
    // DONNEURS
    // ========================================================================
    donneurs: {
      list: (params?: {
        q?: string;
        sexe?: "H" | "F";
        groupe_sanguin?: string;
        region?: string;
        limit?: number;
        offset?: number;
      }) => get<T.Donneur[]>("/donneurs", params),

      create: (data: T.DonneurCreate) => post<T.Donneur>("/donneurs", data),

      update: (id: T.UUID, data: T.DonneurUpdate) =>
        put<T.Donneur>(`/donneurs/${id}`, data),

      get: (id: T.UUID) => get<T.Donneur>(`/donneurs/${id}`),

      delete: (id: T.UUID) => del<{ deleted: boolean }>(`/donneurs/${id}`),

      checkEligibilite: (id: T.UUID) =>
        get<T.EligibiliteResponse>(`/donneurs/${id}/eligibilite`),
    },

    // ========================================================================
    // DONS
    // ========================================================================
    dons: {
      list: (params?: {
        donneur_id?: T.UUID;
        statut?: string;
        limit?: number;
        offset?: number;
      }) => get<T.Don[]>("/dons", params),

      create: (data: T.DonCreate) => post<T.Don>("/dons", data),

      get: (id: T.UUID) => get<T.Don>(`/dons/${id}`),

      getEtiquette: (id: T.UUID) =>
        get<T.EtiquetteData>(`/dons/${id}/etiquette`),
    },

    // ========================================================================
    // ANALYSES
    // ========================================================================
    analyses: {
      list: (params?: {
        don_id?: T.UUID;
        type_test?: string;
        resultat?: string;
        limit?: number;
        offset?: number;
      }) => get<T.Analyse[]>("/analyses", params),

      create: (data: T.AnalyseCreate) => post<T.Analyse>("/analyses", data),

      get: (id: T.UUID) => get<T.Analyse>(`/analyses/${id}`),
    },

    // ========================================================================
    // LIBERATION BIOLOGIQUE
    // ========================================================================
    liberation: {
      check: (donId: T.UUID) =>
        get<T.LiberationCheck>(`/liberation/${donId}`),

      liberer: (donId: T.UUID) =>
        post<T.LiberationResult>(`/liberation/${donId}/liberer`),
    },

    // ========================================================================
    // POCHES
    // ========================================================================
    poches: {
      list: (params?: T.PocheFilterParams) => get<T.Poche[]>("/poches", params),

      get: (id: T.UUID) => get<T.Poche>(`/poches/${id}`),

      getStockSummary: () => get<T.StockSummary>("/poches/stock/summary"),

      getAlertesPeremption: (jours: number = 7) =>
        get<T.Poche[]>("/poches/alertes/peremption", { jours }),

      delete: (id: T.UUID) => del<{ deleted: boolean }>(`/poches/${id}`),
    },

    // ========================================================================
    // STOCK & FRACTIONNEMENT
    // ========================================================================
    stock: {
      // Fractionnement manuel
      fractionner: (data: T.FractionnementCreate) =>
        post<T.FractionnementResult>("/stock/fractionnements", data),

      // Fractionnement par recette
      fractionnerAvecRecette: (
        code: string,
        data: T.FractionnementRecettePayload
      ) =>
        post<T.FractionnementResult>(
          `/stock/fractionnements/recette/${code}`,
          data
        ),

      // Product Rules
      listProductRules: () => get<T.ProductRule[]>("/stock/regles"),

      getProductRule: (typeProduit: string) =>
        get<T.ProductRule>(`/stock/regles/${typeProduit}`),

      upsertProductRule: (typeProduit: string, data: T.ProductRuleCreate) =>
        put<T.ProductRule>(`/stock/regles/${typeProduit}`, data),

      // Recettes de fractionnement
      listRecettes: (params?: { site_code?: string; actif?: boolean }) =>
        get<T.RecetteFractionnement[]>("/stock/recettes", params),

      getRecette: (code: string) =>
        get<T.RecetteFractionnement>(`/stock/recettes/${code}`),

      createRecette: (data: T.RecetteFractionnementCreate) =>
        put<T.RecetteFractionnement>(`/stock/recettes/${data.code}`, data),

      updateRecette: (code: string, data: T.RecetteFractionnementCreate) =>
        put<T.RecetteFractionnement>(`/stock/recettes/${code}`, data),

      deleteRecette: (code: string) =>
        del<{ deleted: boolean }>(`/stock/recettes/${code}`),

      // Liste des poches en stock
      listPochesStock: (params?: {
        type_produit?: string;
        statut_stock?: string;
        limit?: number;
      }) => get<T.Poche[]>("/stock/poches", params),
    },

    // ========================================================================
    // DISTRIBUTION - HOPITAUX
    // ========================================================================
    hopitaux: {
      list: (params?: { convention_actif?: boolean; limit?: number }) =>
        get<T.Hopital[]>("/hopitaux", params),

      create: (data: T.HopitalCreate) => post<T.Hopital>("/hopitaux", data),

      get: (id: T.UUID) => get<T.Hopital>(`/hopitaux/${id}`),
    },

    // ========================================================================
    // DISTRIBUTION - COMMANDES
    // ========================================================================
    commandes: {
      list: (params?: {
        statut?: string;
        hopital_id?: T.UUID;
        limit?: number;
      }) => get<T.Commande[]>("/commandes", params),

      create: (data: T.CommandeCreate) => post<T.Commande>("/commandes", data),

      get: (id: T.UUID) => get<T.Commande>(`/commandes/${id}`),

      valider: (id: T.UUID, payload?: T.CommandeValiderPayload) =>
        post<T.CommandeValiderResult>(`/commandes/${id}/valider`, payload),

      affecter: (id: T.UUID, payload: T.CommandeAffecterPayload) =>
        post<{ commande_id: string; assigned: number }>(
          `/commandes/${id}/affecter`,
          payload
        ),

      servir: (id: T.UUID) =>
        post<T.CommandeServirResult>(`/commandes/${id}/servir`, {}),

      annuler: (id: T.UUID) =>
        post<{ commande_id: string; statut: string }>(
          `/commandes/${id}/annuler`
        ),

      sweepReservations: () =>
        post<{ released: number }>("/commandes/reservations/sweep"),
    },

    // ========================================================================
    // DISTRIBUTION - RECEVEURS
    // ========================================================================
    receveurs: {
      list: (params?: { groupe_sanguin?: string; limit?: number }) =>
        get<T.Receveur[]>("/receveurs", params),

      create: (data: T.ReceveurCreate) =>
        post<T.Receveur>("/receveurs", data),

      get: (id: T.UUID) => get<T.Receveur>(`/receveurs/${id}`),
    },

    // ========================================================================
    // DISTRIBUTION - CROSS-MATCH
    // ========================================================================
    crossMatch: {
      create: (data: T.CrossMatchCreate) =>
        post<T.CrossMatch>("/cross-match", data),
    },

    // ========================================================================
    // HEMOVIGILANCE
    // ========================================================================
    hemovigilance: {
      listActesTransfusionnels: (params?: {
        poche_id?: T.UUID;
        hopital_id?: T.UUID;
        limit?: number;
      }) => get<T.ActeTransfusionnel[]>("/actes-transfusionnels", params),

      getActeTransfusionnel: (id: T.UUID) =>
        get<T.ActeTransfusionnel>(`/actes-transfusionnels/${id}`),

      listRappels: (params?: { statut?: string; limit?: number }) =>
        get<T.RappelLot[]>("/rappels", params),

      getRappel: (id: T.UUID) => get<T.RappelLot>(`/rappels/${id}`),
    },

    // ========================================================================
    // ANALYTICS
    // ========================================================================
    analytics: {
      getDashboard: (params?: { start_date?: string; end_date?: string }) =>
        get<T.AnalyticsDashboard>("/analytics/dashboard", params),

      exportReport: (params: {
        format: "csv" | "excel" | "pdf";
        report_type: "activity" | "stock";
      }) => {
        const query = new URLSearchParams(params as any).toString();
        return window.open(`${baseUrl}/analytics/export?${query}`, "_blank");
      },
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
