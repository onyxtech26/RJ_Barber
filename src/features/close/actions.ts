'use server';

import { refresh } from 'next/cache';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db, dayCloses, orders } from '@/server/db';
import { libsqlClient, DATABASE_URL } from '@/server/db/client';
import { backupDatabase } from '@/server/db/backup-core';
import { logAudit } from '@/server/audit';
import { requireOwner } from '@/server/auth/session';
import { toBusinessDate } from '@/lib/business-date';
import type { ActionResult } from '@/features/pos/schemas';
import { buildDayReport } from './report';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((d) => d <= toBusinessDate(), 'You can’t close a day in the future.');

class CloseError extends Error {}

/**
 * Owner closes a business day: freezes the totals, links the day's sales to the close
 * (which blocks voids and new sales for that date), then takes a backup.
 */
export async function closeDay(input: { businessDate: string; notes?: string }): Promise<ActionResult<null>> {
  const me = await requireOwner();
  const parsed = z
    .object({ businessDate: dateSchema, notes: z.string().trim().max(500).optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const { businessDate, notes } = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const existing = await tx.query.dayCloses.findFirst({ where: eq(dayCloses.businessDate, businessDate) });
      if (existing) throw new CloseError('This day is already closed.');

      const report = await buildDayReport(businessDate, tx);
      if (report.pending.count > 0) {
        throw new CloseError(
          `${report.pending.count} sale${report.pending.count === 1 ? ' is' : 's are'} still waiting for payment. Confirm or cancel ${report.pending.count === 1 ? 'it' : 'them'} first.`
        );
      }
      if (report.paid.count + report.voided.count + report.cancelledCount === 0) {
        throw new CloseError('There are no sales on this day to close.');
      }

      const [close] = await tx
        .insert(dayCloses)
        .values({ businessDate, closedBy: me.id, totals: report, notes: notes || null })
        .returning({ id: dayCloses.id });
      await tx
        .update(orders)
        .set({ dayCloseId: close.id })
        .where(and(eq(orders.businessDate, businessDate), isNull(orders.dayCloseId)));
      await logAudit(
        {
          actorId: me.id,
          action: 'day.closed',
          entity: 'day',
          entityId: businessDate,
          details: { paidTotalSen: report.paid.totalSen, duitnowSen: report.duitnow.totalSen, cashSen: report.cash.totalSen },
        },
        tx
      );
    });
  } catch (error) {
    if (error instanceof CloseError) return { ok: false, error: error.message };
    throw error;
  }

  // Snapshot right after closing, so the day's sales are safe even if the PC is switched off.
  try {
    await backupDatabase(libsqlClient, DATABASE_URL, { label: `close-${businessDate}`, overwrite: true });
  } catch (error) {
    console.error('Backup after day close failed:', error);
  }

  refresh();
  return { ok: true, data: null };
}

/** Undo a close made by mistake. The previous snapshot is kept in the audit log. */
export async function reopenDay(input: { businessDate: string; reason: string }): Promise<ActionResult<null>> {
  const me = await requireOwner();
  const parsed = z
    .object({ businessDate: dateSchema, reason: z.string().trim().min(3, 'Give a reason (at least 3 characters).').max(200) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const { businessDate, reason } = parsed.data;

  const reopened = await db.transaction(async (tx) => {
    const close = await tx.query.dayCloses.findFirst({ where: eq(dayCloses.businessDate, businessDate) });
    if (!close) return false;
    await tx.update(orders).set({ dayCloseId: null }).where(eq(orders.dayCloseId, close.id));
    await tx.delete(dayCloses).where(eq(dayCloses.id, close.id));
    await logAudit(
      { actorId: me.id, action: 'day.reopened', entity: 'day', entityId: businessDate, details: { reason, previousTotals: close.totals } },
      tx
    );
    return true;
  });
  if (!reopened) return { ok: false, code: 'stale', error: 'This day isn’t closed.' };

  refresh();
  return { ok: true, data: null };
}
