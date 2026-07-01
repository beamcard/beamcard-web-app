import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentAccount } from '../../api/auth';
import { useAuthStore } from '../../stores/authStore';
import i18n from '../../i18n';

/**
 * Fetches GET /auth/me. Only runs when a token is present. A 401 propagates
 * through apiFetch, which clears the token — so the protected route then
 * bounces the user to /login. Also locks the UI language to the account's
 * stored locale (the user's single chosen language) once loaded.
 */
export function useCurrentAccount() {
  const token = useAuthStore((s) => s.token);
  const query = useQuery({
    queryKey: ['account', 'me'],
    queryFn: getCurrentAccount,
    enabled: Boolean(token),
  });

  const locale = query.data?.locale;
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);

  return query;
}
