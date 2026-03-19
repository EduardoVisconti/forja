import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'auth.errors.required').email('auth.errors.invalidEmail'),
  password: z.string().min(6, 'auth.errors.passwordTooShort'),
});

export const registerSchema = z
  .object({
    email: z.string().min(1, 'auth.errors.required').email('auth.errors.invalidEmail'),
    password: z.string().min(6, 'auth.errors.passwordTooShort'),
    confirmPassword: z.string().min(1, 'auth.errors.required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.errors.passwordsDoNotMatch',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
