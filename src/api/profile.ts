import { API_BASE_URL, apiFetch, apiFetchText } from './client';

/**
 * Wire shapes for profile-service. snake_case to match its Jackson config
 * (spring.jackson.property-naming-strategy: SNAKE_CASE). Nullable fields are
 * optional because the service omits nulls (default-property-inclusion:
 * non_null). Backend: com.beamcard.profile.rest.model.{request,response}.*
 */

export type LinkType =
  | 'GENERIC'
  | 'WHATSAPP'
  | 'TELEGRAM'
  | 'VIBER'
  | 'INSTAGRAM'
  | 'TWITTER'
  | 'LINKEDIN'
  | 'EMAIL';

export interface LinkResponse {
  id: string;
  label: string;
  url: string;
  type: LinkType;
  position: number;
}

/** The profile's primary location (country + city); omitted when none is set. */
export interface Location {
  country?: string;
  city?: string;
}

/** One workplace: a role at an organization + its street address (within the primary city). */
export interface Affiliation {
  role?: string;
  organization?: string;
  address?: string;
  /** Optional free-text "how to find it" note. */
  description?: string;
}

export interface ProfileResponse {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  location?: Location;
  affiliations?: Affiliation[];
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  links: LinkResponse[];
}

/** PUT body — partial; an omitted field leaves the stored value unchanged. */
export interface UpdateProfileRequest {
  display_name?: string;
  bio?: string;
  location?: Location;
  affiliations?: Affiliation[];
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

/**
 * GET /profiles/@{username} — the public card. Anonymous (no token). An unknown
 * username throws ApiError(404) carrying `code: 'profile_not_found'`.
 */
export function getPublicProfile(username: string): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>(`/profiles/@${encodeURIComponent(username)}`);
}

/* ------------------------------- links -------------------------------- */

/** POST body for a new link. */
export interface CreateLinkRequest {
  label: string;
  url: string;
  type: LinkType;
}

/** PUT body — partial; an omitted field is left unchanged. */
export interface UpdateLinkRequest {
  label?: string;
  url?: string;
  type?: LinkType;
}

/** POST /me/profile/links — append a link to the caller's card. */
export function createLink(req: CreateLinkRequest): Promise<LinkResponse> {
  return apiFetch<LinkResponse>('/me/profile/links', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

/** PUT /me/profile/links/{id} — edit one of the caller's links. */
export function updateLink(id: string, req: UpdateLinkRequest): Promise<LinkResponse> {
  return apiFetch<LinkResponse>(`/me/profile/links/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  });
}

/** DELETE /me/profile/links/{id} — remove one of the caller's links. */
export function deleteLink(id: string): Promise<void> {
  return apiFetch<void>(`/me/profile/links/${id}`, { method: 'DELETE' });
}

/** PUT /me/profile/links/order — reorder the caller's links to match `ids`. */
export function reorderLinks(ids: string[]): Promise<LinkResponse[]> {
  return apiFetch<LinkResponse[]>('/me/profile/links/order', {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  });
}

/* ------------------------------ avatar -------------------------------- */

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // mirrors backend beamcard.avatar.max-size-bytes
export const AVATAR_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

interface AvatarUploadTarget {
  upload_url: string;
  key: string;
  expires_at: string;
}

/** Step 1 — ask the service for a presigned PUT target for the given content type. */
function requestAvatarUploadUrl(contentType: string): Promise<AvatarUploadTarget> {
  return apiFetch<AvatarUploadTarget>('/me/profile/avatar/upload-url', {
    method: 'POST',
    body: JSON.stringify({ content_type: contentType }),
  });
}

/** Step 2 — PUT the bytes straight to object storage (NOT the gateway): no auth header, raw body. */
async function putBytes(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }
}

/** Step 3 — confirm the upload; the service validates and saves the avatar key. */
function confirmAvatar(key: string): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>('/me/profile/avatar', {
    method: 'PUT',
    body: JSON.stringify({ key }),
  });
}

/** Full avatar upload: presign → PUT bytes → confirm. Returns the updated profile. */
export async function uploadAvatar(file: File): Promise<ProfileResponse> {
  const target = await requestAvatarUploadUrl(file.type);
  await putBytes(target.upload_url, file);
  return confirmAvatar(target.key);
}

/** DELETE /me/profile/avatar — clear the avatar. */
export function removeAvatar(): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>('/me/profile/avatar', { method: 'DELETE' });
}

/* ------------------------------- share -------------------------------- */

/** The public, shareable URL for a card (same origin as the SPA). */
export function publicCardUrl(username: string): string {
  return `${window.location.origin}/@${username}`;
}

/**
 * Direct link to the downloadable vCard (.vcf) for a public card. Points at the
 * gateway, not the SPA; the server sends Content-Disposition: attachment, so
 * the browser downloads it.
 */
export function publicVcardUrl(username: string): string {
  return `${API_BASE_URL}/profiles/@${encodeURIComponent(username)}/vcard`;
}

/** GET /me/profile/qr — the caller's QR code as an SVG string (authenticated). */
export function getMyProfileQr(): Promise<string> {
  return apiFetchText('/me/profile/qr');
}
