import 'server-only';
import { connection } from 'next/server';
import { and, desc, eq, or, sql, type SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { db, orders } from '@/server/db';
import { requireStaff } from '@/server/auth/session';
import { ORDER_STATUSES, PAYMENT_METHODS, type OrderStatus, type PaymentMethod } from '@/lib/enums';
import { toBusinessDate } from '@/lib/business-date';

export type OrderFilters = {
  date: string;
  status: OrderStatus | 'all';
  method: PaymentMethod | 'all';
  q: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SEARCH_LIMIT = 100;

/** Turns untrusted ?query=params into safe filters, falling back to sensible defaults. */
export function parseOrderFilters(params: Record<string, string | string[] | undefined>): OrderFilters {
  const one = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
  };
  const date = one('date');
  const status = one('status');
  const method = one('method');
  return {
    date: DATE_PATTERN.test(date) && !Number.isNaN(Date.parse(date)) ? date : toBusinessDate(),
    status: (ORDER_STATUSES as readonly string[]).includes(status) ? (status as OrderStatus) : 'all',
    method: (PAYMENT_METHODS as readonly string[]).includes(method) ? (method as PaymentMethod) : 'all',
    q: one('q').slice(0, 60),
  };
}

export type OrderListRow = Awaited<ReturnType<typeof listOrders>>['rows'][number];

/**
 * Orders for one business day, or — when searching — matching orders from any day.
 * Search covers receipt number, customer name and phone.
 */
export async function listOrders(filters: OrderFilters) {
  await connection();
  await requireStaff();

  const conditions: SQL[] = [];
  const isSearch = filters.q !== '';
  if (isSearch) {
    // Escape LIKE wildcards so "50%" searches for the text, not "50 followed by anything".
    const pattern = `%${filters.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conditions.push(
      or(
        containsText(orders.receiptNo, pattern),
        containsText(orders.customerName, pattern),
        containsText(orders.customerPhone, pattern)
      )!
    );
  } else {
    conditions.push(eq(orders.businessDate, filters.date));
  }
  if (filters.status !== 'all') conditions.push(eq(orders.status, filters.status));
  if (filters.method !== 'all') conditions.push(eq(orders.paymentMethod, filters.method));

  const rows = await db.query.orders.findMany({
    where: and(...conditions),
    orderBy: desc(orders.createdAt),
    limit: isSearch ? SEARCH_LIMIT : undefined,
    columns: {
      id: true,
      receiptNo: true,
      businessDate: true,
      status: true,
      paymentMethod: true,
      customerName: true,
      totalSen: true,
      createdAt: true,
    },
    with: {
      items: {
        columns: { name: true, quantity: true },
        orderBy: (i, { asc }) => asc(i.position),
        with: { barber: { columns: { name: true } } },
      },
    },
  });

  return {
    isSearch,
    limited: isSearch && rows.length === SEARCH_LIMIT,
    rows: rows.map((row) => ({
      id: row.id,
      receiptNo: row.receiptNo,
      businessDate: row.businessDate,
      status: row.status,
      paymentMethod: row.paymentMethod,
      customerName: row.customerName,
      totalSen: row.totalSen,
      createdAt: row.createdAt,
      itemSummary: row.items.map((i) => (i.quantity > 1 ? `${i.quantity}× ${i.name}` : i.name)).join(', '),
      barberNames: [...new Set(row.items.map((i) => i.barber?.name).filter(Boolean))].join(', '),
    })),
  };
}

// SQLite only treats "\" as an escape character in LIKE when the query says so explicitly.
// Case-insensitive for ASCII, which covers receipt numbers and most names.
function containsText(column: AnySQLiteColumn, pattern: string) {
  return sql`${column} LIKE ${pattern} ESCAPE ${'\\'}`;
}

/** Headline numbers for one business day. Only paid sales count as takings. */
export async function getDaySummary(date: string) {
  await requireStaff();
  const rows = await db.query.orders.findMany({
    where: eq(orders.businessDate, date),
    columns: { status: true, paymentMethod: true, totalSen: true },
  });

  const summary = {
    paidCount: 0,
    paidTotalSen: 0,
    duitnowSen: 0,
    cashSen: 0,
    pendingCount: 0,
    pendingTotalSen: 0,
    voidedCount: 0,
    voidedTotalSen: 0,
    cancelledCount: 0,
  };
  for (const row of rows) {
    if (row.status === 'paid') {
      summary.paidCount += 1;
      summary.paidTotalSen += row.totalSen;
      if (row.paymentMethod === 'duitnow') summary.duitnowSen += row.totalSen;
      else summary.cashSen += row.totalSen;
    } else if (row.status === 'awaiting_payment') {
      summary.pendingCount += 1;
      summary.pendingTotalSen += row.totalSen;
    } else if (row.status === 'voided') {
      summary.voidedCount += 1;
      summary.voidedTotalSen += row.totalSen;
    } else {
      summary.cancelledCount += 1;
    }
  }
  return summary;
}
export type DaySummary = Awaited<ReturnType<typeof getDaySummary>>;

/** Everything about one sale, for the detail page. Commission is only included for owners. */
export async function getOrderDetail(orderId: string) {
  await connection();
  const me = await requireStaff();

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: {
        orderBy: (i, { asc }) => asc(i.position),
        with: { barber: { columns: { name: true } } },
      },
      createdByStaff: { columns: { name: true } },
      confirmedByStaff: { columns: { name: true } },
      voidedByStaff: { columns: { name: true } },
    },
  });
  if (!order) return null;

  const [cancelledBy, approvedBy] = await Promise.all([
    order.cancelledBy
      ? db.query.staff.findFirst({ where: (s, { eq }) => eq(s.id, order.cancelledBy!), columns: { name: true } })
      : null,
    order.discountApprovedBy
      ? db.query.staff.findFirst({ where: (s, { eq }) => eq(s.id, order.discountApprovedBy!), columns: { name: true } })
      : null,
  ]);

  const isOwner = me.role === 'owner';
  return {
    viewerIsOwner: isOwner,
    id: order.id,
    receiptNo: order.receiptNo,
    businessDate: order.businessDate,
    status: order.status,
    paymentMethod: order.paymentMethod,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    lines: order.items.map((i) => ({
      id: i.id,
      name: i.name,
      kind: i.kind,
      quantity: i.quantity,
      unitPriceSen: i.unitPriceSen,
      lineTotalSen: i.lineTotalSen,
      barberName: i.barber?.name ?? null,
      commissionSen: isOwner ? i.commissionSen : null,
      commissionBps: isOwner ? i.commissionBps : null,
    })),
    subtotalSen: order.subtotalSen,
    discountType: order.discountType,
    discountValue: order.discountValue,
    discountSen: order.discountSen,
    discountReason: order.discountReason,
    discountApprovedByName: approvedBy?.name ?? null,
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
    cancelledAt: order.cancelledAt,
    cancelledByName: cancelledBy?.name ?? null,
    voidedAt: order.voidedAt,
    voidedByName: order.voidedByStaff?.name ?? null,
    voidReason: order.voidReason,
    isDayClosed: order.dayCloseId !== null,
  };
}
export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderDetail>>>;
