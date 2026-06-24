import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Holds the access token. Persisted to localStorage so a refresh keeps the
 * session. The token is the single source of "are we logged in"; the user
 * profile itself is fetched from /auth/me (see useCurrentAccount).
 *
 * NOTE: access tokens are short-lived (15 min). Until refresh tokens land
 * (BC-6) an expired token simply forces a re-login on the next 401.
 */
interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clear: () => set({ token: null }),
    }),
    { name: 'beamcard-auth' },
  ),
);
