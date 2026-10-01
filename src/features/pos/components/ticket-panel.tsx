'use client';

import { Banknote, Loader2, Minus, Percent, Plus, QrCode, ShoppingCart, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/empty-state';
import type { PaymentMethod } from '@/lib/enums';
import { formatRM } from '@/lib/money';
import type { TicketTotals } from '@/lib/pricing';
import type { TicketDiscount, TicketLine } from './terminal';

type Barber = { id: string; name: string };

export function TicketPanel({
  lines,
  barbers,
  customerName,
  discount,
  totals,
  pricingError,
  sstRateBps,
  chargingMethod,
  onCustomerName,
  onQuantity,
  onBarber,
  onRemove,
  onClear,
  onEditDiscount,
  onRemoveDiscount,
  onCharge,
  pendingTray,
}: {
  lines: TicketLine[];
  barbers: Barber[];
  customerName: string;
  discount: TicketDiscount | null;
  totals: TicketTotals | null;
  pricingError: string | null;
  sstRateBps: number;
  chargingMethod: PaymentMethod | null;
  onCustomerName: (name: string) => void;
  onQuantity: (key: string, delta: number) => void;
  onBarber: (key: string, barberId: string | null) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  onEditDiscount: () => void;
  onRemoveDiscount: () => void;
  onCharge: (method: PaymentMethod) => void;
  pendingTray: React.ReactNode;
}) {
  const isEmpty = lines.length === 0;
  const canCharge = !isEmpty && totals !== null && totals.totalSen > 0 && chargingMethod === null;

  return (
    <aside className="flex min-h-0 flex-col border-t bg-card lg:border-t-0 lg:border-l">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <h2 className="pl-1 font-semibold">Current sale</h2>
        <div className="flex items-center gap-1">
          {pendingTray}
          {!isEmpty && (
            <Button variant="ghost" size="lg" className="h-10 text-muted-foreground" onClick={onClear}>
              <Trash2 />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="border-b p-3">
        <Input
          value={customerName}
          onChange={(e) => onCustomerName(e.target.value)}
          placeholder="Customer name (optional)"
          maxLength={60}
          className="h-10"
          aria-label="Customer name"
        />
      </div>

      <div className="min-h-40 flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState icon={ShoppingCart} title="No items yet" description="Tap a service or product to add it." />
        ) : (
          <ul className="divide-y">
            {lines.map((line) => (
              <li key={line.key} className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="leading-snug font-medium">{line.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{formatRM(line.unitPriceSen)} each</p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatRM(line.unitPriceSen * line.quantity)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={line.barberId ?? ''}
                    onChange={(e) => onBarber(line.key, e.target.value || null)}
                    aria-label={`Barber for ${line.name}`}
                    className={
                      'h-9 min-w-0 flex-1 rounded-lg border bg-background px-2 text-sm ' +
                      (line.kind === 'service' && !line.barberId ? 'border-destructive text-destructive' : '')
                    }
                  >
                    <option value="">{line.kind === 'service' ? 'Choose barber…' : 'No barber'}</option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center rounded-lg border">
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      onClick={() => onQuantity(line.key, -1)}
                      aria-label={`One less ${line.name}`}
                    >
                      <Minus />
                    </Button>
                    <span className="w-7 text-center font-medium tabular-nums">{line.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      onClick={() => onQuantity(line.key, 1)}
                      aria-label={`One more ${line.name}`}
                    >
                      <Plus />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    onClick={() => onRemove(line.key)}
                    aria-label={`Remove ${line.name}`}
                    className="text-muted-foreground"
                  >
                    <X />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t p-3">
        <dl className="space-y-1.5 text-sm">
          <Row label="Subtotal" value={formatRM(totals?.subtotalSen ?? 0)} />
          {discount ? (
            <div className="flex items-center justify-between gap-2">
              <dt className="flex min-w-0 items-center gap-1.5">
                <button type="button" onClick={onEditDiscount} className="truncate text-left underline-offset-2 hover:underline">
                  Discount{discount.type === 'percent' ? ` ${discount.value / 100}%` : ''} · {discount.reason}
                </button>
                <button
                  type="button"
                  onClick={onRemoveDiscount}
                  className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                  aria-label="Remove discount"
                >
                  <X className="size-3.5" />
                </button>
              </dt>
              <dd className="tabular-nums">-{formatRM(totals?.discountSen ?? 0)}</dd>
            </div>
          ) : (
            <button
              type="button"
              onClick={onEditDiscount}
              disabled={isEmpty}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <Percent className="size-3.5" />
              Add discount
            </button>
          )}
          {sstRateBps > 0 && <Row label={`SST ${sstRateBps / 100}%`} value={formatRM(totals?.sstSen ?? 0)} />}
        </dl>

        {pricingError && <p className="text-sm font-medium text-destructive">{pricingError}</p>}

        <div className="flex items-baseline justify-between border-t pt-3">
          <span className="font-medium">Total</span>
          <span className="text-3xl font-bold tracking-tight tabular-nums">{formatRM(totals?.totalSen ?? 0)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="brand" size="xl" className="h-14" disabled={!canCharge} onClick={() => onCharge('duitnow')}>
            {chargingMethod === 'duitnow' ? <Loader2 className="animate-spin" /> : <QrCode />}
            DuitNow
          </Button>
          <Button size="xl" className="h-14" disabled={!canCharge} onClick={() => onCharge('cash')}>
            {chargingMethod === 'cash' ? <Loader2 className="animate-spin" /> : <Banknote />}
            Cash
          </Button>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
