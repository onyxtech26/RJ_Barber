import { eq } from 'drizzle-orm';
import { toBusinessDate } from '../../lib/business-date';
import { priceTicket, type DiscountInput } from '../../lib/pricing';
import { db, IS_LOCAL_FILE, libsqlClient } from './client';
import { bookingItems, bookings, catalogItems, orderItems, orders, receiptCounters, shopSettings, staff } from './schema';

/*
 * Adds realistic sample activity to a freshly seeded DEMO database (never the shop's real one):
 * yesterday's sales left unclosed (so a visitor can try Day Close), today's sales, one sale waiting
 * in the Pending tray, a void, a discount, a product sale, and a sample DuitNow QR.
 * Totals and commission go through the same priceTicket() the terminal uses.
 * Run by scripts/build-demo-db.ts — refuses to run against anything but the demo file.
 */

type SampleLine = { item: string; barber: string | null; quantity?: number };
type Sample = {
  daysAgo: number;
  time: [number, number]; // shop time (Malaysia)
  method: 'duitnow' | 'cash';
  lines: SampleLine[];
  customer?: string;
  discount?: DiscountInput & { reason: string };
  status?: 'paid' | 'awaiting_payment' | 'voided';
  cashReceivedRM?: number;
  ref?: string;
};

const SAMPLES: Sample[] = [
  // Yesterday
  { daysAgo: 1, time: [10, 12], method: 'cash', lines: [{ item: 'Haircut', barber: 'Barber 1' }], cashReceivedRM: 30 },
  { daysAgo: 1, time: [10, 48], method: 'duitnow', lines: [{ item: 'Skin Fade', barber: 'Barber 2' }, { item: 'Beard Trim', barber: 'Barber 2' }], customer: 'Hafiz', ref: '7731' },
  { daysAgo: 1, time: [11, 30], method: 'duitnow', lines: [{ item: 'Haircut + Hot Towel Shave', barber: 'RJ' }], customer: 'Daniel', ref: '0428' },
  { daysAgo: 1, time: [13, 5], method: 'cash', lines: [{ item: 'Kids Haircut (under 12)', barber: 'Barber 1', quantity: 2 }], customer: 'Mrs. Tan', discount: { type: 'percent', value: 1000, reason: 'Regular customer' }, cashReceivedRM: 40 },
  { daysAgo: 1, time: [15, 20], method: 'duitnow', lines: [{ item: 'Full Grooming (Cut, Shave, Wash)', barber: 'Barber 2' }, { item: 'Matte Clay Pomade', barber: 'Barber 2' }], customer: 'Arif', ref: '5512' },
  { daysAgo: 1, time: [16, 2], method: 'cash', lines: [{ item: 'Buzz Cut', barber: 'Barber 1' }], status: 'voided', cashReceivedRM: 20 },
  { daysAgo: 1, time: [17, 40], method: 'duitnow', lines: [{ item: 'Skin Fade', barber: 'RJ' }], ref: '9083' },
  // Today
  { daysAgo: 0, time: [10, 5], method: 'duitnow', lines: [{ item: 'Haircut + Beard Trim', barber: 'Barber 1' }], customer: 'Kumar', ref: '3360' },
  { daysAgo: 0, time: [10, 40], method: 'cash', lines: [{ item: 'Skin Fade', barber: 'Barber 2' }, { item: 'Beard Oil', barber: 'Barber 2' }], cashReceivedRM: 100 },
  { daysAgo: 0, time: [11, 15], method: 'duitnow', lines: [{ item: 'Hot Towel Shave', barber: 'RJ' }], customer: 'Wei Jie', status: 'awaiting_payment' },
];

type SampleBooking = {
  daysAgo: number; // negative = in the future
  time: [number, number];
  barber: string;
  customer: string;
  phone?: string;
  services: string[];
  status?: 'booked' | 'checked_in' | 'completed' | 'no_show' | 'cancelled';
  notes?: string;
};

const SAMPLE_BOOKINGS: SampleBooking[] = [
  // Yesterday
  { daysAgo: 1, time: [10, 45], barber: 'Barber 2', customer: 'Hafiz', phone: '012-555 0101', services: ['Skin Fade', 'Beard Trim'], status: 'completed' },
  { daysAgo: 1, time: [14, 0], barber: 'Barber 1', customer: 'Jason', phone: '016-555 0144', services: ['Haircut'], status: 'no_show' },
  // Today
  { daysAgo: 0, time: [11, 0], barber: 'Barber 2', customer: 'Farid', phone: '013-555 0120', services: ['Haircut'], status: 'no_show' },
  { daysAgo: 0, time: [12, 30], barber: 'Barber 1', customer: 'Ravi', phone: '017-555 0188', services: ['Haircut + Beard Trim'] },
  { daysAgo: 0, time: [14, 0], barber: 'Barber 2', customer: 'Amir', phone: '019-555 0133', services: ['Skin Fade', 'Beard Trim'], notes: 'Prefers a low fade' },
  { daysAgo: 0, time: [15, 30], barber: 'RJ', customer: 'Daniel', phone: '011-555 0190', services: ['Haircut + Hot Towel Shave'] },
  { daysAgo: 0, time: [16, 0], barber: 'Barber 1', customer: 'Mrs. Tan (2 kids)', phone: '012-555 0177', services: ['Kids Haircut (under 12)', 'Kids Haircut (under 12)'] },
  { daysAgo: 0, time: [18, 15], barber: 'Barber 2', customer: 'Kumar', services: ['Full Grooming (Cut, Shave, Wash)'] },
  // Tomorrow
  { daysAgo: -1, time: [10, 0], barber: 'RJ', customer: 'Arif', phone: '014-555 0102', services: ['Skin Fade'] },
  { daysAgo: -1, time: [11, 0], barber: 'Barber 1', customer: 'Wei Jie', services: ['Haircut', 'Hot Towel Shave'] },
  { daysAgo: -1, time: [13, 30], barber: 'Barber 2', customer: 'Hafiz', phone: '012-555 0101', services: ['Beard Sculpt & Line-up'] },
];

/** A Date for a wall-clock time in Malaysia (UTC+8, no daylight saving). */
function shopTime(businessDate: string, [hour, minute]: [number, number]) {
  const [y, m, d] = businessDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour - 8, minute));
}

function shiftDate(businessDate: string, days: number) {
  const d = new Date(`${businessDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// A QR-looking pattern clearly marked as a sample — not scannable, so nobody pays into it.
function sampleQrSvg() {
  const cells: string[] = [];
  const finder = (x: number, y: number) =>
    `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  for (let y = 0; y < 29; y++) {
    for (let x = 0; x < 29; x++) {
      const inFinder = (x < 8 && y < 8) || (x > 20 && y < 8) || (x < 8 && y > 20);
      if (!inFinder && ((x * 7 + y * 13 + x * y) % 5 < 2)) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 33 33" width="330" height="330" shape-rendering="crispEdges">
<rect x="-2" y="-2" width="33" height="33" fill="#fff"/>
<g fill="#000">${finder(0, 0)}${finder(22, 0)}${finder(0, 22)}${cells.join('')}</g>
<rect x="8.5" y="12" width="12" height="5" rx="1" fill="#f5c400"/>
<text x="14.5" y="15.6" font-family="Arial, sans-serif" font-size="3" font-weight="700" text-anchor="middle" fill="#141414">DEMO</text>
</svg>`;
}

async function main() {
  // Only ever the demo: the bundled demo file, or the hosted demo database during a Vercel build.
  const isDemoFile = process.env.DATABASE_URL?.includes('rj-pos-demo');
  const isHostedDemo = process.env.DEMO_DATA === '1' && process.env.VERCEL === '1' && !!process.env.TURSO_DATABASE_URL;
  if (!isDemoFile && !isHostedDemo) {
    throw new Error('demo-data only runs against the demo database (demo/rj-pos-demo.db or the hosted demo in a Vercel build).');
  }

  const items = new Map((await db.select().from(catalogItems)).map((i) => [i.name, i]));
  const people = new Map((await db.select().from(staff)).map((s) => [s.name, s]));
  const owner = [...people.values()].find((p) => p.role === 'owner')!;
  const today = toBusinessDate();
  const counters = new Map<string, number>();

  await db
    .update(shopSettings)
    .set({
      address: 'Demo address — Jalan Contoh 1, 50000 Kuala Lumpur',
      phone: '012-345 6789',
      duitnowAccountName: 'RJ BARBER SALON (DEMO)',
      duitnowQrImage: Buffer.from(sampleQrSvg()),
      duitnowQrType: 'image/svg+xml',
    })
    .where(eq(shopSettings.id, 1));

  for (const sample of SAMPLES) {
    const businessDate = shiftDate(today, -sample.daysAgo);
    const createdAt = shopTime(businessDate, sample.time);
    const seq = (counters.get(businessDate) ?? 0) + 1;
    counters.set(businessDate, seq);
    const receiptNo = `RJ-${businessDate.replaceAll('-', '')}-${String(seq).padStart(3, '0')}`;

    const resolved = sample.lines.map((line) => {
      const item = items.get(line.item);
      if (!item) throw new Error(`Sample item not in catalog: ${line.item}`);
      const barber = line.barber ? people.get(line.barber) ?? null : null;
      const commissionBps = barber ? (item.commissionBps ?? (item.kind === 'service' ? barber.commissionBps : 0)) : 0;
      return { item, barber, quantity: line.quantity ?? 1, commissionBps };
    });
    const totals = priceTicket(
      resolved.map((r) => ({ unitPriceSen: r.item.priceSen, quantity: r.quantity, commissionBps: r.commissionBps })),
      sample.discount ?? null,
      0
    );

    const status = sample.status ?? 'paid';
    const cashier = resolved[0].barber ?? owner;
    const confirmedAt = new Date(createdAt.getTime() + 3 * 60_000);
    const cashReceivedSen = sample.method === 'cash' && status !== 'awaiting_payment' ? (sample.cashReceivedRM ?? 0) * 100 : null;

    const id = crypto.randomUUID();
    await db.insert(orders).values({
      id,
      receiptNo,
      businessDate,
      status,
      paymentMethod: sample.method,
      customerName: sample.customer ?? null,
      subtotalSen: totals.subtotalSen,
      discountType: sample.discount?.type ?? null,
      discountValue: sample.discount?.value ?? null,
      discountSen: totals.discountSen,
      discountReason: sample.discount?.reason ?? null,
      sstRateBps: 0,
      sstSen: 0,
      totalSen: totals.totalSen,
      cashReceivedSen,
      changeSen: cashReceivedSen === null ? null : cashReceivedSen - totals.totalSen,
      paymentRef: sample.method === 'duitnow' && status !== 'awaiting_payment' ? (sample.ref ?? null) : null,
      createdBy: cashier.id,
      createdAt,
      confirmedBy: status === 'awaiting_payment' ? null : cashier.id,
      confirmedAt: status === 'awaiting_payment' ? null : confirmedAt,
      voidedBy: status === 'voided' ? owner.id : null,
      voidedAt: status === 'voided' ? new Date(confirmedAt.getTime() + 20 * 60_000) : null,
      voidReason: status === 'voided' ? 'Wrong service charged — refunded in cash' : null,
    });
    await db.insert(orderItems).values(
      resolved.map((r, i) => ({
        orderId: id,
        catalogItemId: r.item.id,
        position: i,
        kind: r.item.kind,
        name: r.item.name,
        unitPriceSen: r.item.priceSen,
        quantity: r.quantity,
        lineTotalSen: totals.lines[i].lineTotalSen,
        discountShareSen: totals.lines[i].discountShareSen,
        barberId: r.barber?.id ?? null,
        commissionBps: r.commissionBps,
        commissionSen: totals.lines[i].commissionSen,
      }))
    );
  }

  for (const sample of SAMPLE_BOOKINGS) {
    const businessDate = shiftDate(today, -sample.daysAgo);
    const barber = people.get(sample.barber);
    if (!barber) throw new Error(`Sample barber missing: ${sample.barber}`);
    const chosen = sample.services.map((name) => {
      const item = items.get(name);
      if (!item) throw new Error(`Sample service not in catalog: ${name}`);
      return item;
    });
    const startAt = shopTime(businessDate, sample.time);
    const endAt = new Date(startAt.getTime() + chosen.reduce((sum, i) => sum + i.durationMinutes, 0) * 60_000);
    const status = sample.status ?? 'booked';
    const [booking] = await db
      .insert(bookings)
      .values({
        businessDate,
        startAt,
        endAt,
        barberId: barber.id,
        customerName: sample.customer,
        customerPhone: sample.phone ?? null,
        notes: sample.notes ?? null,
        status,
        createdBy: owner.id,
        createdAt: new Date(startAt.getTime() - 2 * 24 * 60 * 60_000),
        statusChangedBy: status === 'booked' ? null : barber.id,
        statusChangedAt: status === 'booked' ? null : startAt,
      })
      .returning({ id: bookings.id });
    await db.insert(bookingItems).values(
      chosen.map((item, position) => ({
        bookingId: booking.id,
        catalogItemId: item.id,
        position,
        name: item.name,
        durationMinutes: item.durationMinutes,
      }))
    );
  }

  for (const [businessDate, lastSeq] of counters) {
    await db.insert(receiptCounters).values({ businessDate, lastSeq });
  }

  // Ship the demo as one self-contained file (no -wal/-shm side files).
  if (IS_LOCAL_FILE) await libsqlClient.execute('PRAGMA journal_mode = DELETE');
  console.log(`✓ Demo data: ${SAMPLES.length} sample sales, ${SAMPLE_BOOKINGS.length} bookings, sample QR`);
  libsqlClient.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
