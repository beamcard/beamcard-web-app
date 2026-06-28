import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { requestPasswordReset } from '../api/auth';

vi.mock('../api/auth', () => ({ requestPasswordReset: vi.fn() }));

const requestResetMock = vi.mocked(requestPasswordReset);

function renderPage() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => requestResetMock.mockReset());

  it('submits the email and shows the generic confirmation', async () => {
    requestResetMock.mockResolvedValue(undefined);
    renderPage();

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText(/if an account exists for that email/i)).toBeInTheDocument();
    expect(requestResetMock).toHaveBeenCalledWith('alice@example.com');
  });

  it('blocks an invalid email client-side', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(requestResetMock).not.toHaveBeenCalled();
  });
});
