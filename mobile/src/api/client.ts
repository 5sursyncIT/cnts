import { createApiClient, type ApiClient } from "@cnts/api";
import { API_BASE_URL } from "../constants/api";

let _client: ApiClient | null = null;

/** Crée ou récupère le client API pour communiquer avec le backend CNTS. */
export function getApiClient(token?: string): ApiClient {
  if (_client && !token) return _client;

  const fetchWithAuth: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(input, { ...init, headers });
  };

  const client = createApiClient({
    baseUrl: API_BASE_URL,
    fetchImpl: token ? fetchWithAuth : undefined,
  });

  if (!token) _client = client;
  return client;
}
