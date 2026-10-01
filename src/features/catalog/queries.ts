import 'server-only';
import { connection } from 'next/server';
import { db } from '@/server/db';
import { requireStaff } from '@/server/auth/session';

export type CatalogCategory = Awaited<ReturnType<typeof getActiveCatalog>>[number];

/** Active categories with their active items, in display order. Always read at request time. */
export async function getActiveCatalog() {
  // Without this, Next would prerender the page at build time and freeze the prices.
  await connection();
  await requireStaff();

  const result = await db.query.categories.findMany({
    where: (c, { eq }) => eq(c.isActive, true),
    orderBy: (c, { asc }) => [asc(c.sortOrder), asc(c.name)],
    with: {
      items: {
        where: (i, { eq }) => eq(i.isActive, true),
        orderBy: (i, { asc }) => [asc(i.sortOrder), asc(i.name)],
        columns: { id: true, name: true, kind: true, priceSen: true },
      },
    },
    columns: { id: true, name: true },
  });

  return result.filter((category) => category.items.length > 0);
}
