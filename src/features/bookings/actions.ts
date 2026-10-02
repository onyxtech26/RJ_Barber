'use server';

import { refresh } from 'next/cache';
import { and, eq, gt, inArray, lt, ne } from 'drizzle-orm';
import { z } from 'zod';
import { bookingItems, bookings, catalogItems, db, staff } from '@/server/db';
import { logAudit } from '@/server/audit';
import { requireStaff } from '@/server/auth/session';
import {
  dateToShopTime,
  formatTimeOfDay,
  parseTimeOfDay,
  shopTimeToDate,
  withinWorkingHours,
} from '@/lib/scheduling';
import type { ActionResult } from '@/features/pos/schemas';
import { BOOKING_STATUS_CHANGES, saveBookingSchema, type SaveBookingInput } from './schemas';

class BookingError extends Error {}

/** Statuses that occupy the barber's time. Cancelled / no-show / completed slots are free again. */
const ACTIVE = ['booked', 'checked_in'] as const;

/**
 * Create or reschedule a booking. The length is the sum of the chosen services' durations.
 * Double-booking is checked inside the write transaction, so two staff can't take the same slot.
 */
export async function saveBooking(input: SaveBookingInput): Promise<ActionResult<{ id: string }>> {
  const me = await requireStaff();
  const parsed = saveBookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const b = parsed.data;

  const startMinutes = parseTimeOfDay(b.startTime);
  if (startMinutes === null) return { ok: false, error: 'Choose a valid start time.' };

  const itemIds = [...new Set(b.itemIds)];
  const services = await db.query.catalogItems.findMany({
    where: and(inArray(catalogItems.id, itemIds), eq(catalogItems.isActive, true), eq(catalogItems.kind, 'service')),
    columns: { id: true, name: true, durationMinutes: true },
  });
  if (services.length !== itemIds.length) return { ok: false, code: 'stale', error: 'A service is no longer offered. Refresh.' };
  // Keep the order the staff picked them in.
  const ordered = itemIds.map((id) => services.find((s) => s.id === id)!);
  const endMinutes = startMinutes + ordered.reduce((sum, s) => sum + s.durationMinutes, 0);
  if (endMinutes > 24 * 60) return { ok: false, error: 'That booking would run past midnight.' };

  const barber = await db.query.staff.findFirst({
    where: and(eq(staff.id, b.barberId), eq(staff.isActive, true), eq(staff.isBarber, true)),
    columns: { id: true, name: true, workingHours: true },
  });
  if (!barber) return { ok: false, code: 'stale', error: 'That barber is no longer available.' };

  if (!b.allowOutsideHours && !withinWorkingHours(barber.workingHours, b.businessDate, startMinutes, endMinutes)) {
    return {
      ok: false,
      code: 'outside_hours',
      error: `${barber.name} isn’t working ${formatTimeOfDay(startMinutes)}–${formatTimeOfDay(endMinutes)} that day.`,
    };
  }

  const startAt = shopTimeToDate(b.businessDate, startMinutes);
  const endAt = shopTimeToDate(b.businessDate, endMinutes);

  try {
    const id = await db.transaction(async (tx) => {
      if (b.id) {
        const existing = await tx.query.bookings.findFirst({
          where: eq(bookings.id, b.id),
          columns: { status: true, orderId: true },
        });
        if (!existing) throw new BookingError('Booking not found.');
        if (!ACTIVE.includes(existing.status as (typeof ACTIVE)[number]) || existing.orderId) {
          throw new BookingError('This booking can no longer be changed.');
        }
      }

      const clash = await tx.query.bookings.findFirst({
        where: and(
          eq(bookings.barberId, barber.id),
          inArray(bookings.status, [...ACTIVE]),
          lt(bookings.startAt, endAt),
          gt(bookings.endAt, startAt),
          b.id ? ne(bookings.id, b.id) : undefined
        ),
        columns: { customerName: true, startAt: true, endAt: true },
      });
      if (clash) {
        const from = formatTimeOfDay(dateToShopTime(clash.startAt).minutes);
        const to = formatTimeOfDay(dateToShopTime(clash.endAt).minutes);
        throw new BookingError(`${barber.name} already has ${clash.customerName} ${from}–${to}.`);
      }

      const values = {
        businessDate: b.businessDate,
        startAt,
        endAt,
        barberId: barber.id,
        customerName: b.customerName,
        customerPhone: b.customerPhone ?? null,
        notes: b.notes ?? null,
      };
      let bookingId: string;
      if (b.id) {
        bookingId = b.id;
        await tx.update(bookings).set(values).where(eq(bookings.id, bookingId));
        await tx.delete(bookingItems).where(eq(bookingItems.bookingId, bookingId));
      } else {
        const [created] = await tx
          .insert(bookings)
          .values({ ...values, createdBy: me.id })
          .returning({ id: bookings.id });
        bookingId = created.id;
      }
      await tx.insert(bookingItems).values(
        ordered.map((s, position) => ({
          bookingId,
          catalogItemId: s.id,
          position,
          name: s.name,
          durationMinutes: s.durationMinutes,
        }))
      );
      await logAudit(
        {
          actorId: me.id,
          action: b.id ? 'booking.updated' : 'booking.created',
          entity: 'booking',
          entityId: bookingId,
          details: { date: b.businessDate, start: b.startTime, barber: barber.name, outsideHours: b.allowOutsideHours },
        },
        tx
      );
      return bookingId;
    });

    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    if (error instanceof BookingError) return { ok: false, error: error.message };
    throw error;
  }
}

const statusChangeSchema = z.object({
  bookingId: z.string().min(1).max(64),
  status: z.enum(BOOKING_STATUS_CHANGES),
});

/** Check in, undo check-in, cancel, or mark as no-show. Only for bookings not yet charged. */
export async function setBookingStatus(input: z.input<typeof statusChangeSchema>): Promise<ActionResult<null>> {
  const me = await requireStaff();
  const parsed = statusChangeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid request.' };
  const { bookingId, status } = parsed.data;

  // Which statuses each change may come from.
  const allowedFrom: Record<typeof status, readonly string[]> = {
    checked_in: ['booked'],
    booked: ['checked_in'],
    cancelled: ['booked', 'checked_in'],
    no_show: ['booked'],
  };

  const changed = await db.transaction(async (tx) => {
    const current = await tx.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      columns: { status: true, orderId: true },
    });
    if (!current || !allowedFrom[status].includes(current.status) || current.orderId) return false;

    await tx
      .update(bookings)
      .set({ status, statusChangedBy: me.id, statusChangedAt: new Date() })
      .where(and(eq(bookings.id, bookingId), eq(bookings.status, current.status)));
    await logAudit(
      { actorId: me.id, action: 'booking.status_changed', entity: 'booking', entityId: bookingId, details: { from: current.status, to: status } },
      tx
    );
    return true;
  });
  if (!changed) return { ok: false, code: 'stale', error: 'This booking changed or has already been charged. Refresh.' };

  refresh();
  return { ok: true, data: null };
}
