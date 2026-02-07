import { create } from "zustand";
import {
  clearToken,
  getStoredToken,
  login as apiLogin,
  parseTokenPayload,
  verifyMFA as apiVerifyMFA,
  type AuthUser,
} from "../api/auth";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  mfaRequired: boolean;
  challengeToken: string | null;
  error: string | null;

  /** Tente de restaurer la session depuis SecureStore. */
  restore: () => Promise<void>;
  /** Login email/password. */
  login: (email: string, password: string) => Promise<boolean>;
  /** Vérification MFA. */
  verifyMFA: (code: string) => Promise<boolean>;
  /** Déconnexion. */
  logout: () => Promise<void>;
  /** Clear error message. */
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: true,
  isAuthenticated: false,
  token: null,
  user: null,
  mfaRequired: false,
  challengeToken: null,
  error: null,

  restore: async () => {
    set({ isLoading: true });
    const token = await getStoredToken();
    if (token) {
      const user = parseTokenPayload(token);
      set({ isAuthenticated: true, token, user, isLoading: false });
    } else {
      set({ isAuthenticated: false, token: null, user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    const result = await apiLogin(email, password);

    if (result.mfaRequired) {
      set({
        isLoading: false,
        mfaRequired: true,
        challengeToken: result.challengeToken ?? null,
      });
      return false;
    }

    if (!result.success) {
      set({ isLoading: false, error: result.error ?? "Erreur de connexion" });
      return false;
    }

    const user = parseTokenPayload(result.accessToken!);
    set({
      isLoading: false,
      isAuthenticated: true,
      token: result.accessToken!,
      user,
      mfaRequired: false,
      challengeToken: null,
    });
    return true;
  },

  verifyMFA: async (code) => {
    const { challengeToken } = get();
    if (!challengeToken) return false;

    set({ isLoading: true, error: null });
    const result = await apiVerifyMFA(challengeToken, code);

    if (!result.success) {
      set({ isLoading: false, error: result.error ?? "Code invalide" });
      return false;
    }

    const user = parseTokenPayload(result.accessToken!);
    set({
      isLoading: false,
      isAuthenticated: true,
      token: result.accessToken!,
      user,
      mfaRequired: false,
      challengeToken: null,
    });
    return true;
  },

  logout: async () => {
    await clearToken();
    set({
      isAuthenticated: false,
      token: null,
      user: null,
      mfaRequired: false,
      challengeToken: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
