import { eq } from 'drizzle-orm';
import { toBusinessDate } from '../../lib/business-date';
import { priceTicket, type DiscountInput } from '../../lib/pricing';
import { db, libsqlClient } from './client';
import { catalogItems, orderItems, orders, receiptCounters, shopSettings, staff } from './schema';

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
  if (!process.env.DATABASE_URL?.includes('rj-pos-demo')) {
    throw new Error('demo-data only runs against the demo database (DATABASE_URL must point at demo/rj-pos-demo.db).');
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

  for (const [businessDate, lastSeq] of counters) {
    await db.insert(receiptCounters).values({ businessDate, lastSeq });
  }

  // Ship the demo as one self-contained file (no -wal/-shm side files).
  await libsqlClient.execute('PRAGMA journal_mode = DELETE');
  console.log(`✓ Demo data: ${SAMPLES.length} sample sales over ${counters.size} days, sample QR`);
  libsqlClient.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
