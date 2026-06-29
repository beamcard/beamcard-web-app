import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, ApiError } from './client';
import { useAuthStore } from '../stores/authStore';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('apiFetch refresh-on-401', () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('refreshes the session on 401 and retries the request once', async () => {
    useAuthStore.getState().setSession('old-access', 'r1');
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 })) // protected call → expired
      .mockResolvedValueOnce(json({ access_token: 'new-access', refresh_token: 'r2' })) // /auth/refresh
      .mockResolvedValueOnce(json({ ok: true })); // retried protected call

    const result = await apiFetch<{ ok: boolean }>('/me/profile');

    expect(result).toEqual({ ok: true });
    expect(useAuthStore.getState().token).toBe('new-access');
    expect(useAuthStore.getState().refreshToken).toBe('r2'); // rotated
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('clears the session and throws when the refresh also fails', async () => {
    useAuthStore.getState().setSession('old-access', 'r1');
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 })) // protected call
      .mockResolvedValueOnce(new Response(null, { status: 401 })); // /auth/refresh rejects

    await expect(apiFetch('/me/profile')).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it('does not attempt a refresh for /auth/login (bad credentials, not expiry)', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(json({ code: 'invalid_credentials' }, 401));

    await expect(apiFetch('/auth/login', { method: 'POST' })).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1); // no refresh attempt
  });

  it('does not refresh on a 401 from /auth/logout (would mint an un-revoked token)', async () => {
    useAuthStore.getState().setSession('expired-access', 'r1'); // refresh token present
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(apiFetch('/auth/logout', { method: 'POST' })).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1); // logout is in NO_REFRESH → no silent refresh
  });
});
