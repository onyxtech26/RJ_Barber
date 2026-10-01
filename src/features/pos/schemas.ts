import { z } from 'zod';
import { DISCOUNT_TYPES, PAYMENT_METHODS } from '@/lib/enums';

// Shapes shared by the terminal (client) and the Server Actions. The server re-validates everything.

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullish();

export const createOrderSchema = z.object({
  id: z.uuid(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  customerName: optionalText(60),
  customerPhone: optionalText(20),
  lines: z
    .array(
      z.object({
        catalogItemId: z.string().min(1),
        quantity: z.int().min(1).max(99),
        barberId: z.string().min(1).nullable(),
      })
    )
    .min(1, 'The ticket is empty.')
    .max(50),
  discount: z
    .object({
      type: z.enum(DISCOUNT_TYPES),
      value: z.int().positive(),
      reason: z.string().trim().min(1, 'Give a reason for the discount.').max(120),
    })
    .nullish(),
  approval: z.object({ ownerId: z.string().min(1), pin: z.string().regex(/^\d{4,6}$/) }).nullish(),
});
export type CreateOrderInput = z.input<typeof createOrderSchema>;

export const confirmPaymentSchema = z.object({
  orderId: z.string().min(1),
  paymentRef: optionalText(40),
  cashReceivedSen: z.int().min(0).max(10_000_000).nullish(),
});
export type ConfirmPaymentInput = z.input<typeof confirmPaymentSchema>;

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: 'approval_required' | 'stale' };
