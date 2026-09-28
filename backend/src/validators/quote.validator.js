import { z } from 'zod';

const quoteItemSchema = z.object({
  product_id: z.number().int().positive(),
  description: z.string().max(255).optional().nullable(),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  tax_rate: z.number().min(0).max(100).default(16),
  discount: z.number().nonnegative().default(0),
});

export const createQuoteSchema = z.object({
  client_id: z.number().int().positive(),
  valid_until: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  discount: z.number().nonnegative().default(0),
  items: z.array(quoteItemSchema).min(1, 'Debe incluir al menos un ítem'),
});

export const updateQuoteSchema = createQuoteSchema.partial();

export const changeQuoteStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'approved', 'rejected', 'expired']),
});