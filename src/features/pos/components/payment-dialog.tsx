'use client';

import { useState, useTransition } from 'react';
import { ArrowLeftRight, Banknote, CheckCircle2, Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PAYMENT_METHOD_LABELS } from '@/lib/enums';
import { formatRM, parseRM } from '@/lib/money';
import { cn } from '@/lib/utils';
import { cancelPendingOrder, changePaymentMethod, confirmPayment } from '../actions';
import type { OrderReceipt, PendingOrder, TerminalSettings } from '../queries';

/**
 * The money step. DuitNow: show the QR, wait for the bank notification, confirm.
 * Cash: enter what was handed over, see the change, confirm.
 * Closing without confirming leaves the sale in the Pending tray.
 */
export function PaymentDialog({
  order,
  settings,
  onClose,
  onPaid,
}: {
  order: PendingOrder | null;
  settings: TerminalSettings;
  onClose: () => void;
  onPaid: (receipt: OrderReceipt) => void;
}) {
  return (
    <Dialog open={order !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        {order && <PaymentBody key={order.id} initialOrder={order} settings={settings} onClose={onClose} onPaid={onPaid} />}
      </DialogContent>
    </Dialog>
  );
}

function PaymentBody({
  initialOrder,
  settings,
  onClose,
  onPaid,
}: {
  initialOrder: PendingOrder;
  settings: TerminalSettings;
  onClose: () => void;
  onPaid: (receipt: OrderReceipt) => void;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [paymentRef, setPaymentRef] = useState('');
  const [cashInput, setCashInput] = useState('');
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [isPending, startTransition] = useTransition();

  const cashReceivedSen = cashInput.trim() === '' ? order.totalSen : parseRM(cashInput);
  const changeSen = cashReceivedSen === null ? null : cashReceivedSen - order.totalSen;
  const cashValid = changeSen !== null && changeSen >= 0;

  const run = (fn: () => Promise<void>) => startTransition(fn);

  const handleConfirm = () =>
    run(async () => {
      const result = await confirmPayment({
        orderId: order.id,
        paymentRef: order.paymentMethod === 'duitnow' ? paymentRef : null,
        cashReceivedSen: order.paymentMethod === 'cash' ? cashReceivedSen : null,
      });
      if (!result.ok) {
        toast.error(result.error);
        if (result.code === 'stale') onClose();
        return;
      }
      onPaid(result.data);
    });

  const handleSwitch = () =>
    run(async () => {
      const next = order.paymentMethod === 'duitnow' ? 'cash' : 'duitnow';
      const result = await changePaymentMethod(order.id, next);
      if (!result.ok) {
        toast.error(result.error);
        if (result.code === 'stale') onClose();
        return;
      }
      setOrder(result.data);
      setCashInput('');
    });

  const handleCancel = () =>
    run(async () => {
      const result = await cancelPendingOrder(order.id);
      if (!result.ok) {
        toast.error(result.error);
        return onClose();
      }
      toast.success(`Sale ${order.receiptNo} cancelled`);
      onClose();
    });

  const quickCash = suggestCash(order.totalSen);

  return (
    <div className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {order.paymentMethod === 'duitnow' ? <QrCode className="size-5" /> : <Banknote className="size-5" />}
          {PAYMENT_METHOD_LABELS[order.paymentMethod]}
        </DialogTitle>
        <DialogDescription>
          {order.receiptNo}
          {order.customerName ? ` · ${order.customerName}` : ''} · {order.itemSummary}
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-xl bg-muted p-4 text-center">
        <p className="text-sm text-muted-foreground">Amount to pay</p>
        <p className="text-4xl font-bold tracking-tight tabular-nums">{formatRM(order.totalSen)}</p>
      </div>

      {order.paymentMethod === 'duitnow' ? (
        <div className="grid gap-4">
          <div className="flex flex-col items-center gap-2">
            {settings.hasDuitnowQr ? (
              // eslint-disable-next-line @next/next/no-img-element -- served from the local data folder, not optimisable
              <img src="/duitnow-qr" alt="Shop DuitNow QR code" className="size-64 rounded-xl border bg-white object-contain p-2" />
            ) : (
              <div className="flex size-64 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center text-sm text-muted-foreground">
                <QrCode className="size-10" />
                Shop DuitNow QR not set up yet. The owner can add it in Settings.
              </div>
            )}
            {settings.duitnowAccountName && <p className="text-sm font-medium">{settings.duitnowAccountName}</p>}
            <p className="text-center text-sm text-muted-foreground">
              Ask the customer to scan and pay {formatRM(order.totalSen)}, then check the bank notification.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="payment-ref">Reference (optional)</Label>
            <Input
              id="payment-ref"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              maxLength={40}
              placeholder="e.g. last 4 digits of the transaction"
              className="h-11"
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="cash-received">Cash received (RM)</Label>
            <Input
              id="cash-received"
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
              inputMode="decimal"
              autoFocus
              placeholder={(order.totalSen / 100).toFixed(2)}
              className="h-12 text-lg tabular-nums"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickCash label="Exact" active={cashInput === ''} onClick={() => setCashInput('')} />
            {quickCash.map((sen) => (
              <QuickCash
                key={sen}
                label={formatRM(sen)}
                active={cashReceivedSen === sen && cashInput !== ''}
                onClick={() => setCashInput((sen / 100).toFixed(2))}
              />
            ))}
          </div>
          <div
            className={cn(
              'flex items-center justify-between rounded-xl p-4',
              cashValid ? 'bg-success-soft text-success' : 'bg-destructive-soft text-destructive'
            )}
          >
            <span className="font-medium">{cashValid ? 'Change to give' : 'Not enough cash'}</span>
            <span className="text-2xl font-bold tabular-nums">{cashValid ? formatRM(changeSen!) : '—'}</span>
          </div>
        </div>
      )}

      <Button
        variant="brand"
        size="xl"
        className="h-14 text-lg"
        disabled={isPending || (order.paymentMethod === 'cash' && !cashValid)}
        onClick={handleConfirm}
      >
        {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
        {order.paymentMethod === 'duitnow' ? 'Payment received' : 'Cash received'}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <Button variant="outline" size="lg" className="h-10" disabled={isPending} onClick={handleSwitch}>
          <ArrowLeftRight />
          Switch to {order.paymentMethod === 'duitnow' ? 'cash' : 'DuitNow'}
        </Button>
        <div className="flex gap-2">
          {confirmingCancel ? (
            <Button variant="destructive" size="lg" className="h-10" disabled={isPending} onClick={handleCancel}>
              Yes, cancel sale
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="lg"
              className="h-10 text-destructive"
              disabled={isPending}
              onClick={() => setConfirmingCancel(true)}
            >
              Cancel sale
            </Button>
          )}
          <Button variant="ghost" size="lg" className="h-10" disabled={isPending} onClick={onClose}>
            Leave pending
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickCash({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-10 rounded-lg border px-3 text-sm font-medium tabular-nums',
        active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'
      )}
    >
      {label}
    </button>
  );
}

/** Likely notes handed over: next RM 10, RM 50 and RM 100 above the total. */
function suggestCash(totalSen: number): number[] {
  const roundUp = (step: number) => Math.ceil(totalSen / step) * step;
  return [...new Set([roundUp(1000), roundUp(5000), roundUp(10_000)])].filter((sen) => sen > totalSen);
}
