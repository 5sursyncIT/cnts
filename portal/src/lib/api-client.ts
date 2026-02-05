import { createApiClient } from "@cnts/api";

export const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  fetchImpl: fetch,
});
