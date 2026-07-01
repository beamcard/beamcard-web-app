import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/client';
import { requestPasswordReset } from '../api/auth';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../features/auth/schema';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
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
    onError: (err) => setFormError(err instanceof ApiError ? t('common.genericError') : t('common.networkError')),
  });

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('auth.resetTitle')}</h1>

      {sent ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-700">{t('auth.forgotSent')}</p>
          <Link className="text-sm text-indigo-600 hover:underline" to="/login">
            {t('auth.backToSignIn')}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-600 mb-6">{t('auth.forgotIntro')}</p>
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
                {t('auth.email')}
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{t(errors.email.message ?? '')}</p>}
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {mutation.isPending ? t('auth.sending') : t('auth.sendResetLink')}
            </button>
          </form>
          <p className="mt-4 text-sm text-slate-600">
            {t('auth.rememberedIt')}{' '}
            <Link className="text-indigo-600 hover:underline" to="/login">
              {t('auth.backToSignIn')}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
