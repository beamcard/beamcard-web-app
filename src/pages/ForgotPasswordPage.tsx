import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import { requestPasswordReset } from '../api/auth';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../features/auth/schema';

const NETWORK_ERROR = "Couldn't reach the server. Is the API gateway running on port 8080?";
const GENERIC_ERROR = 'Something went wrong. Please try again.';

export function ForgotPasswordPage() {
  const emailId = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) => requestPasswordReset(values.email),
    onSuccess: () => setSent(true),
    onError: (err) => setFormError(err instanceof ApiError ? GENERIC_ERROR : NETWORK_ERROR),
  });

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>

      {sent ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-700">
            If an account exists for that email, we&apos;ve sent a link to reset your password. The
            link expires shortly — check your inbox.
          </p>
          <Link className="text-sm text-indigo-600 hover:underline" to="/login">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-600 mb-6">
            Enter your email and we&apos;ll send you a link to choose a new one.
          </p>
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

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {mutation.isPending ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <p className="mt-4 text-sm text-slate-600">
            Remembered it?{' '}
            <Link className="text-indigo-600 hover:underline" to="/login">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
