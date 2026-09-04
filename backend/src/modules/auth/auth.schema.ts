import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  fullName: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır.'),
});

export const LoginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  password: z.string().min(1, 'Şifre zorunludur.'),
});

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const ChangeTierSchema = z.object({
  tier: z.enum(['FREE', 'PRO', 'ENTERPRISE']),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangeTierInput = z.infer<typeof ChangeTierSchema>;
