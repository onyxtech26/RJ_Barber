import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Banknote, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrintButton } from '@/components/print-button';
import { StatusBadge } from '@/features/orders/components/status-badge';
import { VoidOrderButton } from '@/features/orders/components/void-order-button';
import { getOrderDetail, type OrderDetail } from '@/features/orders/queries';
import { PAYMENT_METHOD_LABELS } from '@/lib/enums';
import { formatBusinessDate, formatDateTime } from '@/lib/format';
import { formatRM } from '@/lib/money';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
      <Button variant="ghost" size="lg" className="-ml-2 h-10" asChild>
        <Link href={`/orders?date=${order.businessDate}`}>
          <ArrowLeft />
          {formatBusinessDate(order.businessDate)}
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-bold">{order.receiptNo}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            {order.paymentMethod === 'duitnow' ? <QrCode className="size-4" /> : <Banknote className="size-4" />}
            {PAYMENT_METHOD_LABELS[order.paymentMethod]}
            {' · '}
            {order.customerName ?? 'Walk-in'}
            {order.customerPhone && ` · ${order.customerPhone}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PrintButton url={`/print/receipt/${order.id}`} label="Print receipt" />
          <p className="text-3xl font-bold tracking-tight tabular-nums">{formatRM(order.totalSen)}</p>
        </div>
      </div>

      <OrderActions order={order} />

      <section className="overflow-hidden rounded-xl border bg-card">
        <ul className="divide-y">
          {order.lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-4 p-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {line.quantity > 1 && `${line.quantity}× `}
                  {line.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {line.barberName ?? 'No barber'}
                  {line.quantity > 1 && ` · ${formatRM(line.unitPriceSen)} each`}
                  {line.commissionSen !== null &&
                    ` · commission ${formatRM(line.commissionSen)} (${(line.commissionBps ?? 0) / 100}%)`}
                </p>
              </div>
              <span className="tabular-nums">{formatRM(line.lineTotalSen)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 border-t p-3 text-sm">
          <Row label="Subtotal" value={formatRM(order.subtotalSen)} />
          {order.discountSen > 0 && (
            <Row
              label={`Discount${order.discountType === 'percent' ? ` ${(order.discountValue ?? 0) / 100}%` : ''} · ${order.discountReason}${
                order.discountApprovedByName ? ` (approved by ${order.discountApprovedByName})` : ''
              }`}
              value={`-${formatRM(order.discountSen)}`}
            />
          )}
          {order.sstSen > 0 && <Row label={`SST ${order.sstRateBps / 100}%`} value={formatRM(order.sstSen)} />}
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatRM(order.totalSen)}</dd>
          </div>
          {order.cashReceivedSen !== null && (
            <>
              <Row label="Cash received" value={formatRM(order.cashReceivedSen)} />
              <Row label="Change given" value={formatRM(order.changeSen ?? 0)} />
            </>
          )}
          {order.paymentRef && <Row label="DuitNow reference" value={order.paymentRef} />}
        </dl>
      </section>

      <section className="rounded-xl border bg-card p-3">
        <h2 className="mb-2 text-sm font-semibold">History</h2>
        <ol className="space-y-2 text-sm">
          <TimelineItem at={order.createdAt} text={`Charged by ${order.createdByName}`} />
          {order.confirmedAt && <TimelineItem at={order.confirmedAt} text={`Payment confirmed by ${order.confirmedByName}`} />}
          {order.cancelledAt && <TimelineItem at={order.cancelledAt} text={`Cancelled by ${order.cancelledByName}`} />}
          {order.voidedAt && (
            <TimelineItem at={order.voidedAt} text={`Voided by ${order.voidedByName} — “${order.voidReason}”`} danger />
          )}
        </ol>
      </section>
    </div>
  );
}

function OrderActions({ order }: { order: OrderDetail }) {
  if (order.status === 'awaiting_payment') {
    return (
      <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">
        Still waiting for payment. Open it from the <span className="font-semibold">Pending</span> tray on the{' '}
        <Link href="/" className="font-semibold underline underline-offset-2">
          Terminal
        </Link>{' '}
        to take payment or cancel.
      </p>
    );
  }
  if (order.status !== 'paid') return null;
  if (order.isDayClosed) {
    return <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">This day is closed. The sale can’t be voided.</p>;
  }
  if (!order.viewerIsOwner) {
    return <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Need to reverse this sale? Ask the owner to void it.</p>;
  }
  return (
    <div className="flex justify-end">
      <VoidOrderButton orderId={order.id} receiptNo={order.receiptNo} totalSen={order.totalSen} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="shrink-0 tabular-nums">{value}</dd>
    </div>
  );
}

function TimelineItem({ at, text, danger }: { at: Date; text: string; danger?: boolean }) {
  return (
    <li className="flex gap-3">
      <span className="w-40 shrink-0 text-muted-foreground tabular-nums">{formatDateTime(at)}</span>
      <span className={danger ? 'font-medium text-destructive' : undefined}>{text}</span>
    </li>
  );
}
