import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(2).max(60),
  name: z.string().min(2).max(180),
  description: z.string().optional().nullable(),
  type: z.enum(['product', 'service']).default('product'),
  category_id: z.number().int().positive().optional().nullable(),
  price: z.number().nonnegative(),
  tax_rate: z.number().min(0).max(100).default(16),
  stock: z.number().int().nonnegative().default(0),
  is_active: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();