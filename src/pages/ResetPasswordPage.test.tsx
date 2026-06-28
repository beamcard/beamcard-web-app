import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ResetPasswordPage } from './ResetPasswordPage';
import { resetErrorMessage } from '../features/auth/resetPasswordError';
import { resetPassword } from '../api/auth';
import { ApiError } from '../api/client';

vi.mock('../api/auth', () => ({ resetPassword: vi.fn() }));

const resetPasswordMock = vi.mocked(resetPassword);

function renderPage(entry: string) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <ResetPasswordPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ResetPasswordPage', () => {
  beforeEach(() => resetPasswordMock.mockReset());

  it('submits the new password with the token from the query string', async () => {
    resetPasswordMock.mockResolvedValue(undefined);
    renderPage('/reset-password?token=abc123');

    await userEvent.type(screen.getByLabelText('New password'), 'brandnewpassword');
    await userEvent.click(screen.getByRole('button', { name: /set new password/i }));

    expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
    // TanStack Query passes a second context arg to the mutationFn.
    expect(resetPasswordMock).toHaveBeenCalledWith(
      { token: 'abc123', password: 'brandnewpassword' },
      expect.anything(),
    );
  });

  it('shows an invalid-link message when the token is missing', () => {
    renderPage('/reset-password');

    expect(screen.getByText(/this reset link is invalid or has expired/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  });

  // The error → message mapping is a pure helper, unit-tested directly (avoids
  // driving a rejected mutation through jsdom, which spuriously flags the
  // already-handled rejection as unhandled).
  describe('resetErrorMessage', () => {
    it('maps an expired/used token to the invalid-link message', () => {
      const msg = resetErrorMessage(new ApiError(400, 'Bad Request', { code: 'invalid_reset_token' }));
      expect(msg).toMatch(/invalid or has expired/i);
    });

    it('maps other API errors to a generic message', () => {
      const msg = resetErrorMessage(new ApiError(500, 'Server Error', { code: 'internal_error' }));
      expect(msg).toMatch(/something went wrong/i);
    });

    it('maps a non-API (network) error to the connectivity message', () => {
      const msg = resetErrorMessage(new Error('network down'));
      expect(msg).toMatch(/couldn't reach the server/i);
    });
  });
});
