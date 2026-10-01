import Link from 'next/link';
import { Banknote, ChevronRight, QrCode, ReceiptText } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { OrderFilters } from '@/features/orders/components/order-filters';
import { StatusBadge } from '@/features/orders/components/status-badge';
import { getDaySummary, listOrders, parseOrderFilters, type DaySummary } from '@/features/orders/queries';
import { toBusinessDate } from '@/lib/business-date';
import { formatBusinessDate, formatTime } from '@/lib/format';
import { formatRM } from '@/lib/money';
import { cn } from '@/lib/utils';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseOrderFilters(await searchParams);
  const [{ rows, isSearch, limited }, summary] = await Promise.all([listOrders(filters), getDaySummary(filters.date)]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-4">
      <h1 className="text-xl font-bold">Orders</h1>

      <OrderFilters filters={filters} today={toBusinessDate()} />

      {!isSearch && <SummaryCards summary={summary} />}

      {rows.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={ReceiptText}
            title={isSearch ? 'No matching sales' : 'No sales for this day'}
            description={isSearch ? 'Try part of the receipt number, name or phone.' : 'Try another day or clear the filters.'}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/orders/${row.id}`}
                  className={cn(
                    'grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 p-3 transition-colors hover:bg-muted/60 sm:grid-cols-[5.5rem_1fr_auto_auto]',
                    (row.status === 'cancelled' || row.status === 'voided') && 'text-muted-foreground'
                  )}
                >
                  <div className="text-sm tabular-nums sm:row-span-1">
                    <p className="font-medium text-foreground">{formatTime(row.createdAt)}</p>
                    {isSearch && <p className="text-xs text-muted-foreground">{formatBusinessDate(row.businessDate)}</p>}
                  </div>
                  <div className="col-span-2 min-w-0 sm:col-span-1">
                    <p className="flex items-center gap-1.5 truncate font-medium text-foreground">
                      {row.paymentMethod === 'duitnow' ? (
                        <QrCode className="size-4 shrink-0" aria-label="DuitNow" />
                      ) : (
                        <Banknote className="size-4 shrink-0" aria-label="Cash" />
                      )}
                      {row.customerName ?? 'Walk-in'}
                      <span className="font-mono text-xs font-normal text-muted-foreground">{row.receiptNo}</span>
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {row.itemSummary}
                      {row.barberNames && ` · ${row.barberNames}`}
                    </p>
                  </div>
                  <StatusBadge status={row.status} className="justify-self-start sm:justify-self-end" />
                  <div className="flex items-center gap-1 justify-self-end">
                    <span
                      className={cn(
                        'font-semibold tabular-nums',
                        row.status === 'paid' ? 'text-foreground' : 'line-through decoration-1',
                        row.status === 'awaiting_payment' && 'no-underline'
                      )}
                    >
                      {formatRM(row.totalSen)}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {limited && (
            <p className="border-t p-3 text-center text-sm text-muted-foreground">
              Showing the 100 most recent matches. Type more of the receipt number to narrow it down.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCards({ summary }: { summary: DaySummary }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <Card label="Takings" value={formatRM(summary.paidTotalSen)} note={`${summary.paidCount} paid sales`} emphasis />
      <Card label="DuitNow" value={formatRM(summary.duitnowSen)} />
      <Card label="Cash" value={formatRM(summary.cashSen)} />
      <Card
        label="Not counted"
        value={formatRM(summary.pendingTotalSen + summary.voidedTotalSen)}
        note={[
          summary.pendingCount && `${summary.pendingCount} pending`,
          summary.voidedCount && `${summary.voidedCount} voided`,
          summary.cancelledCount && `${summary.cancelledCount} cancelled`,
        ]
          .filter(Boolean)
          .join(' · ') || 'Nothing pending or voided'}
        warn={summary.pendingCount > 0}
      />
    </div>
  );
}

function Card({
  label,
  value,
  note,
  emphasis,
  warn,
}: {
  label: string;
  value: string;
  note?: string;
  emphasis?: boolean;
  warn?: boolean;
}) {
  return (
    <div className={cn('rounded-xl border bg-card p-3', emphasis && 'border-brand bg-accent')}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      {note && <p className={cn('text-xs text-muted-foreground', warn && 'font-medium text-warning')}>{note}</p>}
    </div>
  );
}
