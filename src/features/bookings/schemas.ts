import { z } from 'zod';

// Shared by the booking dialog (client) and the Server Actions, which re-validate everything.

export const saveBookingSchema = z.object({
  id: z.string().min(1).max(64).nullish(),
  businessDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date.'),
  startTime: z.string().regex(/^\d{1,2}:\d{2}$/, 'Choose a start time.'),
  barberId: z.string().min(1, 'Choose a barber.'),
  customerName: z.string().trim().min(1, 'Enter the customer’s name.').max(60),
  customerPhone: z
    .string()
    .trim()
    .max(20)
    .transform((v) => (v === '' ? null : v))
    .nullish(),
  notes: z
    .string()
    .trim()
    .max(200)
    .transform((v) => (v === '' ? null : v))
    .nullish(),
  itemIds: z.array(z.string().min(1)).min(1, 'Choose at least one service.').max(6),
  allowOutsideHours: z.boolean().default(false),
});
export type SaveBookingInput = z.input<typeof saveBookingSchema>;

/** Status changes staff can make from the booking card. `booked` undoes a check-in. */
export const BOOKING_STATUS_CHANGES = ['checked_in', 'booked', 'cancelled', 'no_show'] as const;
export type BookingStatusChange = (typeof BOOKING_STATUS_CHANGES)[number];
