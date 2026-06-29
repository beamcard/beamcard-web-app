import { useAuthStore } from '../stores/authStore';

/**
 * Thin fetch wrapper around the Beamcard API.
 *
 * - All calls go through the api-gateway (single origin); BASE_URL is the
 *   gateway, configurable via VITE_API_URL (default localhost:8080)
 * - JSON in / JSON out
 * - Attaches `Authorization: Bearer <token>` when a token is present
 * - On 401 it transparently tries the refresh token once (rotating the pair)
 *   and retries; if that fails it clears the session so the app bounces to /login
 * - Non-2xx responses throw an `ApiError` carrying status + parsed body so
 *   callers can branch on `err.status === 409` or inspect `err.body.code`.
 */

/** Gateway origin. Exported so callers can build direct links (e.g. file downloads). */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const BASE_URL = API_BASE_URL;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Paths where a 401 means "bad credentials / token", NOT "access token expired" —
// never try to refresh for these (/auth/refresh would loop; refreshing during
// /auth/logout would mint a new token that the logout then fails to revoke).
const NO_REFRESH = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/logout'];

// Single-flight: many requests can 401 at once; dedupe so we rotate the refresh
// token exactly once (otherwise concurrent refreshes revoke each other).
let refreshInFlight: Promise<string | null> | null = null;

/** Use the stored refresh token to get a fresh access+refresh pair. Returns the new access token, or null. */
async function refreshSession(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  refreshInFlight ??= fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      useAuthStore.getState().setSession(data.access_token, data.refresh_token);
      return data.access_token as string;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = useAuthStore.getState().token;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && retry && !NO_REFRESH.some((p) => path.startsWith(p))) {
      // Access token likely expired — try one silent refresh, then retry the call.
      const newToken = await refreshSession();
      if (newToken) {
        return apiFetch<T>(path, init, false);
      }
      useAuthStore.getState().clear(); // refresh failed → session is truly dead
    } else if (response.status === 401) {
      useAuthStore.getState().clear();
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      // Server returned non-JSON; that's OK, body stays undefined.
    }
    throw new ApiError(response.status, response.statusText, body);
  }

  // No-body success responses (204 No Content, 202 Accepted) — nothing to parse.
  if (response.status === 204 || response.status === 202) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

/** Like apiFetch but returns the raw text body (e.g. an SVG), with the same auth + 401 handling. */
export async function apiFetchText(path: string, init: RequestInit = {}): Promise<string> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().clear();
    }
    throw new ApiError(response.status, response.statusText);
  }
  return response.text();
}
