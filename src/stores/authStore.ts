import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Holds the session tokens, persisted to localStorage so a page refresh keeps
 * the session. The access token is short-lived (15 min); the refresh token
 * (30 days, rotating) is used by apiFetch to silently get a new pair on a 401,
 * so the user isn't logged out mid-session.
 */
interface AuthState {
  token: string | null;
  refreshToken: string | null;
  /** Store a fresh access + refresh pair (login, signup, or after a refresh). */
  setSession: (token: string, refreshToken: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      setSession: (token, refreshToken) => set({ token, refreshToken }),
      clear: () => set({ token: null, refreshToken: null }),
    }),
    { name: 'beamcard-auth' },
  ),
);
