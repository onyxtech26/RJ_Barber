import Link from 'next/link';
import { AlertTriangle, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrintButton } from '@/components/print-button';
import { CloseDayButton, ReopenDayButton } from '@/features/close/components/close-day-actions';
import { getCloseOverview, parseCloseDate } from '@/features/close/queries';
import type { DayReport } from '@/features/close/report';
import { toBusinessDate } from '@/lib/business-date';
import { formatBusinessDate, formatDateTime, shiftBusinessDate } from '@/lib/format';
import { formatRM } from '@/lib/money';
import { cn } from '@/lib/utils';

export default async function DayClosePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const businessDate = parseCloseDate((await searchParams).date);
  const { report, close, unclosedDays } = await getCloseOverview(businessDate);
  const today = toBusinessDate();
  const dayLabel = businessDate === today ? 'today' : formatBusinessDate(businessDate);
  const hrefFor = (date: string) => (date === today ? '/close' : `/close?date=${date}`);

  const disabledReason =
    report.pending.count > 0
      ? `${report.pending.count} sale${report.pending.count === 1 ? '' : 's'} still waiting for payment`
      : report.paid.count + report.voided.count + report.cancelledCount === 0
        ? 'No sales on this day'
        : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">Day Close</h1>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-lg" className="size-10" asChild>
              <Link href={hrefFor(shiftBusinessDate(businessDate, -1))} aria-label="Previous day">
                <ChevronLeft />
              </Link>
            </Button>
            <span className="min-w-56 px-2 text-center font-medium">{formatBusinessDate(businessDate)}</span>
            {businessDate < today ? (
              <Button variant="outline" size="icon-lg" className="size-10" asChild>
                <Link href={hrefFor(shiftBusinessDate(businessDate, 1))} aria-label="Next day">
                  <ChevronRight />
                </Link>
              </Button>
            ) : (
              <span className="size-10" />
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <PrintButton url={`/print/day/${businessDate}`} label="Print report" />
          {close ? (
            <ReopenDayButton businessDate={businessDate} dayLabel={dayLabel} />
          ) : (
            <CloseDayButton
              businessDate={businessDate}
              dayLabel={dayLabel}
              duitnowSen={report.duitnow.totalSen}
              cashSen={report.cash.totalSen}
              disabledReason={disabledReason}
            />
          )}
        </div>
      </div>

      {unclosedDays.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-warning-soft p-3 text-sm text-warning">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="font-medium">Not closed yet:</span>
          {unclosedDays.map((date) => (
            <Link key={date} href={hrefFor(date)} className="font-semibold underline underline-offset-2">
              {formatBusinessDate(date)}
            </Link>
          ))}
        </div>
      )}

      {close && (
        <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success-soft p-3 text-sm text-success">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">
              Closed by {close.closedByName} · {formatDateTime(close.closedAt)}
            </p>
            {close.notes && <p className="text-foreground">“{close.notes}”</p>}
          </div>
        </div>
      )}

      {report.pending.count > 0 && (
        <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">
          {report.pending.count} sale{report.pending.count === 1 ? '' : 's'} ({formatRM(report.pending.totalSen)}) still
          waiting for payment. Finish or cancel {report.pending.count === 1 ? 'it' : 'them'} from the{' '}
          <Link href="/" className="font-semibold underline underline-offset-2">
            Terminal’s Pending tray
          </Link>{' '}
          before closing.
        </p>
      )}

      <ReportView report={report} />
    </div>
  );
}

function ReportView({ report }: { report: DayReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat label="Takings" value={formatRM(report.paid.totalSen)} note={`${report.paid.count} paid sales`} emphasis />
        <Stat
          label="DuitNow (check bank)"
          value={formatRM(report.duitnow.totalSen)}
          note={`${report.duitnow.count} payment${report.duitnow.count === 1 ? '' : 's'}`}
        />
        <Stat
          label="Cash (in hand)"
          value={formatRM(report.cash.totalSen)}
          note={`${report.cash.count} payment${report.cash.count === 1 ? '' : 's'}`}
        />
        <Stat
          label="Voided"
          value={formatRM(report.voided.totalSen)}
          note={`${report.voided.count} voided · ${report.cancelledCount} cancelled`}
        />
      </div>

      {report.bookings && report.bookings.total + report.bookings.cancelled > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-xl border bg-card p-3 text-sm">
          <span>
            Bookings: <span className="font-semibold tabular-nums">{report.bookings.total}</span>
          </span>
          <span>
            Completed: <span className="font-semibold tabular-nums">{report.bookings.completed}</span>
          </span>
          <span className={report.bookings.noShow > 0 ? 'text-destructive' : undefined}>
            No-shows: <span className="font-semibold tabular-nums">{report.bookings.noShow}</span>
          </span>
          <span>
            Cancelled: <span className="font-semibold tabular-nums">{report.bookings.cancelled}</span>
          </span>
          {report.bookings.open > 0 && (
            <span className="text-warning">
              Not yet seen: <span className="font-semibold tabular-nums">{report.bookings.open}</span>
            </span>
          )}
        </div>
      )}

      {(report.discountSen > 0 || report.sstSen > 0) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-xl border bg-card p-3 text-sm">
          <span>
            Discounts given: <span className="font-semibold tabular-nums">{formatRM(report.discountSen)}</span>
          </span>
          {report.sstSen > 0 && (
            <span>
              SST collected: <span className="font-semibold tabular-nums">{formatRM(report.sstSen)}</span>
            </span>
          )}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border bg-card">
        <h2 className="border-b p-3 font-semibold">Barbers</h2>
        {report.barbers.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No paid sales.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="p-3 font-medium">Barber</th>
                <th className="p-3 text-right font-medium">Services</th>
                <th className="p-3 text-right font-medium">Sales</th>
                <th className="p-3 text-right font-medium">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.barbers.map((b) => (
                <tr key={b.barberId ?? 'none'}>
                  <td className="p-3 font-medium">{b.name}</td>
                  <td className="p-3 text-right tabular-nums">{b.services}</td>
                  <td className="p-3 text-right tabular-nums">{formatRM(b.salesSen)}</td>
                  <td className="p-3 text-right font-semibold tabular-nums">{formatRM(b.commissionSen)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-muted/50 font-semibold">
              <tr>
                <td className="p-3">Total</td>
                <td className="p-3 text-right tabular-nums">{report.barbers.reduce((s, b) => s + b.services, 0)}</td>
                <td className="p-3 text-right tabular-nums">{formatRM(report.barbers.reduce((s, b) => s + b.salesSen, 0))}</td>
                <td className="p-3 text-right tabular-nums">
                  {formatRM(report.barbers.reduce((s, b) => s + b.commissionSen, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
        <p className="border-t p-3 text-xs text-muted-foreground">Sales are after discounts and before SST.</p>
      </section>

      {report.products.length > 0 && (
        <section className="overflow-hidden rounded-xl border bg-card">
          <h2 className="border-b p-3 font-semibold">Products sold</h2>
          <ul className="divide-y text-sm">
            {report.products.map((p) => (
              <li key={p.name} className="flex justify-between gap-3 p-3">
                <span>
                  {p.quantity}× {p.name}
                </span>
                <span className="tabular-nums">{formatRM(p.salesSen)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, note, emphasis }: { label: string; value: string; note?: string; emphasis?: boolean }) {
  return (
    <div className={cn('rounded-xl border bg-card p-3', emphasis && 'border-brand bg-accent')}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
