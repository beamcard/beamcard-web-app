import { useAuthStore } from '../stores/authStore';

/**
 * Thin fetch wrapper around the Beamcard API.
 *
 * - All calls go through the api-gateway (single origin); BASE_URL is the
 *   gateway, configurable via VITE_API_URL (default localhost:8080)
 * - JSON in / JSON out
 * - Attaches `Authorization: Bearer <token>` when a token is present
 * - On 401 it clears the stored token (the session is dead) before throwing,
 *   so the app reacts by bouncing to /login
 * - Non-2xx responses throw an `ApiError` carrying status + parsed body so
 *   callers can branch on `err.status === 409` or inspect `err.body.code`.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

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

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    if (response.status === 401) {
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

  // Some endpoints will be 204 in the future — guard for that.
  if (response.status === 204) {
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
