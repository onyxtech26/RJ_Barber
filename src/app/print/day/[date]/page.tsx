import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BrandLogo } from '@/components/brand-logo';
import { getCloseOverview, parseCloseDate } from '@/features/close/queries';
import { db } from '@/server/db';
import { formatBusinessDate, formatDateTime } from '@/lib/format';
import { formatRM } from '@/lib/money';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const metadata: Metadata = { title: 'Day report' };

/** A4 day report for the owner's records. Owner only (getCloseOverview checks). */
export default async function DayReportPrintPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const businessDate = parseCloseDate(date);
  if (businessDate !== date) notFound();

  const [{ report, close }, shop] = await Promise.all([
    getCloseOverview(businessDate),
    db.query.shopSettings.findFirst({ columns: { name: true } }),
  ]);

  return (
    <>
      <style>{`@page { size: A4; margin: 14mm; }`}</style>
      <article data-print-ready className="mx-auto max-w-[180mm] space-y-5 p-6 text-[12px] text-black tabular-nums print:p-0">
        <header className="flex items-center justify-between gap-4 border-b-2 border-black pb-3">
          <div>
            <p className="text-[18px] font-bold">{shop?.name ?? 'RJ Barber Salon'} — Day report</p>
            <p className="text-[14px]">{formatBusinessDate(businessDate)}</p>
            <p>
              {close
                ? `Closed by ${close.closedByName} on ${formatDateTime(close.closedAt)}`
                : 'NOT CLOSED — figures may still change'}
            </p>
          </div>
          <BrandLogo size={64} className="grayscale" />
        </header>

        <table className="w-full border-collapse">
          <tbody>
            <Line label="Takings (paid sales)" value={formatRM(report.paid.totalSen)} note={plural(report.paid.count, 'sale')} strong />
            <Line label="DuitNow — check against bank" value={formatRM(report.duitnow.totalSen)} note={plural(report.duitnow.count, 'payment')} />
            <Line label="Cash — should be in hand" value={formatRM(report.cash.totalSen)} note={plural(report.cash.count, 'payment')} />
            <Line label="Discounts given" value={formatRM(report.discountSen)} />
            {report.sstSen > 0 && <Line label="SST collected" value={formatRM(report.sstSen)} />}
            <Line label="Voided" value={formatRM(report.voided.totalSen)} note={`${report.voided.count} voided`} />
            <Line label="Cancelled (not charged)" value={String(report.cancelledCount)} />
            {report.pending.count > 0 && (
              <Line label="Still awaiting payment" value={formatRM(report.pending.totalSen)} note={plural(report.pending.count, 'sale')} />
            )}
          </tbody>
        </table>

        <section>
          <h2 className="mb-1 text-[14px] font-bold">Barbers</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="py-1 font-semibold">Barber</th>
                <th className="py-1 text-right font-semibold">Services</th>
                <th className="py-1 text-right font-semibold">Sales</th>
                <th className="py-1 text-right font-semibold">Commission</th>
              </tr>
            </thead>
            <tbody>
              {report.barbers.map((b) => (
                <tr key={b.barberId ?? 'none'} className="border-b border-black/20">
                  <td className="py-1">{b.name}</td>
                  <td className="py-1 text-right">{b.services}</td>
                  <td className="py-1 text-right">{formatRM(b.salesSen)}</td>
                  <td className="py-1 text-right font-semibold">{formatRM(b.commissionSen)}</td>
                </tr>
              ))}
              {report.barbers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-1">
                    No paid sales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="mt-1 text-[10px]">Sales are after discounts and before SST.</p>
        </section>

        {report.products.length > 0 && (
          <section>
            <h2 className="mb-1 text-[14px] font-bold">Products sold</h2>
            <table className="w-full border-collapse">
              <tbody>
                {report.products.map((p) => (
                  <tr key={p.name} className="border-b border-black/20">
                    <td className="py-1">
                      {p.quantity}× {p.name}
                    </td>
                    <td className="py-1 text-right">{formatRM(p.salesSen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {close?.notes && (
          <section>
            <h2 className="mb-1 text-[14px] font-bold">Notes</h2>
            <p>{close.notes}</p>
          </section>
        )}

        <footer className="grid grid-cols-2 gap-10 pt-10">
          <p className="border-t border-black pt-1">Checked by</p>
          <p className="border-t border-black pt-1">Date</p>
        </footer>
      </article>
    </>
  );
}

function Line({ label, value, note, strong }: { label: string; value: string; note?: string; strong?: boolean }) {
  return (
    <tr className={strong ? 'border-y-2 border-black text-[14px] font-bold' : 'border-b border-black/20'}>
      <td className="py-1.5">{label}</td>
      <td className="py-1.5 text-right text-[11px]">{note}</td>
      <td className="w-32 py-1.5 text-right">{value}</td>
    </tr>
  );
}
