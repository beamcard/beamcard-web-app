import { z } from 'zod';

/**
 * Zod schema for signup. Rules mirror the backend's Bean Validation
 * annotations on SignupRequest so client- and server-side rejection
 * messages agree:
 *   - email: present, valid format, ≤ 254 chars
 *   - password: 12–128 chars
 *   - username: 3–20 chars (formal char rules land with BC-4)
 */
export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email')
    .max(254),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be 128 characters or fewer'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be 20 characters or fewer'),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

/**
 * Login only needs a well-formed email and a non-empty password. We do NOT
 * re-apply the 12-char rule here — a too-short password is simply wrong
 * credentials (401), and enforcing length client-side would leak the policy.
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
