import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../constants/api";

const TOKEN_KEY = "cnts_access_token";
const TOKEN_EXPIRY_KEY = "cnts_token_expiry";

export interface LoginResult {
  success: boolean;
  mfaRequired?: boolean;
  challengeToken?: string;
  accessToken?: string;
  error?: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

/** Login avec email/password. Retourne le token ou indique MFA requis. */
export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.detail ?? "Identifiants invalides" };
    }

    const data = await res.json();

    if (data.mfa_required) {
      return {
        success: false,
        mfaRequired: true,
        challengeToken: data.challenge_token,
      };
    }

    await storeToken(data.access_token);
    return { success: true, accessToken: data.access_token };
  } catch (e) {
    return { success: false, error: "Erreur réseau. Vérifiez votre connexion." };
  }
}

/** Vérification MFA (TOTP ou code de récupération). */
export async function verifyMFA(
  challengeToken: string,
  code: string
): Promise<LoginResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/mfa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge_token: challengeToken, code }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.detail ?? "Code MFA invalide" };
    }

    const data = await res.json();
    await storeToken(data.access_token);
    return { success: true, accessToken: data.access_token };
  } catch (e) {
    return { success: false, error: "Erreur réseau." };
  }
}

/** Stocke le token dans SecureStore. */
async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  // Le token CNTS expire après 8h (28800s). On stocke l'expiration.
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiresAt);
}

/** Récupère le token stocké (null si absent ou expiré). */
export async function getStoredToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return null;

  const expiry = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
  if (expiry && new Date(expiry) < new Date()) {
    await clearToken();
    return null;
  }

  return token;
}

/** Supprime le token (logout). */
export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
}

/** Parse le payload du token CNTS1 pour extraire les infos utilisateur. */
export function parseTokenPayload(token: string): AuthUser | null {
  try {
    // Format: CNTS1.<base64(payload)>.<base64(sig)>
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "CNTS1") return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      userId: payload.sub,
      email: payload.email ?? "",
      role: payload.role ?? "",
    };
  } catch {
    return null;
  }
}
