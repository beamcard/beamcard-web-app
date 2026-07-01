import { z } from 'zod';

/**
 * Zod schema for signup. Rules mirror the backend's Bean Validation
 * annotations on SignupRequest so client- and server-side rejection
 * messages agree:
 *   - email: present, valid format, ≤ 254 chars
 *   - password: 12–128 chars
 *   - username: 3–20 chars (formal char rules land with BC-4)
 */
// Validation messages are i18n keys; forms render them with t(message).
export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'validation.emailRequired')
    .email('validation.emailInvalid')
    .max(254),
  password: z
    .string()
    .min(12, 'validation.passwordMin')
    .max(128, 'validation.passwordMax'),
  username: z
    .string()
    .min(3, 'validation.usernameMin')
    .max(20, 'validation.usernameMax'),
  locale: z.enum(['en', 'de', 'uk']),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

/**
 * Login only needs a well-formed email and a non-empty password. We do NOT
 * re-apply the 12-char rule here — a too-short password is simply wrong
 * credentials (401), and enforcing length client-side would leak the policy.
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'validation.emailRequired').email('validation.emailInvalid'),
  password: z.string().min(1, 'validation.passwordRequired'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/** "Forgot password" — just a well-formed email; the answer is always generic. */
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'validation.emailRequired').email('validation.emailInvalid').max(254),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

/** "Set new password" — mirrors the signup password rule (12–128 chars). */
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(12, 'validation.passwordMin')
    .max(128, 'validation.passwordMax'),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
