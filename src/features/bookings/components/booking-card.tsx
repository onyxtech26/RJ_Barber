'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ban, CalendarX, Loader2, Pencil, Phone, ShoppingCart, Undo2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatTimeOfDay } from '@/lib/scheduling';
import { setBookingStatus } from '../actions';
import type { BookingStatusChange } from '../schemas';
import type { DayBooking } from '../queries';
import { BookingStatusBadge } from './booking-status-badge';

/** The side panel for one booking: details plus the actions its status allows. */
export function BookingCard({
  booking,
  barberName,
  isToday,
  onEdit,
  onClose,
}: {
  booking: DayBooking;
  barberName: string;
  isToday: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<'cancelled' | 'no_show' | null>(null);

  const change = (status: BookingStatusChange, message: string) =>
    startTransition(async () => {
      const result = await setBookingStatus({ bookingId: booking.id, status });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(message);
      if (status === 'cancelled' || status === 'no_show') onClose();
      setConfirming(null);
    });

  const open = booking.status === 'booked' || booking.status === 'checked_in';
  const charged = open && booking.orderId !== null;

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {booking.customerName}
            <BookingStatusBadge status={booking.status} />
          </SheetTitle>
          <SheetDescription>
            {formatTimeOfDay(booking.startMinutes)} – {formatTimeOfDay(booking.endMinutes)} with {barberName}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <ul className="divide-y rounded-xl border text-sm">
            {booking.items.map((item, i) => (
              <li key={i} className="flex justify-between p-3">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">{item.durationMinutes} min</span>
              </li>
            ))}
          </ul>

          {booking.customerPhone && (
            <a href={`tel:${booking.customerPhone}`} className="flex items-center gap-2 text-sm font-medium underline-offset-2 hover:underline">
              <Phone className="size-4" />
              {booking.customerPhone}
            </a>
          )}
          {booking.notes && <p className="rounded-lg bg-muted p-3 text-sm">“{booking.notes}”</p>}
          <p className="text-xs text-muted-foreground">Booked by {booking.createdByName}</p>

          {charged && (
            <p className="rounded-lg bg-warning-soft p-3 text-sm text-warning">
              Charged — waiting for payment in the Terminal’s Pending tray.
            </p>
          )}
          {booking.status === 'completed' && booking.orderId && (
            <Button variant="outline" size="lg" className="h-11 w-full" asChild>
              <Link href={`/orders/${booking.orderId}`}>View the sale</Link>
            </Button>
          )}

          {open && !charged && (
            <div className="grid gap-2">
              {isToday && (
                <Button variant="brand" size="xl" className="h-12" disabled={isPending} onClick={() => router.push(`/?booking=${booking.id}`)}>
                  <ShoppingCart />
                  Start sale
                </Button>
              )}
              {booking.status === 'booked' ? (
                <Button size="lg" className="h-11" disabled={isPending} onClick={() => change('checked_in', `${booking.customerName} checked in`)}>
                  {isPending ? <Loader2 className="animate-spin" /> : <UserCheck />}
                  Check in (customer arrived)
                </Button>
              ) : (
                <Button variant="outline" size="lg" className="h-11" disabled={isPending} onClick={() => change('booked', 'Check-in undone')}>
                  <Undo2 />
                  Undo check-in
                </Button>
              )}
              <Button variant="outline" size="lg" className="h-11" disabled={isPending} onClick={onEdit}>
                <Pencil />
                Edit / reschedule
              </Button>

              {confirming ? (
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-destructive-soft p-2">
                  <Button
                    variant="destructive"
                    size="lg"
                    className="h-10"
                    disabled={isPending}
                    onClick={() =>
                      change(confirming, confirming === 'no_show' ? 'Marked as no-show' : 'Booking cancelled')
                    }
                  >
                    Yes, {confirming === 'no_show' ? 'no-show' : 'cancel it'}
                  </Button>
                  <Button variant="ghost" size="lg" className="h-10" onClick={() => setConfirming(null)}>
                    Keep booking
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {booking.status === 'booked' && (
                    <Button variant="ghost" size="lg" className="h-10 text-destructive" onClick={() => setConfirming('no_show')}>
                      <CalendarX />
                      No-show
                    </Button>
                  )}
                  <Button variant="ghost" size="lg" className="h-10 text-destructive" onClick={() => setConfirming('cancelled')}>
                    <Ban />
                    Cancel booking
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
