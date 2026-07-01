import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { logout as logoutApi } from '../api/auth';
import { useCurrentAccount } from '../features/auth/useCurrentAccount';
import { LANG_FLAGS, type Lang } from '../i18n';

export function AccountPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clear = useAuthStore((s) => s.clear);
  const { data: account, isLoading, isError } = useCurrentAccount();

  const logout = () => {
    // Best-effort server-side revoke of the refresh token; clear locally regardless.
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      void logoutApi(refreshToken).catch(() => {});
    }
    clear();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return <div className="max-w-md mx-auto mt-20 p-6 text-slate-600">{t('account.loading')}</div>;
  }

  if (isError || !account) {
    // A 401 has already cleared the token (apiFetch), so ProtectedRoute will
    // redirect on the next render. This covers other failures (e.g. server down).
    return (
      <div className="max-w-md mx-auto mt-20 p-6">
        <p className="text-sm text-red-600 mb-4">{t('account.loadError')}</p>
        <button onClick={logout} className="text-indigo-600 hover:underline text-sm">
          {t('account.signInAgain')}
        </button>
      </div>
    );
  }

  const memberSince = new Date(account.created_at).toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Fall back to the active UI language if the account has no stored locale yet.
  const language = (account.locale ?? i18n.language) as Lang;

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">@{account.username}</h1>
        <button
          onClick={logout}
          className="text-sm px-3 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition"
        >
          {t('account.logOut')}
        </button>
      </div>

      <dl className="grid grid-cols-3 gap-y-3 text-sm">
        <dt className="col-span-1 text-slate-500">{t('account.email')}</dt>
        <dd className="col-span-2 text-slate-900">{account.email}</dd>

        <dt className="col-span-1 text-slate-500">{t('account.plan')}</dt>
        <dd className="col-span-2">
          <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium uppercase">
            {account.plan}
          </span>
        </dd>

        <dt className="col-span-1 text-slate-500">{t('lang.label')}</dt>
        <dd className="col-span-2 text-slate-900">
          {LANG_FLAGS[language] ?? ''} {t(`lang.${language}`)}
        </dd>

        <dt className="col-span-1 text-slate-500">{t('account.memberSince')}</dt>
        <dd className="col-span-2 text-slate-900">{memberSince}</dd>
      </dl>

      <RouterLink
        to="/app/profile"
        className="mt-8 inline-block py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
      >
        {t('account.editCard')}
      </RouterLink>
    </div>
  );
}
