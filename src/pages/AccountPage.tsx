import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { logout as logoutApi } from '../api/auth';
import { useCurrentAccount } from '../features/auth/useCurrentAccount';

export function AccountPage() {
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
    return <div className="max-w-md mx-auto mt-20 p-6 text-slate-600">Loading your account…</div>;
  }

  if (isError || !account) {
    // A 401 has already cleared the token (apiFetch), so ProtectedRoute will
    // redirect on the next render. This covers other failures (e.g. server down).
    return (
      <div className="max-w-md mx-auto mt-20 p-6">
        <p className="text-sm text-red-600 mb-4">Couldn't load your account.</p>
        <button onClick={logout} className="text-indigo-600 hover:underline text-sm">
          Sign in again
        </button>
      </div>
    );
  }

  const memberSince = new Date(account.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">@{account.username}</h1>
        <button
          onClick={logout}
          className="text-sm px-3 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition"
        >
          Log out
        </button>
      </div>

      <dl className="grid grid-cols-3 gap-y-3 text-sm">
        <dt className="col-span-1 text-slate-500">Email</dt>
        <dd className="col-span-2 text-slate-900">{account.email}</dd>

        <dt className="col-span-1 text-slate-500">Plan</dt>
        <dd className="col-span-2">
          <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium uppercase">
            {account.plan}
          </span>
        </dd>

        <dt className="col-span-1 text-slate-500">Member since</dt>
        <dd className="col-span-2 text-slate-900">{memberSince}</dd>
      </dl>

      <RouterLink
        to="/app/profile"
        className="mt-8 inline-block py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
      >
        Edit your card
      </RouterLink>
    </div>
  );
}
