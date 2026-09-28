import { z } from 'zod';

export const createInvoiceSchema = z.object({
  order_id: z.number().int().positive(),
  due_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const registerPaymentSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
  method: z.enum(['cash', 'card', 'transfer', 'check', 'other']).default('cash'),
  reference: z.string().max(120).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const voidInvoiceSchema = z.object({
  reason: z.string().min(3, 'Indica el motivo de la anulación').max(255),
});