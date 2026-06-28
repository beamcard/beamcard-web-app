import { useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '../api/auth';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../features/auth/schema';
import { resetErrorMessage, RESET_INVALID_TOKEN_ERROR } from '../features/auth/resetPasswordError';

export function ResetPasswordPage() {
  const passwordId = useId();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  });

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => setDone(true),
    onError: (err) => setFormError(resetErrorMessage(err)),
  });

  // A link with no token can't possibly work — don't show the form.
  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
        <p className="mt-4 text-sm text-red-600">{RESET_INVALID_TOKEN_ERROR}</p>
        <Link className="mt-4 inline-block text-sm text-indigo-600 hover:underline" to="/forgot-password">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Password updated</h1>
        <p className="mt-4 text-sm text-slate-700">Your password has been changed. You can now sign in with it.</p>
        <Link className="mt-4 inline-block text-sm text-indigo-600 hover:underline" to="/login">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Choose a new password</h1>
      <p className="text-sm text-slate-600 mb-6">Enter a new password for your account.</p>
      <form
        onSubmit={handleSubmit((data) => {
          setFormError(null);
          mutation.mutate({ token, password: data.password });
        })}
        className="space-y-4"
        noValidate
      >
        <div>
          <label htmlFor={passwordId} className="block text-sm font-medium text-slate-700 mb-1">
            New password
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
          disabled={mutation.isPending}
          className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {mutation.isPending ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </div>
  );
}
