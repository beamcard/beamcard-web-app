import { useQuery } from '@tanstack/react-query';
import { getPublicProfile, type ProfileResponse } from '../../api/profile';

/**
 * Fetches the public card GET /profiles/@{username}. Disabled until a username
 * is known. A 404 surfaces as an error (code `profile_not_found`); the global
 * QueryClient has retry disabled, so it fails fast.
 */
export function usePublicProfile(username: string | undefined) {
  return useQuery<ProfileResponse>({
    queryKey: ['profile', 'public', username],
    queryFn: () => getPublicProfile(username!),
    enabled: Boolean(username),
  });
}
