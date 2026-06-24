import { useQuery } from '@tanstack/react-query';
import { getCurrentAccount } from '../../api/auth';
import { useAuthStore } from '../../stores/authStore';

/**
 * Fetches GET /auth/me. Only runs when a token is present. A 401 propagates
 * through apiFetch, which clears the token — so the protected route then
 * bounces the user to /login.
 */
export function useCurrentAccount() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['account', 'me'],
    queryFn: getCurrentAccount,
    enabled: Boolean(token),
  });
}
