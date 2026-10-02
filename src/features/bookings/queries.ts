import 'server-only';
import { connection } from 'next/server';
import { eq } from 'drizzle-orm';
import { bookings, db } from '@/server/db';
import { requireStaff } from '@/server/auth/session';
import { toBusinessDate } from '@/lib/business-date';
import { dateToShopTime } from '@/lib/scheduling';
import type { BookingStatus } from '@/lib/enums';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseBookingDate(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value)) ? value : toBusinessDate();
}

export type DayBooking = {
  id: string;
  barberId: string;
  customerName: string;
  customerPhone: string | null;
  notes: string | null;
  status: BookingStatus;
  orderId: string | null;
  startMinutes: number;
  endMinutes: number;
  items: { catalogItemId: string | null; name: string; durationMinutes: number }[];
  createdByName: string;
};

/** Everything the bookings day view needs: barbers with hours, the day's bookings, and bookable services. */
export async function getBookingsDay(businessDate: string) {
  await connection();
  const currentStaff = await requireStaff();

  const [barbers, rows, services] = await Promise.all([
    db.query.staff.findMany({
      where: (s, { and, eq }) => and(eq(s.isActive, true), eq(s.isBarber, true)),
      orderBy: (s, { asc }) => [asc(s.sortOrder), asc(s.name)],
      columns: { id: true, name: true, workingHours: true },
    }),
    db.query.bookings.findMany({
      where: eq(bookings.businessDate, businessDate),
      orderBy: (bk, { asc }) => asc(bk.startAt),
      with: {
        items: { orderBy: (i, { asc }) => asc(i.position) },
        createdByStaff: { columns: { name: true } },
      },
    }),
    db.query.catalogItems.findMany({
      where: (i, { and, eq }) => and(eq(i.isActive, true), eq(i.kind, 'service')),
      orderBy: (i, { asc }) => [asc(i.sortOrder), asc(i.name)],
      columns: { id: true, name: true, durationMinutes: true, priceSen: true },
    }),
  ]);

  const dayBookings: DayBooking[] = rows.map((row) => {
    const start = dateToShopTime(row.startAt);
    const end = dateToShopTime(row.endAt);
    return {
      id: row.id,
      barberId: row.barberId,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      notes: row.notes,
      status: row.status,
      orderId: row.orderId,
      startMinutes: start.minutes,
      // A booking ending exactly at midnight belongs to this day's 24:00.
      endMinutes: end.businessDate === businessDate ? end.minutes : 24 * 60,
      items: row.items.map((i) => ({ catalogItemId: i.catalogItemId, name: i.name, durationMinutes: i.durationMinutes })),
      createdByName: row.createdByStaff.name,
    };
  });

  return { currentStaff, barbers, bookings: dayBookings, services };
}
export type BookingsDay = Awaited<ReturnType<typeof getBookingsDay>>;

/** A booking about to be charged at the terminal: its customer, barber and services. */
export async function getBookingForSale(bookingId: string) {
  await requireStaff();
  const row = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
    with: { items: { orderBy: (i, { asc }) => asc(i.position) } },
  });
  if (!row || row.orderId || (row.status !== 'booked' && row.status !== 'checked_in')) return null;
  return {
    id: row.id,
    customerName: row.customerName,
    barberId: row.barberId,
    startMinutes: dateToShopTime(row.startAt).minutes,
    catalogItemIds: row.items.map((i) => i.catalogItemId).filter((id): id is string => id !== null),
  };
}
export type BookingForSale = NonNullable<Awaited<ReturnType<typeof getBookingForSale>>>;
