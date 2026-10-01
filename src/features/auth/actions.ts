'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { logAudit } from '@/server/audit';
import { PIN_PATTERN } from '@/server/auth/pin';
import { attemptPin } from '@/server/auth/pin-attempt';
import { createSession, destroySession } from '@/server/auth/session';

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

  const result = await attemptPin(parsed.data.staffId, parsed.data.pin, 'login');
  if (!result.ok) return { error: result.error };

  await createSession(result.staffId);
  await logAudit({ actorId: result.staffId, action: 'auth.login', entity: 'staff', entityId: result.staffId });

  redirect('/');
}

export async function signOut() {
  const staffId = await destroySession();
  if (staffId) await logAudit({ actorId: staffId, action: 'auth.logout', entity: 'staff', entityId: staffId });
  redirect('/login');
}
