import { useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../api/auth';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../features/auth/schema';
import { resetErrorKey } from '../features/auth/resetPasswordError';

export function ResetPasswordPage() {
  const { t } = useTranslation();
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
    onError: (err) => setFormError(t(resetErrorKey(err))),
  });

  // A link with no token can't possibly work — don't show the form.
  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('auth.resetTitle')}</h1>
        <p className="mt-4 text-sm text-red-600">{t('auth.invalidToken')}</p>
        <Link className="mt-4 inline-block text-sm text-indigo-600 hover:underline" to="/forgot-password">
          {t('auth.requestNewLink')}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('auth.passwordUpdatedTitle')}</h1>
        <p className="mt-4 text-sm text-slate-700">{t('auth.passwordUpdatedBody')}</p>
        <Link className="mt-4 inline-block text-sm text-indigo-600 hover:underline" to="/login">
          {t('auth.goToSignIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('auth.chooseNewPassword')}</h1>
      <p className="text-sm text-slate-600 mb-6">{t('auth.resetIntro')}</p>
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
            {t('auth.newPassword')}
          </label>
          <input
            id={passwordId}
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{t(errors.password.message ?? '')}</p>}
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {mutation.isPending ? t('auth.saving') : t('auth.setNewPassword')}
        </button>
      </form>
    </div>
  );
}
