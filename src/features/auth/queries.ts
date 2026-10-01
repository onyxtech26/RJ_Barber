import 'server-only';
import { connection } from 'next/server';
import { db } from '@/server/db';

export type LoginStaff = Awaited<ReturnType<typeof getLoginStaff>>[number];

/** Names shown on the sign-in screen. Public by design on a counter terminal — nothing sensitive. */
export async function getLoginStaff() {
  await connection();
  return db.query.staff.findMany({
    where: (s, { eq }) => eq(s.isActive, true),
    orderBy: (s, { asc }) => [asc(s.sortOrder), asc(s.name)],
    columns: { id: true, name: true, role: true },
  });
}
