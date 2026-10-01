'use server';

import { refresh } from 'next/cache';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db, orders } from '@/server/db';
import { logAudit } from '@/server/audit';
import { requireOwner } from '@/server/auth/session';
import type { ActionResult } from '@/features/pos/schemas';

const voidOrderSchema = z.object({
  orderId: z.string().min(1).max(64),
  reason: z.string().trim().min(3, 'Give a reason (at least 3 characters).').max(200),
});

/**
 * Owner only. Reverses a paid sale (the refund itself happens outside the system).
 * The sale stays on record as "voided" and stops counting toward takings and commission.
 * Not allowed once the day has been closed, so a closed day's report can't change underneath it.
 */
export async function voidOrder(input: z.input<typeof voidOrderSchema>): Promise<ActionResult<null>> {
  const me = await requireOwner();
  const parsed = voidOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const { orderId, reason } = parsed.data;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { status: true, dayCloseId: true, totalSen: true, receiptNo: true },
  });
  if (!order) return { ok: false, error: 'Sale not found.' };
  if (order.status !== 'paid') return { ok: false, code: 'stale', error: 'Only paid sales can be voided.' };
  if (order.dayCloseId) return { ok: false, error: 'This day is already closed, so its sales can’t be voided.' };

  const voided = await db.transaction(async (tx) => {
    const rows = await tx
      .update(orders)
      .set({ status: 'voided', voidedBy: me.id, voidedAt: new Date(), voidReason: reason })
      .where(and(eq(orders.id, orderId), eq(orders.status, 'paid'), isNull(orders.dayCloseId)))
      .returning({ id: orders.id });
    if (rows.length === 1) {
      await logAudit(
        {
          actorId: me.id,
          action: 'order.voided',
          entity: 'order',
          entityId: orderId,
          details: { receiptNo: order.receiptNo, totalSen: order.totalSen, reason },
        },
        tx
      );
    }
    return rows.length === 1;
  });
  if (!voided) return { ok: false, code: 'stale', error: 'This sale changed while you were looking at it. Refresh.' };

  refresh();
  return { ok: true, data: null };
}
