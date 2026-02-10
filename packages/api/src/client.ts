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
  const headers: Record<string, string> = {
    ...(input.init?.headers as Record<string, string> ?? {}),
  };

  if (!(input.init?.body instanceof FormData)) {
    headers["content-type"] = "application/json";
  }

  const res = await input.fetchImpl(input.url, {
    ...input.init,
    headers,
  });

  if (res.status === 204) {
    return {} as TResponse;
  }

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

  // Helper pour Upload requests (Multipart)
  const upload = <TResponse>(path: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return requestJson<TResponse>({
      fetchImpl,
      url: `${baseUrl}${path}`,
      init: {
        method: "POST",
        body: formData,
      },
    });
  };

  return {
    // ========================================================================
    // UPLOAD
    // ========================================================================
    upload: (file: File) => upload<{ url: string }>("/upload", file),

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
        numero_carte?: string;
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

      delete: (id: T.UUID) => del<void>(`/donneurs/${id}`),

      checkEligibilite: (id: T.UUID) =>
        get<T.EligibiliteResponse>(`/donneurs/${id}/eligibilite`),
    },

    // ========================================================================
    // FIDELISATION - CARTES DONNEUR
    // ========================================================================
    fidelisation: {
      createCarte: (data: T.CarteDonneurCreate) =>
        post<T.CarteDonneur>("/fidelisation/cartes", data),

      getCarteByDonneur: (donneurId: T.UUID) =>
        get<T.CarteDonneur>(`/fidelisation/cartes/donneur/${donneurId}`),
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

      delete: (id: T.UUID) => del<void>(`/poches/${id}`),
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
        del<{ code: string; actif: boolean }>(`/stock/recettes/${code}`),

      // Liste des poches en stock
      listPochesStock: (params?: {
        type_produit?: string;
        statut_stock?: string;
        limit?: number;
      }) => get<T.Poche[]>("/stock/poches", params),
    },

    // ========================================================================
    // PARAMETRAGE - RULES DE PEREMPTION
    // ========================================================================
    parametrage: {
      listExpirationRules: (params?: { skip?: number; limit?: number }) =>
        get<T.ExpirationRule[]>("/parametrage/rules", params),
      createExpirationRule: (data: T.ExpirationRuleCreate) =>
        post<T.ExpirationRule>("/parametrage/rules", data),
      updateExpirationRule: (id: T.UUID, data: T.ExpirationRuleUpdate) =>
        put<T.ExpirationRule>(`/parametrage/rules/${id}`, data),
      deleteExpirationRule: (id: T.UUID) =>
        del<T.ExpirationRule>(`/parametrage/rules/${id}`),

      listRegions: () => get<string[]>("/parametrage/regions"),
    },

    // ========================================================================
    // DISTRIBUTION - HOPITAUX
    // ========================================================================
    hopitaux: {
      list: (params?: { convention_actif?: boolean; limit?: number }) =>
        get<T.Hopital[]>("/hopitaux", params),

      create: (data: T.HopitalCreate) => post<T.Hopital>("/hopitaux", data),

      update: (id: T.UUID, data: T.HopitalUpdate) =>
        put<T.Hopital>(`/hopitaux/${id}`, data),

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

      events: (id: T.UUID, params?: { after?: string; event_type?: string; limit?: number }) =>
        get<T.CommandeEvent[]>(`/commandes/${id}/events`, params),

      valider: (id: T.UUID, payload?: T.CommandeValiderPayload) =>
        post<T.CommandeValiderResult>(`/commandes/${id}/valider`, payload),

      affecter: (id: T.UUID, payload: T.CommandeAffecterPayload) =>
        post<{ commande_id: string; assigned: number }>(
          `/commandes/${id}/affecter`,
          payload
        ),

      confirmer: (id: T.UUID, payload: T.CommandeConfirmationPayload) =>
        post<{ commande_id: string; statut: string }>(`/commandes/${id}/confirmer`, payload),

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

      update: (id: T.UUID, data: T.ReceveurUpdate) =>
        put<T.Receveur>(`/receveurs/${id}`, data),

      get: (id: T.UUID) => get<T.Receveur>(`/receveurs/${id}`),

      delete: (id: T.UUID) => del<void>(`/receveurs/${id}`),
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
        din?: string;
        lot?: string;
        receveur_id?: T.UUID;
        hopital_id?: T.UUID;
        limit?: number;
      }) => get<T.ActeTransfusionnel[]>("/hemovigilance/transfusions", params),

      getActeTransfusionnel: (id: T.UUID) =>
        get<T.ActeTransfusionnel>(`/hemovigilance/transfusions/${id}`),

      listRappels: (params?: { statut?: string; limit?: number }) =>
        get<T.RappelLot[]>("/hemovigilance/rappels", params),

      createRappel: (data: T.RappelCreate) =>
        post<T.RappelLot>("/hemovigilance/rappels", data),

      getRappel: (id: T.UUID) => get<T.RappelLot>(`/hemovigilance/rappels/${id}`),

      createRappelAuto: (data: T.RappelAutoCreate) =>
        post<T.RappelLot>("/hemovigilance/rappels/auto", data),

      notifierRappel: (id: T.UUID, data: T.RappelActionCreate) =>
        post<T.RappelLot>(`/hemovigilance/rappels/${id}/notifier`, data),

      listRappelActions: (id: T.UUID, params?: { limit?: number }) =>
        get<T.RappelAction[]>(`/hemovigilance/rappels/${id}/actions`, params),

      getRappelImpacts: (id: T.UUID, params?: { limit?: number }) =>
        get<T.ImpactRappel[]>(`/hemovigilance/rappels/${id}/impacts`, params),

      exportRappelImpacts: (id: T.UUID) =>
        get<string>(`/hemovigilance/rappels/${id}/impacts.csv`),

      rapportAutorites: () => get<T.RapportAutorite>("/hemovigilance/rapports/autorites"),

      fluxPartenaires: (params?: { cursor?: string; hopital_id?: T.UUID; limit?: number }) =>
        get<T.PartenaireFlux>("/hemovigilance/partenaires/flux", params),
    },

    // ========================================================================
    // ANALYTICS
    // ========================================================================
    analytics: {
      getDashboard: (params?: { start_date?: string; end_date?: string }) =>
        get<T.AnalyticsDashboardResponse>("/analytics/dashboard", params),

      // Trends
      trendDons: (params: {
        start_date: string;
        end_date: string;
        granularity?: T.TimeGranularity;
      }) => get<T.TrendResponse>("/analytics/trend/dons", params),

      trendStock: (params: {
        start_date: string;
        end_date: string;
        product_type?: string;
      }) => get<T.TrendResponse>("/analytics/trend/stock", params),

      trendDistribution: (params: { start_date: string; end_date: string }) =>
        get<T.TrendResponse>("/analytics/trend/distribution", params),

      // KPIs
      kpiCollectionRate: () => get<T.KPIMetric>("/analytics/kpi/collection-rate"),
      kpiWastageRate: () => get<T.KPIMetric>("/analytics/kpi/wastage-rate"),
      kpiLiberationRate: () => get<T.KPIMetric>("/analytics/kpi/liberation-rate"),
      kpiStockAvailable: () => get<T.KPIMetric>("/analytics/kpi/stock-available"),

      // Stock breakdown
      stockBreakdown: () => get<T.StockBreakdownResponse>("/analytics/stock/breakdown"),

      exportReport: (params: {
        format: "csv" | "excel" | "pdf";
        report_type: "activity" | "stock";
      }) => {
        const query = new URLSearchParams(params as any).toString();
        return window.open(`${baseUrl}/analytics/export?${query}`, "_blank");
      },
    },

    // ========================================================================
    // CMS - ARTICLES
    // ========================================================================
    articles: {
      list: (params?: {
        category?: string;
        status?: string;
        published_only?: boolean;
        skip?: number;
        limit?: number;
      }) => get<T.Article[]>("/articles", params),

      get: (slug: string) => get<T.Article>(`/articles/${slug}`),

      create: (data: T.ArticleCreate) => post<T.Article>("/articles", data),

      update: (id: T.UUID, data: T.ArticleUpdate) =>
        put<T.Article>(`/articles/${id}`, data),

      delete: (id: T.UUID) => del<{ ok: boolean }>(`/articles/${id}`),
    },

    // ========================================================================
    // USER MANAGEMENT
    // ========================================================================
    users: {
      list: (params?: {
        role?: T.UserRole;
        is_active?: boolean;
        limit?: number;
        offset?: number;
      }) => get<T.User[]>("/users", params),

      create: (data: T.UserCreate) => post<T.User>("/users", data),

      get: (id: T.UUID) => get<T.User>(`/users/${id}`),

      update: (id: T.UUID, data: T.UserUpdate) =>
        put<T.User>(`/users/${id}`, data),

      delete: (id: T.UUID) =>
        del<{ user_id: string; is_active: boolean }>(`/users/${id}`),

      resetPassword: (id: T.UUID, data: T.PasswordResetPayload) =>
        post<T.PasswordResetResult>(`/users/${id}/reset-password`, data),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
