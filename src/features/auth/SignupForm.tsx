import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ApiError } from '../../api/client';
import { signup, type AuthResponse } from '../../api/auth';
import { applyFieldErrors, problemOf } from '../../api/problem';
import { signupSchema, type SignupFormValues } from './schema';

interface Props {
  onSuccess: (response: AuthResponse) => void;
}

const NETWORK_ERROR = "Couldn't reach the server. Is the API gateway running on port 8080?";
const GENERIC_ERROR = 'Something went wrong. Please try again.';

export function SignupForm({ onSuccess }: Props) {
  const emailId = useId();
  const usernameId = useId();
  const passwordId = useId();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  });

  const mutation = useMutation({
    mutationFn: signup,
    onSuccess,
    onError: (err) => {
      const problem = problemOf(err);
      // Map backend 409s into per-field errors so the UI feels integrated.
      if (err instanceof ApiError && err.status === 409) {
        if (problem?.code === 'email_taken') {
          setError('email', { message: 'This email is already registered.' });
        } else if (problem?.code === 'username_taken') {
          setError('username', { message: 'This username is already taken.' });
        } else {
          setFormError(GENERIC_ERROR);
        }
      } else if (problem?.code === 'validation_failed') {
        // Server-side rejection the client zod schema didn't catch.
        if (!applyFieldErrors(problem, setError, ['email', 'username', 'password'])) {
          setFormError(GENERIC_ERROR);
        }
      } else {
        setFormError(err instanceof ApiError ? GENERIC_ERROR : NETWORK_ERROR);
      }
    },
  });

  const submitting = mutation.isPending;

  return (
    <form
      onSubmit={handleSubmit((data) => {
        setFormError(null);
        mutation.mutate(data);
      })}
      className="space-y-4"
      noValidate
    >
      <div>
        <label htmlFor={emailId} className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          {...register('email')}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor={usernameId} className="block text-sm font-medium text-slate-700 mb-1">
          Username
        </label>
        <input
          id={usernameId}
          type="text"
          autoComplete="username"
          {...register('username')}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
      </div>

      <div>
        <label htmlFor={passwordId} className="block text-sm font-medium text-slate-700 mb-1">
          Password
        </label>
        <input
          id={passwordId}
          type="password"
          autoComplete="new-password"
          {...register('password')}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {submitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
