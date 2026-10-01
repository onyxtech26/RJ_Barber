'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRM, parseRM } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { TicketDiscount } from './terminal';

const QUICK_REASONS = ['Regular customer', 'Kids / senior', 'Promotion', 'Service recovery'];

export function DiscountDialog({
  open,
  initial,
  subtotalSen,
  approvalThresholdBps,
  needsApproval,
  onApply,
  onOpenChange,
}: {
  open: boolean;
  initial: TicketDiscount | null;
  subtotalSen: number;
  approvalThresholdBps: number;
  needsApproval: boolean;
  onApply: (discount: TicketDiscount) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Remount on open so the form starts from the current discount each time. */}
        {open && (
          <DiscountForm
            initial={initial}
            subtotalSen={subtotalSen}
            approvalThresholdBps={approvalThresholdBps}
            needsApproval={needsApproval}
            onApply={onApply}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DiscountForm({
  initial,
  subtotalSen,
  approvalThresholdBps,
  needsApproval,
  onApply,
}: {
  initial: TicketDiscount | null;
  subtotalSen: number;
  approvalThresholdBps: number;
  needsApproval: boolean;
  onApply: (discount: TicketDiscount) => void;
}) {
  const [type, setType] = useState<TicketDiscount['type']>(initial?.type ?? 'percent');
  const [rawValue, setRawValue] = useState(
    initial ? (initial.type === 'percent' ? String(initial.value / 100) : (initial.value / 100).toFixed(2)) : ''
  );
  const [reason, setReason] = useState(initial?.reason ?? '');

  // Percent is entered as a whole/decimal percent (10, 12.5) and stored as basis points.
  const value =
    type === 'percent'
      ? /^\d+(\.\d{1,2})?$/.test(rawValue.trim())
        ? Math.round(Number(rawValue) * 100)
        : null
      : parseRM(rawValue);

  const discountSen = value === null ? 0 : type === 'percent' ? Math.round((subtotalSen * value) / 10_000) : value;
  const discountBps = subtotalSen === 0 ? 0 : Math.round((discountSen * 10_000) / subtotalSen);

  let error: string | null = null;
  if (rawValue.trim() !== '' && (value === null || value <= 0)) error = 'Enter a valid amount.';
  else if (type === 'percent' && value !== null && value > 10_000) error = 'Can’t be more than 100%.';
  else if (type === 'amount' && value !== null && value > subtotalSen) error = 'Can’t be more than the subtotal.';

  const canApply = value !== null && value > 0 && !error && reason.trim().length > 0;
  const willNeedApproval = needsApproval && discountBps > approvalThresholdBps;

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canApply) onApply({ type, value: value!, reason: reason.trim() });
      }}
    >
      <DialogHeader>
        <DialogTitle>Discount</DialogTitle>
        <DialogDescription>Applies to the whole sale. Subtotal {formatRM(subtotalSen)}.</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {(['percent', 'amount'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setRawValue('');
            }}
            className={cn('h-9 rounded-md text-sm font-medium', type === t ? 'bg-card shadow-sm' : 'text-muted-foreground')}
          >
            {t === 'percent' ? 'Percent (%)' : 'Amount (RM)'}
          </button>
        ))}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="discount-value">{type === 'percent' ? 'Percent off' : 'Amount off (RM)'}</Label>
        <Input
          id="discount-value"
          value={rawValue}
          onChange={(e) => setRawValue(e.target.value)}
          inputMode="decimal"
          autoFocus
          placeholder={type === 'percent' ? 'e.g. 10' : 'e.g. 5.00'}
          className="h-12 text-lg tabular-nums"
        />
        <p className={cn('min-h-5 text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error ?? (discountSen > 0 ? `Customer saves ${formatRM(discountSen)}` : '')}
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="discount-reason">Reason</Label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={cn(
                'h-8 rounded-full border px-3 text-xs font-medium',
                reason === r ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <Input
          id="discount-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={120}
          placeholder="Or type a reason"
          className="h-10"
        />
      </div>

      {willNeedApproval && (
        <p className="rounded-lg bg-warning-soft p-3 text-sm text-warning">
          Over {approvalThresholdBps / 100}% — the owner’s PIN will be needed when you charge.
        </p>
      )}

      <DialogFooter>
        <Button type="submit" variant="brand" size="xl" disabled={!canApply} className="w-full sm:w-auto">
          Apply discount
        </Button>
      </DialogFooter>
    </form>
  );
}
