import { z } from 'zod';

export const changeOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']),
});

export const createOrderSchema = z.object({
  client_id: z.number().int().positive(),
  quote_id: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  discount: z.number().nonnegative().default(0),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    description: z.string().max(255).optional().nullable(),
    quantity: z.number().positive(),
    unit_price: z.number().nonnegative(),
    tax_rate: z.number().min(0).max(100).default(16),
    discount: z.number().nonnegative().default(0),
  })).min(1),
});