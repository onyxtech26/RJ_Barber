import 'server-only';
import { connection } from 'next/server';
import { and, eq, isNull, lt, ne, sql } from 'drizzle-orm';
import { db, dayCloses, orders } from '@/server/db';
import { requireOwner } from '@/server/auth/session';
import { toBusinessDate } from '@/lib/business-date';
import { buildDayReport, type DayReport } from './report';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseCloseDate(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const today = toBusinessDate();
  if (!value || !DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value)) || value > today) return today;
  return value;
}

/** Live report for an open day, or the frozen snapshot for a closed one, plus days still waiting to be closed. */
export async function getCloseOverview(businessDate: string) {
  await connection();
  await requireOwner();

  const close = await db.query.dayCloses.findFirst({
    where: eq(dayCloses.businessDate, businessDate),
    with: { closedByStaff: { columns: { name: true } } },
  });

  const report: DayReport = close ? (close.totals as DayReport) : await buildDayReport(businessDate);

  // Earlier days that had real sales but were never closed — easy to forget after a busy weekend.
  const unclosed = await db
    .selectDistinct({ businessDate: orders.businessDate })
    .from(orders)
    .where(and(lt(orders.businessDate, toBusinessDate()), isNull(orders.dayCloseId), ne(orders.status, 'cancelled')))
    .orderBy(sql`${orders.businessDate} desc`)
    .limit(14);

  return {
    report,
    close: close
      ? { closedAt: close.closedAt, closedByName: close.closedByStaff.name, notes: close.notes }
      : null,
    unclosedDays: unclosed.map((d) => d.businessDate).filter((d) => d !== businessDate),
  };
}
