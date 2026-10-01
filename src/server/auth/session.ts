import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, gt, lt } from 'drizzle-orm';
import { db, sessions, staff, type StaffRole } from '@/server/db';

export const SESSION_COOKIE = 'rj_session';
const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000; // one long shift
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

/** What the rest of the app gets to know about the signed-in person. Never includes the PIN hash. */
export type CurrentStaff = {
  id: string;
  name: string;
  role: StaffRole;
  isBarber: boolean;
};

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(staffId: string) {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);

  // Housekeeping: drop expired sessions whenever someone signs in.
  await db.delete(sessions).where(lt(sessions.expiresAt, now));
  await db.insert(sessions).values({ id: hashToken(token), staffId, expiresAt, lastSeenAt: now });

  // Secure only when the browser really connected over HTTPS. Next sets x-forwarded-proto from the
  // actual connection, so plain http on the shop PC (or a tablet on the LAN) still gets a working cookie.
  const isHttps = (await headers()).get('x-forwarded-proto')?.split(',')[0].trim() === 'https';

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // page scripts can't read it
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    expires: expiresAt,
  });
}

/** Ends the current session (DB row and cookie). Returns the staff id it belonged to, if any. */
export async function destroySession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  cookieStore.delete(SESSION_COOKIE);
  if (!token) return null;

  const [deleted] = await db
    .delete(sessions)
    .where(eq(sessions.id, hashToken(token)))
    .returning({ staffId: sessions.staffId });
  return deleted?.staffId ?? null;
}

/** Signs a staff member out everywhere — used when they're deactivated or their PIN changes. */
export async function revokeAllSessions(staffId: string) {
  await db.delete(sessions).where(eq(sessions.staffId, staffId));
}

/**
 * The real auth check: looks the session up in the database on every request.
 * Wrapped in React's cache() so several calls during one render cost one query.
 */
export const getCurrentStaff = cache(async (): Promise<CurrentStaff | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const now = new Date();
  const [row] = await db
    .select({
      sessionId: sessions.id,
      lastSeenAt: sessions.lastSeenAt,
      id: staff.id,
      name: staff.name,
      role: staff.role,
      isBarber: staff.isBarber,
    })
    .from(sessions)
    .innerJoin(staff, eq(sessions.staffId, staff.id))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, now), eq(staff.isActive, true)))
    .limit(1);

  if (!row) return null;

  if (now.getTime() - row.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, row.sessionId));
  }

  return { id: row.id, name: row.name, role: row.role, isBarber: row.isBarber };
});

/** Use in every page, query and Server Action that needs a signed-in person. */
export async function requireStaff(): Promise<CurrentStaff> {
  const current = await getCurrentStaff();
  if (!current) redirect('/login');
  return current;
}

/** Owner-only areas (Day Close, Settings, voids). Staff are sent back to the terminal. */
export async function requireOwner(): Promise<CurrentStaff> {
  const current = await requireStaff();
  if (current.role !== 'owner') redirect('/');
  return current;
}
