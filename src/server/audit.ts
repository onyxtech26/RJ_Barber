import 'server-only';
import { auditLog, db } from '@/server/db';

type DbOrTx = Pick<typeof db, 'insert'>;

export type AuditAction =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.pin_failed'
  | 'auth.locked'
  | 'order.created'
  | 'order.paid'
  | 'order.cancelled'
  | 'order.method_changed'
  | 'order.voided'
  | 'discount.approved';

/** Append-only record of who did what. Pass a transaction to log atomically with the change. */
export async function logAudit(
  entry: { actorId: string | null; action: AuditAction; entity?: string; entityId?: string; details?: unknown },
  executor: DbOrTx = db
) {
  await executor.insert(auditLog).values({
    actorId: entry.actorId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    details: entry.details ?? null,
  });
}
