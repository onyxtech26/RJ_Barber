'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, type OrderStatus } from '@/lib/enums';
import { formatBusinessDate, shiftBusinessDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { OrderFilters as Filters } from '../queries';
import { ORDER_STATUS_LABELS } from './status-badge';

const STATUS_OPTIONS: (OrderStatus | 'all')[] = ['all', 'paid', 'awaiting_payment', 'voided', 'cancelled'];

/** Filters live in the URL, so refresh/back/bookmarks keep them and the server does the filtering. */
export function OrderFilters({ filters, today }: { filters: Filters; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);

  const navigate = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next };
    const params = new URLSearchParams();
    if (merged.date !== today) params.set('date', merged.date);
    if (merged.status !== 'all') params.set('status', merged.status);
    if (merged.method !== 'all') params.set('method', merged.method);
    if (merged.q) params.set('q', merged.q);
    const search = params.toString();
    startTransition(() => router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false }));
  };

  // Search as you type, but wait for a short pause so we don't query on every keystroke.
  useEffect(() => {
    if (query.trim() === filters.q) return;
    const timer = setTimeout(() => navigate({ q: query.trim() }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the typed text changes
  }, [query]);

  const isSearching = filters.q !== '';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className={cn('flex items-center gap-1', isSearching && 'pointer-events-none opacity-40')}>
          <Button
            variant="outline"
            size="icon-lg"
            className="size-11"
            onClick={() => navigate({ date: shiftBusinessDate(filters.date, -1) })}
            aria-label="Previous day"
          >
            <ChevronLeft />
          </Button>
          <label className="relative">
            <span className="sr-only">Date</span>
            <Input
              type="date"
              value={filters.date}
              max={today}
              onChange={(e) => e.target.value && navigate({ date: e.target.value })}
              className="h-11 w-44"
            />
          </label>
          <Button
            variant="outline"
            size="icon-lg"
            className="size-11"
            disabled={filters.date >= today}
            onClick={() => navigate({ date: shiftBusinessDate(filters.date, 1) })}
            aria-label="Next day"
          >
            <ChevronRight />
          </Button>
          {filters.date !== today && (
            <Button variant="ghost" size="lg" className="h-11" onClick={() => navigate({ date: today })}>
              Today
            </Button>
          )}
        </div>

        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search receipt no., customer or phone"
            className="h-11 pr-10 pl-9"
            aria-label="Search orders"
          />
          {isPending ? (
            <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : (
            query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((status) => (
          <Chip key={status} active={filters.status === status} onClick={() => navigate({ status })}>
            {status === 'all' ? 'All statuses' : ORDER_STATUS_LABELS[status]}
          </Chip>
        ))}
        <span className="mx-1 h-6 w-px bg-border" aria-hidden />
        {(['all', ...PAYMENT_METHODS] as const).map((method) => (
          <Chip key={method} active={filters.method === method} onClick={() => navigate({ method })}>
            {method === 'all' ? 'All methods' : PAYMENT_METHOD_LABELS[method]}
          </Chip>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {isSearching ? (
          <>
            Searching <span className="font-medium text-foreground">all dates</span> for “{filters.q}”
          </>
        ) : (
          formatBusinessDate(filters.date)
        )}
      </p>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-9 rounded-full px-3.5 text-sm font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'border bg-card text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}
