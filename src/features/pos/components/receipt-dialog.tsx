'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrintButton } from '@/components/print-button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PAYMENT_METHOD_LABELS } from '@/lib/enums';
import { formatRM } from '@/lib/money';
import type { OrderReceipt } from '../queries';

const timeFormatter = new Intl.DateTimeFormat('en-MY', {
  timeZone: 'Asia/Kuala_Lumpur',
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** Shown right after payment is confirmed, with a one-tap print of the 80mm receipt. */
export function ReceiptDialog({ receipt, onDone }: { receipt: OrderReceipt | null; onDone: () => void }) {
  return (
    <Dialog open={receipt !== null} onOpenChange={(open) => !open && onDone()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        {receipt && (
          <div className="grid gap-4">
            <DialogHeader className="items-center text-center">
              <CheckCircle2 className="size-12 text-success" />
              <DialogTitle className="text-xl">Paid {formatRM(receipt.totalSen)}</DialogTitle>
              <DialogDescription>
                {receipt.receiptNo} · {PAYMENT_METHOD_LABELS[receipt.paymentMethod]}
                {receipt.confirmedAt ? ` · ${timeFormatter.format(receipt.confirmedAt)}` : ''}
              </DialogDescription>
            </DialogHeader>

            {receipt.changeSen !== null && receipt.changeSen > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-success-soft p-4 text-success">
                <span className="font-medium">Change to give</span>
                <span className="text-2xl font-bold tabular-nums">{formatRM(receipt.changeSen)}</span>
              </div>
            )}

            <div className="rounded-xl border">
              <ul className="divide-y text-sm">
                {receipt.lines.map((line, i) => (
                  <li key={i} className="flex justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {line.quantity > 1 && `${line.quantity}× `}
                        {line.name}
                      </p>
                      {line.barberName && <p className="text-xs text-muted-foreground">{line.barberName}</p>}
                    </div>
                    <span className="tabular-nums">{formatRM(line.lineTotalSen)}</span>
                  </li>
                ))}
              </ul>
              <dl className="space-y-1 border-t p-3 text-sm">
                {(receipt.discountSen > 0 || receipt.sstSen > 0) && (
                  <Row label="Subtotal" value={formatRM(receipt.subtotalSen)} />
                )}
                {receipt.discountSen > 0 && (
                  <Row label={`Discount · ${receipt.discountReason}`} value={`-${formatRM(receipt.discountSen)}`} />
                )}
                {receipt.sstSen > 0 && <Row label={`SST ${receipt.sstRateBps / 100}%`} value={formatRM(receipt.sstSen)} />}
                <div className="flex justify-between pt-1 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatRM(receipt.totalSen)}</dd>
                </div>
                {receipt.cashReceivedSen !== null && (
                  <Row label="Cash received" value={formatRM(receipt.cashReceivedSen)} />
                )}
                {receipt.paymentRef && <Row label="Reference" value={receipt.paymentRef} />}
              </dl>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Confirmed by {receipt.confirmedByName}
            </p>

            <div className="grid grid-cols-[auto_1fr] gap-2">
              <PrintButton url={`/print/receipt/${receipt.id}`} label="Print" className="h-14 px-5" />
              <Button variant="brand" size="xl" className="h-14 text-lg" onClick={onDone} autoFocus>
                New sale
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
