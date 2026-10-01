import type { OrderStatus } from '@/lib/enums';
import { cn } from '@/lib/utils';

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-success-soft text-success' },
  awaiting_payment: { label: 'Awaiting payment', className: 'bg-warning-soft text-warning' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
  voided: { label: 'Voided', className: 'bg-destructive-soft text-destructive' },
};

export const ORDER_STATUS_LABELS = Object.fromEntries(
  Object.entries(STYLES).map(([status, { label }]) => [status, label])
) as Record<OrderStatus, string>;

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const style = STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap',
        style.className,
        className
      )}
    >
      {style.label}
    </span>
  );
}
