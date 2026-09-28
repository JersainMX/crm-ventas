import { z } from 'zod';

export const createClientSchema = z.object({
  type: z.enum(['company', 'person']).default('company'),
  name: z.string().min(2).max(180),
  tax_id: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  status: z.enum(['prospect', 'active', 'inactive']).default('prospect'),
  owner_id: z.number().int().positive().optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

export const contactSchema = z.object({
  name: z.string().min(2).max(150),
  position: z.string().max(100).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
});