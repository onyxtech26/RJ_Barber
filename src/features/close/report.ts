import 'server-only';
import { eq } from 'drizzle-orm';
import { bookings, db, orders, type Db } from '@/server/db';

type Executor = Pick<Db, 'query'>;

export type DayReport = {
  businessDate: string;
  paid: { count: number; totalSen: number };
  duitnow: { count: number; totalSen: number };
  cash: { count: number; totalSen: number };
  discountSen: number;
  sstSen: number;
  voided: { count: number; totalSen: number };
  cancelledCount: number;
  pending: { count: number; totalSen: number };
  barbers: { barberId: string | null; name: string; services: number; salesSen: number; commissionSen: number }[];
  products: { name: string; quantity: number; salesSen: number }[];
  /** Missing on snapshots saved before bookings existed. */
  bookings?: { total: number; completed: number; noShow: number; cancelled: number; open: number };
};

/**
 * The numbers for one business day, built from paid sales only.
 * Barber sales are net of each line's share of the discount, and exclude SST.
 * Used both for the live preview and for the frozen snapshot saved at close.
 */
export async function buildDayReport(businessDate: string, executor: Executor = db): Promise<DayReport> {
  const rows = await executor.query.orders.findMany({
    where: eq(orders.businessDate, businessDate),
    columns: { status: true, paymentMethod: true, totalSen: true, discountSen: true, sstSen: true },
    with: {
      items: {
        columns: { kind: true, name: true, quantity: true, lineTotalSen: true, discountShareSen: true, commissionSen: true },
        with: { barber: { columns: { id: true, name: true } } },
      },
    },
  });

  const report: DayReport = {
    businessDate,
    paid: { count: 0, totalSen: 0 },
    duitnow: { count: 0, totalSen: 0 },
    cash: { count: 0, totalSen: 0 },
    discountSen: 0,
    sstSen: 0,
    voided: { count: 0, totalSen: 0 },
    cancelledCount: 0,
    pending: { count: 0, totalSen: 0 },
    barbers: [],
    products: [],
  };
  const barbers = new Map<string, DayReport['barbers'][number]>();
  const products = new Map<string, DayReport['products'][number]>();

  for (const order of rows) {
    if (order.status === 'awaiting_payment') {
      report.pending.count += 1;
      report.pending.totalSen += order.totalSen;
      continue;
    }
    if (order.status === 'voided') {
      report.voided.count += 1;
      report.voided.totalSen += order.totalSen;
      continue;
    }
    if (order.status === 'cancelled') {
      report.cancelledCount += 1;
      continue;
    }

    report.paid.count += 1;
    report.paid.totalSen += order.totalSen;
    const method = order.paymentMethod === 'duitnow' ? report.duitnow : report.cash;
    method.count += 1;
    method.totalSen += order.totalSen;
    report.discountSen += order.discountSen;
    report.sstSen += order.sstSen;

    for (const item of order.items) {
      const netSen = item.lineTotalSen - item.discountShareSen;
      const key = item.barber?.id ?? 'none';
      const barber = barbers.get(key) ?? {
        barberId: item.barber?.id ?? null,
        name: item.barber?.name ?? 'No barber',
        services: 0,
        salesSen: 0,
        commissionSen: 0,
      };
      if (item.kind === 'service') barber.services += item.quantity;
      barber.salesSen += netSen;
      barber.commissionSen += item.commissionSen;
      barbers.set(key, barber);

      if (item.kind === 'product') {
        const product = products.get(item.name) ?? { name: item.name, quantity: 0, salesSen: 0 };
        product.quantity += item.quantity;
        product.salesSen += netSen;
        products.set(item.name, product);
      }
    }
  }

  const dayBookings = await executor.query.bookings.findMany({
    where: eq(bookings.businessDate, businessDate),
    columns: { status: true },
  });
  report.bookings = {
    total: dayBookings.filter((b) => b.status !== 'cancelled').length,
    completed: dayBookings.filter((b) => b.status === 'completed').length,
    noShow: dayBookings.filter((b) => b.status === 'no_show').length,
    cancelled: dayBookings.filter((b) => b.status === 'cancelled').length,
    open: dayBookings.filter((b) => b.status === 'booked' || b.status === 'checked_in').length,
  };

  report.barbers = [...barbers.values()].sort((a, b) => b.salesSen - a.salesSen);
  report.products = [...products.values()].sort((a, b) => b.salesSen - a.salesSen);
  return report;
}
