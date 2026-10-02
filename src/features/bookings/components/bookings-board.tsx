'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/empty-state';
import { formatBusinessDate, shiftBusinessDate } from '@/lib/format';
import {
  dateToShopTime,
  dayRange,
  DEFAULT_WEEKLY_HOURS,
  formatTimeOfDay,
  SLOT_MINUTES,
  weekdayOf,
} from '@/lib/scheduling';
import { cn } from '@/lib/utils';
import type { BookingsDay, DayBooking } from '../queries';
import { BookingCard } from './booking-card';
import { BookingDialog, type BookingDraft } from './booking-dialog';
import { BOOKING_STATUS_STYLES, BookingStatusBadge } from './booking-status-badge';

const ROW_PX = 28; // height of one 15-minute slot
const ON_GRID = new Set(['booked', 'checked_in', 'completed']);

export function BookingsBoard({ data, businessDate, today }: { data: BookingsDay; businessDate: string; today: string }) {
  const router = useRouter();
  const { barbers, bookings, services } = data;
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = bookings.find((b) => b.id === selectedId) ?? null;
  const isToday = businessDate === today;

  // Visible hours: everyone's working hours, widened to fit any booking made outside them.
  const range = useMemo(() => {
    const base = dayRange(barbers.map((b) => b.workingHours), businessDate) ?? { start: 10 * 60, end: 21 * 60 };
    const shown = bookings.filter((b) => ON_GRID.has(b.status));
    const start = Math.min(base.start, ...shown.map((b) => b.startMinutes));
    const end = Math.max(base.end, ...shown.map((b) => b.endMinutes));
    return { start: Math.floor(start / 60) * 60, end: Math.ceil(end / 60) * 60 };
  }, [barbers, bookings, businessDate]);
  const slots = Array.from({ length: (range.end - range.start) / SLOT_MINUTES }, (_, i) => range.start + i * SLOT_MINUTES);

  // The red "now" line, only on today's view. Set after mount so server and browser render the same.
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);
  useEffect(() => {
    if (!isToday) return;
    const tick = () => setNowMinutes(dateToShopTime(new Date()).minutes);
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [isToday]);

  const goTo = (date: string) => router.push(date === today ? '/bookings' : `/bookings?date=${date}`);
  const firstOpenSlot = () => {
    const base = nowMinutes !== null ? Math.ceil(nowMinutes / SLOT_MINUTES) * SLOT_MINUTES : range.start;
    return Math.min(Math.max(base, range.start), range.end - SLOT_MINUTES);
  };

  const offToday = barbers.filter((b) => (b.workingHours ?? DEFAULT_WEEKLY_HOURS)[weekdayOf(businessDate)] === null);
  const sidelined = bookings.filter((b) => !ON_GRID.has(b.status));
  const active = bookings.filter((b) => b.status === 'booked' || b.status === 'checked_in');

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-2 text-xl font-bold">Bookings</h1>
          <Button variant="outline" size="icon-lg" className="size-10" onClick={() => goTo(shiftBusinessDate(businessDate, -1))} aria-label="Previous day">
            <ChevronLeft />
          </Button>
          <Input
            type="date"
            value={businessDate}
            onChange={(e) => e.target.value && goTo(e.target.value)}
            className="h-10 w-44"
            aria-label="Date"
          />
          <Button variant="outline" size="icon-lg" className="size-10" onClick={() => goTo(shiftBusinessDate(businessDate, 1))} aria-label="Next day">
            <ChevronRight />
          </Button>
          {!isToday && (
            <Button variant="ghost" size="lg" className="h-10" onClick={() => goTo(today)}>
              Today
            </Button>
          )}
        </div>
        <Button
          variant="brand"
          size="lg"
          className="h-11"
          disabled={barbers.length === 0}
          onClick={() => setDraft({ booking: null, businessDate, barberId: barbers[0].id, startMinutes: firstOpenSlot() })}
        >
          <Plus />
          New booking
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {formatBusinessDate(businessDate)} · {active.length} upcoming
        {offToday.length > 0 && ` · Off today: ${offToday.map((b) => b.name).join(', ')}`}
      </p>

      {barbers.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState icon={CalendarDays} title="No barbers yet" description="The owner can add barbers in Settings → Staff." />
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border bg-card lg:max-h-[calc(100dvh-13rem)]">
          <div className="grid min-w-max" style={{ gridTemplateColumns: `4rem repeat(${barbers.length}, minmax(11rem, 1fr))` }}>
            {/* Header row */}
            <div className="sticky top-0 z-20 border-b bg-card" />
            {barbers.map((b) => (
              <div key={b.id} className="sticky top-0 z-20 border-b border-l bg-card px-3 py-2 text-sm font-semibold">
                {b.name}
              </div>
            ))}

            {/* Time gutter */}
            <div className="relative" style={{ height: slots.length * ROW_PX }}>
              {slots
                .filter((m) => m % 60 === 0)
                .map((m) => (
                  <span key={m} className="absolute right-2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums" style={{ top: ((m - range.start) / SLOT_MINUTES) * ROW_PX }}>
                    {m === range.start ? '' : formatTimeOfDay(m).replace(':00', '')}
                  </span>
                ))}
            </div>

            {/* One column per barber */}
            {barbers.map((barber) => {
              const hours = (barber.workingHours ?? DEFAULT_WEEKLY_HOURS)[weekdayOf(businessDate)];
              const isWorking = (m: number) => hours !== null && m >= hours.start && m < hours.end;
              return (
                <div key={barber.id} className="relative border-l" style={{ height: slots.length * ROW_PX }}>
                  {slots.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDraft({ booking: null, businessDate, barberId: barber.id, startMinutes: m })}
                      aria-label={`Book ${barber.name} at ${formatTimeOfDay(m)}`}
                      className={cn(
                        'absolute inset-x-0 block border-t transition-colors hover:bg-accent/60',
                        m % 60 === 0 ? 'border-border' : 'border-border/40',
                        !isWorking(m) && 'bg-[repeating-linear-gradient(135deg,var(--muted),var(--muted)_6px,transparent_6px,transparent_12px)]'
                      )}
                      style={{ top: ((m - range.start) / SLOT_MINUTES) * ROW_PX, height: ROW_PX }}
                    />
                  ))}

                  {bookings
                    .filter((b) => b.barberId === barber.id && ON_GRID.has(b.status))
                    .map((b) => (
                      <BookingBlock key={b.id} booking={b} rangeStart={range.start} onOpen={() => setSelectedId(b.id)} />
                    ))}

                  {nowMinutes !== null && nowMinutes >= range.start && nowMinutes <= range.end && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-destructive"
                      style={{ top: ((nowMinutes - range.start) / SLOT_MINUTES) * ROW_PX }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sidelined.length > 0 && (
        <section className="rounded-xl border bg-card">
          <h2 className="border-b p-3 text-sm font-semibold">Cancelled & no-shows</h2>
          <ul className="divide-y text-sm">
            {sidelined.map((b) => (
              <li key={b.id}>
                <button type="button" onClick={() => setSelectedId(b.id)} className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/50">
                  <span>
                    <span className="font-medium">{b.customerName}</span> · {formatTimeOfDay(b.startMinutes)} ·{' '}
                    {barbers.find((x) => x.id === b.barberId)?.name ?? 'Barber'}
                  </span>
                  <BookingStatusBadge status={b.status} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selected && (
        <BookingCard
          booking={selected}
          barberName={barbers.find((b) => b.id === selected.barberId)?.name ?? 'Barber'}
          isToday={isToday}
          onClose={() => setSelectedId(null)}
          onEdit={() => {
            setSelectedId(null);
            setDraft({ booking: selected, businessDate, barberId: selected.barberId, startMinutes: selected.startMinutes });
          }}
        />
      )}

      {draft && (
        <BookingDialog
          draft={draft}
          barbers={barbers}
          services={services}
          onClose={() => setDraft(null)}
          onSaved={(date) => {
            setDraft(null);
            if (date !== businessDate) goTo(date);
          }}
        />
      )}
    </div>
  );
}

function BookingBlock({ booking, rangeStart, onOpen }: { booking: DayBooking; rangeStart: number; onOpen: () => void }) {
  const top = ((booking.startMinutes - rangeStart) / SLOT_MINUTES) * ROW_PX;
  const height = Math.max(((booking.endMinutes - booking.startMinutes) / SLOT_MINUTES) * ROW_PX - 2, ROW_PX - 2);
  const compact = height < ROW_PX * 2;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${booking.customerName}, ${formatTimeOfDay(booking.startMinutes)}, ${BOOKING_STATUS_STYLES[booking.status].label}`}
      className={cn(
        'absolute inset-x-1 z-[5] overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left text-xs shadow-sm transition-shadow hover:shadow-md',
        BOOKING_STATUS_STYLES[booking.status].block
      )}
      style={{ top: top + 1, height }}
    >
      <p className={cn('truncate font-semibold', compact ? 'leading-tight' : '')}>
        {formatTimeOfDay(booking.startMinutes)} {booking.customerName}
      </p>
      {!compact && <p className="truncate text-muted-foreground">{booking.items.map((i) => i.name).join(', ')}</p>}
      {!compact && booking.status !== 'booked' && <p className="truncate font-medium">{BOOKING_STATUS_STYLES[booking.status].label}</p>}
    </button>
  );
}
