import 'server-only';
import { connection } from 'next/server';
import { eq } from 'drizzle-orm';
import { dayCloses, db, orders, type PaymentMethod } from '@/server/db';
import { toBusinessDate } from '@/lib/business-date';
import { requireStaff } from '@/server/auth/session';
import { getActiveCatalog } from '@/features/catalog/queries';

/** A sale waiting for payment confirmation, as shown in the Pending tray and the payment screen. */
export type PendingOrder = {
  id: string;
  receiptNo: string;
  totalSen: number;
  paymentMethod: PaymentMethod;
  customerName: string | null;
  createdAt: Date;
  createdByName: string;
  itemSummary: string;
};

/** Everything the terminal needs in one round trip. */
export async function getTerminalData() {
  await connection();
  const currentStaff = await requireStaff();

  const [catalog, barbers, owners, settings, pendingOrders, todayClose] = await Promise.all([
    getActiveCatalog(),
    db.query.staff.findMany({
      where: (s, { and, eq }) => and(eq(s.isActive, true), eq(s.isBarber, true)),
      orderBy: (s, { asc }) => [asc(s.sortOrder), asc(s.name)],
      columns: { id: true, name: true },
    }),
    db.query.staff.findMany({
      where: (s, { and, eq }) => and(eq(s.isActive, true), eq(s.role, 'owner')),
      orderBy: (s, { asc }) => [asc(s.sortOrder), asc(s.name)],
      columns: { id: true, name: true },
    }),
    db.query.shopSettings.findFirst({
      columns: {
        sstEnabled: true,
        sstRateBps: true,
        discountApprovalThresholdBps: true,
        duitnowQrPath: true,
        duitnowAccountName: true,
      },
    }),
    getPendingOrders(),
    db.query.dayCloses.findFirst({ where: eq(dayCloses.businessDate, toBusinessDate()), columns: { id: true } }),
  ]);

  return {
    currentStaff,
    catalog,
    barbers,
    owners,
    settings: {
      sstRateBps: settings?.sstEnabled ? settings.sstRateBps : 0,
      discountApprovalThresholdBps: settings?.discountApprovalThresholdBps ?? 2000,
      hasDuitnowQr: Boolean(settings?.duitnowQrPath),
      duitnowAccountName: settings?.duitnowAccountName ?? null,
    },
    pendingOrders,
    isTodayClosed: todayClose !== undefined,
  };
}
export type TerminalData = Awaited<ReturnType<typeof getTerminalData>>;
export type TerminalSettings = TerminalData['settings'];

/** All sales still waiting for payment, oldest first — including ones left over from earlier days. */
export async function getPendingOrders(): Promise<PendingOrder[]> {
  await requireStaff();
  const rows = await db.query.orders.findMany({
    where: (o, { eq }) => eq(o.status, 'awaiting_payment'),
    orderBy: (o, { asc }) => asc(o.createdAt),
    with: {
      items: { columns: { name: true, quantity: true }, orderBy: (i, { asc }) => asc(i.position) },
      createdByStaff: { columns: { name: true } },
    },
  });
  return rows.map(toPendingOrder);
}

export function toPendingOrder(row: {
  id: string;
  receiptNo: string;
  totalSen: number;
  paymentMethod: PaymentMethod;
  customerName: string | null;
  createdAt: Date;
  items: { name: string; quantity: number }[];
  createdByStaff: { name: string };
}): PendingOrder {
  return {
    id: row.id,
    receiptNo: row.receiptNo,
    totalSen: row.totalSen,
    paymentMethod: row.paymentMethod,
    customerName: row.customerName,
    createdAt: row.createdAt,
    createdByName: row.createdByStaff.name,
    itemSummary: row.items.map((i) => (i.quantity > 1 ? `${i.quantity}× ${i.name}` : i.name)).join(', '),
  };
}

/** Full receipt data for a sale. */
export async function getOrderReceipt(orderId: string) {
  await requireStaff();
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: {
        with: { barber: { columns: { name: true } } },
        orderBy: (i, { asc }) => asc(i.position),
      },
      createdByStaff: { columns: { name: true } },
      confirmedByStaff: { columns: { name: true } },
    },
  });
  if (!order) return null;

  return {
    id: order.id,
    receiptNo: order.receiptNo,
    status: order.status,
    paymentMethod: order.paymentMethod,
    customerName: order.customerName,
    lines: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPriceSen: i.unitPriceSen,
      lineTotalSen: i.lineTotalSen,
      barberName: i.barber?.name ?? null,
    })),
    subtotalSen: order.subtotalSen,
    discountSen: order.discountSen,
    discountReason: order.discountReason,
    sstRateBps: order.sstRateBps,
    sstSen: order.sstSen,
    totalSen: order.totalSen,
    cashReceivedSen: order.cashReceivedSen,
    changeSen: order.changeSen,
    paymentRef: order.paymentRef,
    createdAt: order.createdAt,
    createdByName: order.createdByStaff.name,
    confirmedAt: order.confirmedAt,
    confirmedByName: order.confirmedByStaff?.name ?? null,
  };
}
export type OrderReceipt = NonNullable<Awaited<ReturnType<typeof getOrderReceipt>>>;
