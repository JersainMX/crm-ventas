import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'supervisor', 'seller']).default('seller'),
  is_active: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'supervisor', 'seller']).optional(),
  is_active: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8),
});