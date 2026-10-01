import 'server-only';
import { connection } from 'next/server';
import { db } from '@/server/db';
import { requireOwner } from '@/server/auth/session';

export async function getShopSettingsForEdit() {
  await connection();
  await requireOwner();
  const settings = await db.query.shopSettings.findFirst({ columns: { id: false, updatedAt: false } });
  if (!settings) throw new Error('Shop settings row is missing — run npm run db:setup.');
  return settings;
}
export type ShopSettingsForEdit = Awaited<ReturnType<typeof getShopSettingsForEdit>>;

/** Every category and item, including hidden ones, for the catalog editor. */
export async function getCatalogForEdit() {
  await connection();
  await requireOwner();
  return db.query.categories.findMany({
    orderBy: (c, { asc }) => [asc(c.sortOrder), asc(c.name)],
    with: {
      items: {
        orderBy: (i, { asc }) => [asc(i.sortOrder), asc(i.name)],
        columns: { createdAt: false, updatedAt: false },
      },
    },
  });
}
export type CatalogForEdit = Awaited<ReturnType<typeof getCatalogForEdit>>;

export async function getStaffForEdit() {
  await connection();
  const me = await requireOwner();
  const rows = await db.query.staff.findMany({
    orderBy: (s, { asc, desc }) => [desc(s.isActive), asc(s.sortOrder), asc(s.name)],
    columns: { pinHash: false, failedPinAttempts: false, createdAt: false, updatedAt: false },
  });
  const now = Date.now();
  return {
    me,
    rows: rows.map(({ lockedUntil, ...row }) => ({ ...row, isLocked: lockedUntil !== null && lockedUntil.getTime() > now })),
  };
}
export type StaffForEdit = Awaited<ReturnType<typeof getStaffForEdit>>['rows'][number];
