import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db, staff } from '@/server/db';
import { logAudit } from '@/server/audit';
import { verifyPin } from './pin';

// One place that checks a PIN and applies the lockout, used by sign-in AND by owner approvals.
// Sharing it matters: otherwise the discount-approval box would let staff guess the owner's PIN
// without ever being locked out.

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

export type PinAttemptResult =
  | { ok: true; staffId: string }
  | { ok: false; error: string };

export async function attemptPin(staffId: string, pin: string, purpose: 'login' | 'approval'): Promise<PinAttemptResult> {
  const member = await db.query.staff.findFirst({
    where: (s, { and, eq }) => and(eq(s.id, staffId), eq(s.isActive, true)),
    columns: { id: true, pinHash: true, lockedUntil: true },
  });
  if (!member) return { ok: false, error: 'This staff member is not available. Ask the owner.' };

  const now = Date.now();
  if (member.lockedUntil && member.lockedUntil.getTime() > now) {
    const minutes = Math.ceil((member.lockedUntil.getTime() - now) / 60_000);
    return { ok: false, error: `Too many wrong PINs. Try again in ${minutes} min.` };
  }

  if (await verifyPin(pin, member.pinHash)) {
    await db.update(staff).set({ failedPinAttempts: 0, lockedUntil: null }).where(eq(staff.id, member.id));
    return { ok: true, staffId: member.id };
  }

  // Increment in SQL so the count can't be lost between read and write.
  const [updated] = await db
    .update(staff)
    .set({ failedPinAttempts: sql`${staff.failedPinAttempts} + 1` })
    .where(eq(staff.id, member.id))
    .returning({ attempts: staff.failedPinAttempts });

  if (updated.attempts >= MAX_FAILED_ATTEMPTS) {
    await db
      .update(staff)
      .set({ failedPinAttempts: 0, lockedUntil: new Date(now + LOCKOUT_MS) })
      .where(eq(staff.id, member.id));
    await logAudit({ actorId: member.id, action: 'auth.locked', entity: 'staff', entityId: member.id, details: { purpose } });
    return { ok: false, error: 'Too many wrong PINs. Locked for 5 minutes.' };
  }

  await logAudit({
    actorId: member.id,
    action: 'auth.pin_failed',
    entity: 'staff',
    entityId: member.id,
    details: { attempt: updated.attempts, purpose },
  });
  const left = MAX_FAILED_ATTEMPTS - updated.attempts;
  return { ok: false, error: `Wrong PIN. ${left} ${left === 1 ? 'try' : 'tries'} left.` };
}
