'use client';

import { useState } from 'react';
import { Banknote, Clock, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatRM } from '@/lib/money';
import { toBusinessDate } from '@/lib/business-date';
import { cn } from '@/lib/utils';
import type { PendingOrder } from '../queries';

const timeFormatter = new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', timeStyle: 'short' });
const dateTimeFormatter = new Intl.DateTimeFormat('en-MY', {
  timeZone: 'Asia/Kuala_Lumpur',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

/** Sales charged but not yet confirmed as paid. Tap one to finish taking payment. */
export function PendingTray({ orders, onResume }: { orders: PendingOrder[]; onResume: (order: PendingOrder) => void }) {
  const [open, setOpen] = useState(false);
  const today = toBusinessDate();

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className={cn('h-10', orders.length > 0 && 'border-warning/40 bg-warning-soft text-warning hover:bg-warning-soft')}
        onClick={() => setOpen(true)}
      >
        <Clock />
        Pending
        <span className="rounded-full bg-background/70 px-1.5 text-xs font-semibold tabular-nums">{orders.length}</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Waiting for payment</SheetTitle>
            <SheetDescription>Charged but not yet confirmed. Tap a sale to finish it.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {orders.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Nothing waiting. All sales are settled.</p>
            ) : (
              <ul className="space-y-2">
                {orders.map((order) => {
                  const isOld = toBusinessDate(order.createdAt) !== today;
                  return (
                    <li key={order.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          onResume(order);
                        }}
                        aria-label={`Resume ${order.receiptNo}, ${order.customerName ?? 'Walk-in'}, ${formatRM(order.totalSen)}`}
                        className="w-full rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 font-medium">
                              {order.paymentMethod === 'duitnow' ? (
                                <QrCode className="size-4 shrink-0" />
                              ) : (
                                <Banknote className="size-4 shrink-0" />
                              )}
                              {order.customerName ?? 'Walk-in'}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">{order.itemSummary}</p>
                            <p className={cn('text-xs', isOld ? 'font-medium text-destructive' : 'text-muted-foreground')}>
                              {order.receiptNo} ·{' '}
                              {isOld ? dateTimeFormatter.format(order.createdAt) : timeFormatter.format(order.createdAt)} ·{' '}
                              {order.createdByName}
                            </p>
                          </div>
                          <span className="text-lg font-semibold tabular-nums">{formatRM(order.totalSen)}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
