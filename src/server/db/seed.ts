import { randomInt } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { hashPin } from '../auth/pin';
import { db, IS_LOCAL_FILE, libsqlClient } from './client';
import {
  auditLog,
  bookingItems,
  bookings,
  catalogItems,
  categories,
  dayCloses,
  orderItems,
  orders,
  receiptCounters,
  sessions,
  shopSettings,
  staff,
  type NewCatalogItem,
} from './schema';

/*
 * Seeds a fresh database with shop settings, staff and a starter catalog.
 *   npm run db:seed          → only runs if there are no staff yet (safe on every start-up)
 *   npm run db:reset         → wipes ALL data first (development only)
 *
 * Catalog prices and staff names are placeholders — the owner edits them in Settings.
 * Initial PINs come from SEED_OWNER_PIN / SEED_STAFF_PIN, or are generated and written to
 * data/initial-pins.txt (gitignored) so they never appear in the repo or the console.
 */

async function main() {
  const reset = process.argv.includes('--reset');

  if (reset) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Refusing to reset the database in production.');
      process.exit(1);
    }
    await db.transaction(async (tx) => {
      for (const table of [sessions, auditLog, bookingItems, bookings, orderItems, orders, dayCloses, receiptCounters, catalogItems, categories, staff, shopSettings]) {
        await tx.delete(table);
      }
    });
    console.log('✓ Wiped existing data');
  }

  const existingStaff = await db.select({ id: staff.id }).from(staff).limit(1);
  if (existingStaff.length > 0) {
    console.log('✓ Database already has data — skipping seed');
    libsqlClient.close();
    process.exit(0);
  }

  // On a hosted database (Vercel build) a generated PIN file would vanish with the build machine,
  // leaving nobody able to sign in. Require the PINs to be set as environment variables instead.
  if (!IS_LOCAL_FILE && (!process.env.SEED_OWNER_PIN || !process.env.SEED_STAFF_PIN)) {
    console.error('Hosted database: set SEED_OWNER_PIN and SEED_STAFF_PIN (4–6 digits) before seeding.');
    process.exit(1);
  }

  const randomPin = () => String(randomInt(0, 1_000_000)).padStart(6, '0');
  const ownerPin = process.env.SEED_OWNER_PIN || randomPin();
  const staffPin = process.env.SEED_STAFF_PIN || randomPin();

  const CATALOG: Record<string, { name: string; priceRM: number; minutes?: number; kind?: 'product'; commissionBps?: number }[]> = {
    Haircuts: [
      { name: 'Haircut', priceRM: 25, minutes: 30 },
      { name: 'Skin Fade', priceRM: 30, minutes: 45 },
      { name: 'Buzz Cut', priceRM: 15, minutes: 15 },
      { name: 'Kids Haircut (under 12)', priceRM: 18, minutes: 20 },
    ],
    'Beard & Shave': [
      { name: 'Beard Trim', priceRM: 12, minutes: 15 },
      { name: 'Beard Sculpt & Line-up', priceRM: 18, minutes: 20 },
      { name: 'Hot Towel Shave', priceRM: 20, minutes: 30 },
    ],
    Packages: [
      { name: 'Haircut + Beard Trim', priceRM: 35, minutes: 45 },
      { name: 'Haircut + Hot Towel Shave', priceRM: 42, minutes: 60 },
      { name: 'Full Grooming (Cut, Shave, Wash)', priceRM: 55, minutes: 75 },
    ],
    Treatments: [
      { name: 'Hair Wash & Style', priceRM: 10, minutes: 15 },
      { name: 'Hair Colour (Black)', priceRM: 40, minutes: 45 },
      { name: 'Scalp Treatment', priceRM: 30, minutes: 30 },
    ],
    Products: [
      { name: 'Matte Clay Pomade', priceRM: 35, kind: 'product', commissionBps: 1000 },
      { name: 'Beard Oil', priceRM: 30, kind: 'product', commissionBps: 1000 },
      { name: 'Hair Tonic', priceRM: 25, kind: 'product', commissionBps: 1000 },
    ],
  };

  await db.transaction(async (tx) => {
    await tx.insert(shopSettings).values({
      id: 1,
      name: 'RJ Barber Salon',
      receiptFooter: 'Thank you! See you again.',
    });

    await tx.insert(staff).values([
      { name: 'RJ', role: 'owner', pinHash: await hashPin(ownerPin), isBarber: true, commissionBps: 0, sortOrder: 0 },
      { name: 'Barber 1', role: 'staff', pinHash: await hashPin(staffPin), isBarber: true, commissionBps: 5000, sortOrder: 1 },
      { name: 'Barber 2', role: 'staff', pinHash: await hashPin(staffPin), isBarber: true, commissionBps: 5000, sortOrder: 2 },
    ]);

    let categoryOrder = 0;
    for (const [categoryName, items] of Object.entries(CATALOG)) {
      const [category] = await tx
        .insert(categories)
        .values({ name: categoryName, sortOrder: categoryOrder++ })
        .returning({ id: categories.id });

      await tx.insert(catalogItems).values(
        items.map((item, i): NewCatalogItem => ({
          categoryId: category.id,
          name: item.name,
          kind: item.kind ?? 'service',
          priceSen: item.priceRM * 100,
        durationMinutes: item.minutes ?? 30,
          commissionBps: item.commissionBps ?? null,
          sortOrder: i,
        }))
      );
    }
  });

  if (!process.env.SEED_OWNER_PIN || !process.env.SEED_STAFF_PIN) {
    mkdirSync('data', { recursive: true });
    writeFileSync(
      'data/initial-pins.txt',
      [
        'RJ Barber POS — initial PINs (change these in Settings, then delete this file)',
        `Owner (RJ): ${ownerPin}`,
        `Staff (Barber 1, Barber 2): ${staffPin}`,
        '',
      ].join('\n')
    );
    console.log('✓ Seeded. Initial PINs written to data/initial-pins.txt');
  } else {
    console.log('✓ Seeded with PINs from SEED_OWNER_PIN / SEED_STAFF_PIN');
  }

  libsqlClient.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
