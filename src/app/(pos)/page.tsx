import { Terminal } from '@/features/pos/components/terminal';
import { getTerminalData } from '@/features/pos/queries';
import { getBookingForSale } from '@/features/bookings/queries';

export default async function TerminalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { booking: bookingParam } = await searchParams;
  const bookingId = typeof bookingParam === 'string' ? bookingParam.slice(0, 64) : null;
  const [data, booking] = await Promise.all([getTerminalData(), bookingId ? getBookingForSale(bookingId) : null]);
  // Not keyed by booking: after charging, the page re-renders without ?booking= and a remount would
  // lose the payment dialog. The terminal picks up a newly opened booking by itself.
  return <Terminal data={data} booking={booking} />;
}
