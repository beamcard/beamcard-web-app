import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignupForm } from './SignupForm';
import { signup, type AuthResponse } from '../../api/auth';
import { ApiError } from '../../api/client';

// Module-level mock — replaces `signup` with a vi.fn(). Using vi.spyOn on the
// named export doesn't work here because Vite/esbuild rewrites imports to
// direct refs, bypassing the namespace object.
vi.mock('../../api/auth', () => ({
  signup: vi.fn(),
}));

const signupMock = vi.mocked(signup);

function renderForm(onSuccess = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <SignupForm onSuccess={onSuccess} />
    </QueryClientProvider>,
  );
  return { onSuccess };
}

describe('SignupForm', () => {
  beforeEach(() => {
    signupMock.mockReset();
  });

  it('shows client-side validation errors when fields are empty', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 12 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
    expect(signupMock).not.toHaveBeenCalled();
  });

  it('calls signup API and reports success', async () => {
    const fakeResponse: AuthResponse = {
      access_token: 'token.value',
      refresh_token: 'refresh.value',
      token_type: 'Bearer',
      expires_in: 900,
      user: { id: 'uuid', email: 'alice@example.com', username: 'alice', plan: 'free' },
    };
    signupMock.mockResolvedValue(fakeResponse);

    const { onSuccess } = renderForm();
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/username/i), 'alice');
    await userEvent.type(screen.getByLabelText(/password/i), 'correcthorsebatterystaple');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      // TanStack Query 5 passes a second arg (mutation context) to mutationFn;
      // expect.anything() tolerates it while still pinning the payload shape.
      expect(signupMock).toHaveBeenCalledWith(
        {
          email: 'alice@example.com',
          username: 'alice',
          password: 'correcthorsebatterystaple',
        },
        expect.anything(),
      );
      // TanStack Query 5 calls onSuccess with (data, variables, context, mutateOptions).
      // We only care about `data` — assert on the first argument.
      expect(onSuccess).toHaveBeenCalled();
      expect(onSuccess.mock.calls[0][0]).toEqual(fakeResponse);
    });
  });

  it('maps a 409 email_taken response into a field-level error', async () => {
    signupMock.mockRejectedValue(new ApiError(409, 'Conflict', { code: 'email_taken' }));

    renderForm();
    await userEvent.type(screen.getByLabelText(/email/i), 'taken@example.com');
    await userEvent.type(screen.getByLabelText(/username/i), 'newname');
    await userEvent.type(screen.getByLabelText(/password/i), 'correcthorsebatterystaple');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/already registered/i)).toBeInTheDocument();
  });

  it('maps a 409 username_taken response into a field-level error', async () => {
    signupMock.mockRejectedValue(new ApiError(409, 'Conflict', { code: 'username_taken' }));

    renderForm();
    await userEvent.type(screen.getByLabelText(/email/i), 'fresh@example.com');
    await userEvent.type(screen.getByLabelText(/username/i), 'alice');
    await userEvent.type(screen.getByLabelText(/password/i), 'correcthorsebatterystaple');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/already taken/i)).toBeInTheDocument();
  });
});
