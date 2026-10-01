'use server';

import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, staff } from '@/server/db';
import { logAudit } from '@/server/audit';
import { PIN_PATTERN, verifyPin } from '@/server/auth/pin';
import { createSession, destroySession } from '@/server/auth/session';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

const signInSchema = z.object({
  staffId: z.string().min(1),
  pin: z.string().regex(PIN_PATTERN),
});

export type SignInState = { error?: string };

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    staffId: formData.get('staffId'),
    pin: formData.get('pin'),
  });
  if (!parsed.success) return { error: 'Enter your 4–6 digit PIN.' };
  const { staffId, pin } = parsed.data;

  const member = await db.query.staff.findFirst({
    where: (s, { and, eq }) => and(eq(s.id, staffId), eq(s.isActive, true)),
    columns: { id: true, pinHash: true, lockedUntil: true },
  });
  if (!member) return { error: 'This staff member is not available. Ask the owner.' };

  const now = Date.now();
  if (member.lockedUntil && member.lockedUntil.getTime() > now) {
    const minutes = Math.ceil((member.lockedUntil.getTime() - now) / 60_000);
    return { error: `Too many wrong PINs. Try again in ${minutes} min.` };
  }

  if (!(await verifyPin(pin, member.pinHash))) {
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
      await logAudit({ actorId: member.id, action: 'auth.locked', entity: 'staff', entityId: member.id });
      return { error: 'Too many wrong PINs. Locked for 5 minutes.' };
    }

    await logAudit({
      actorId: member.id,
      action: 'auth.pin_failed',
      entity: 'staff',
      entityId: member.id,
      details: { attempt: updated.attempts },
    });
    const left = MAX_FAILED_ATTEMPTS - updated.attempts;
    return { error: `Wrong PIN. ${left} ${left === 1 ? 'try' : 'tries'} left.` };
  }

  await db.update(staff).set({ failedPinAttempts: 0, lockedUntil: null }).where(eq(staff.id, member.id));
  await createSession(member.id);
  await logAudit({ actorId: member.id, action: 'auth.login', entity: 'staff', entityId: member.id });

  redirect('/');
}

export async function signOut() {
  const staffId = await destroySession();
  if (staffId) await logAudit({ actorId: staffId, action: 'auth.logout', entity: 'staff', entityId: staffId });
  redirect('/login');
}
