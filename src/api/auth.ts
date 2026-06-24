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
