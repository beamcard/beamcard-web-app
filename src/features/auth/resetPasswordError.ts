import { ApiError } from '../../api/client';
import { problemOf } from '../../api/problem';

export const RESET_NETWORK_ERROR = "Couldn't reach the server. Is the API gateway running on port 8080?";
export const RESET_GENERIC_ERROR = 'Something went wrong. Please try again.';
export const RESET_INVALID_TOKEN_ERROR = 'This reset link is invalid or has expired. Request a new one.';

/** Map a password-reset failure to a user-facing message (English; kept for unit tests). */
export function resetErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return RESET_NETWORK_ERROR;
  return problemOf(err)?.code === 'invalid_reset_token' ? RESET_INVALID_TOKEN_ERROR : RESET_GENERIC_ERROR;
}

/** Map a password-reset failure to an i18n key — used by the page for localized text. */
export function resetErrorKey(err: unknown): string {
  if (!(err instanceof ApiError)) return 'common.networkError';
  return problemOf(err)?.code === 'invalid_reset_token' ? 'auth.invalidToken' : 'common.genericError';
}
