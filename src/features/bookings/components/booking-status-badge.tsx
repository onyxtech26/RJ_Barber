import type { BookingStatus } from '@/lib/enums';
import { cn } from '@/lib/utils';

export const BOOKING_STATUS_STYLES: Record<BookingStatus, { label: string; badge: string; block: string }> = {
  booked: { label: 'Booked', badge: 'bg-accent text-foreground', block: 'border-brand bg-accent' },
  checked_in: { label: 'Arrived', badge: 'bg-success-soft text-success', block: 'border-success bg-success-soft' },
  completed: { label: 'Done', badge: 'bg-muted text-muted-foreground', block: 'border-border bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelled', badge: 'bg-muted text-muted-foreground', block: 'border-border bg-muted' },
  no_show: { label: 'No-show', badge: 'bg-destructive-soft text-destructive', block: 'border-destructive bg-destructive-soft' },
};

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const style = BOOKING_STATUS_STYLES[status];
  return (
    <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold', style.badge, className)}>
      {style.label}
    </span>
  );
}
