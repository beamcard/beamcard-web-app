import { apiFetch } from './client';

/**
 * Wire shapes for profile-service. snake_case to match its Jackson config
 * (spring.jackson.property-naming-strategy: SNAKE_CASE). Nullable fields are
 * optional because the service omits nulls (default-property-inclusion:
 * non_null). Backend: com.beamcard.profile.rest.model.{request,response}.*
 */

export interface ProfileResponse {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

/** PUT body — partial; an omitted field leaves the stored value unchanged. */
export interface UpdateProfileRequest {
  display_name?: string;
  bio?: string;
}

/**
 * GET /me/profile — the caller's own profile. Auto-provisions an empty profile
 * (from the JWT claims) on first call, so this never 404s for a logged-in user.
 */
export function getMyProfile(): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>('/me/profile');
}

/** PUT /me/profile — update the caller's display name / bio. */
export function updateMyProfile(req: UpdateProfileRequest): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>('/me/profile', {
    method: 'PUT',
    body: JSON.stringify(req),
  });
}
