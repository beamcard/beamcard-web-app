import { apiFetch } from './client';

/**
 * Wire shapes — must match user-service's REST DTOs exactly (snake_case).
 * Backend: com.beamcard.user.auth.rest.model.{request,response}.*
 */

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    username: string;
    plan: 'free' | 'premium';
  };
}

/** Body of GET /auth/me (AccountResponse). */
export interface AccountResponse {
  id: string;
  email: string;
  username: string;
  plan: 'free' | 'premium';
  created_at: string;
}

/**
 * Auth error bodies share the platform-wide RFC 7807 shape. The full `code`
 * union (incl. `validation_failed` / `internal_error`) lives in ./problem.
 */
export type { ApiProblem, ProblemCode } from './problem';

export function signup(req: SignupRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export function login(req: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export function getCurrentAccount(): Promise<AccountResponse> {
  return apiFetch<AccountResponse>('/auth/me');
}

/** POST /auth/refresh — exchange a refresh token for a fresh access + refresh pair (rotation). */
export function refresh(refreshToken: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

/** POST /auth/logout — revoke the refresh token server-side (JWT-protected). 204 on success. */
export function logout(refreshToken: string): Promise<void> {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

/**
 * POST /auth/password/forgot — request a reset link. Always 202 (no body),
 * even for an unknown email, so it can't be used to probe for registered
 * addresses.
 */
export function requestPasswordReset(email: string): Promise<void> {
  return apiFetch<void>('/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** POST /auth/password/reset — set a new password using the emailed token. 204 on success. */
export function resetPassword(req: { token: string; password: string }): Promise<void> {
  return apiFetch<void>('/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}
