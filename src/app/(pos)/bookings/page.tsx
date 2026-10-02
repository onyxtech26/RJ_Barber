import { BookingsBoard } from '@/features/bookings/components/bookings-board';
import { getBookingsDay, parseBookingDate } from '@/features/bookings/queries';
import { toBusinessDate } from '@/lib/business-date';

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const businessDate = parseBookingDate((await searchParams).date);
  const data = await getBookingsDay(businessDate);
  // Keyed by date so dialogs and selection reset when moving between days.
  return <BookingsBoard key={businessDate} data={data} businessDate={businessDate} today={toBusinessDate()} />;
}
