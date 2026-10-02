'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatTimeOfDay, parseTimeOfDay, SLOT_MINUTES, toTimeInput } from '@/lib/scheduling';
import { cn } from '@/lib/utils';
import { saveBooking } from '../actions';
import type { BookingsDay, DayBooking } from '../queries';

export type BookingDraft = {
  booking: DayBooking | null; // null = new booking
  businessDate: string;
  barberId: string;
  startMinutes: number;
};

export function BookingDialog({
  draft,
  barbers,
  services,
  onClose,
  onSaved,
}: {
  draft: BookingDraft;
  barbers: BookingsDay['barbers'];
  services: BookingsDay['services'];
  onClose: () => void;
  onSaved: (businessDate: string) => void;
}) {
  const existing = draft.booking;
  const [customerName, setCustomerName] = useState(existing?.customerName ?? '');
  const [customerPhone, setCustomerPhone] = useState(existing?.customerPhone ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [barberId, setBarberId] = useState(draft.barberId);
  const [businessDate, setBusinessDate] = useState(draft.businessDate);
  const [startTime, setStartTime] = useState(toTimeInput(draft.startMinutes));
  const [itemIds, setItemIds] = useState<string[]>(
    existing?.items.map((i) => i.catalogItemId).filter((id): id is string => !!id) ?? []
  );
  const [outsideHoursWarning, setOutsideHoursWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const chosen = itemIds.map((id) => services.find((s) => s.id === id)).filter((s) => !!s);
  const duration = chosen.reduce((sum, s) => sum + s.durationMinutes, 0);
  const start = parseTimeOfDay(startTime);
  const canSave = customerName.trim() !== '' && chosen.length > 0 && start !== null && !isPending;

  const toggleService = (id: string) => {
    setOutsideHoursWarning(null);
    setItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = (allowOutsideHours: boolean) =>
    startTransition(async () => {
      const result = await saveBooking({
        id: existing?.id ?? null,
        businessDate,
        startTime,
        barberId,
        customerName,
        customerPhone,
        notes,
        itemIds,
        allowOutsideHours,
      });
      if (!result.ok) {
        if (result.code === 'outside_hours') setOutsideHoursWarning(result.error);
        else toast.error(result.error);
        return;
      }
      toast.success(existing ? 'Booking updated' : `Booked ${customerName.trim()}`);
      onSaved(businessDate);
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSave) submit(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>{existing ? 'Edit booking' : 'New booking'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Customer name" htmlFor="bk-name">
              <Input id="bk-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={60} autoFocus required />
            </Field>
            <Field label="Phone (optional)" htmlFor="bk-phone">
              <Input id="bk-phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} maxLength={20} inputMode="tel" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Barber" htmlFor="bk-barber">
              <select
                id="bk-barber"
                value={barberId}
                onChange={(e) => {
                  setBarberId(e.target.value);
                  setOutsideHoursWarning(null);
                }}
                className="h-8 rounded-lg border bg-background px-2 text-sm"
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date" htmlFor="bk-date">
              <Input
                id="bk-date"
                type="date"
                value={businessDate}
                onChange={(e) => {
                  if (e.target.value) setBusinessDate(e.target.value);
                  setOutsideHoursWarning(null);
                }}
              />
            </Field>
            <Field label="Start time" htmlFor="bk-time">
              <Input
                id="bk-time"
                type="time"
                step={SLOT_MINUTES * 60}
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setOutsideHoursWarning(null);
                }}
              />
            </Field>
          </div>

          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Services</span>
            <div className="flex flex-wrap gap-1.5">
              {services.map((s) => {
                const selected = itemIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    aria-pressed={selected}
                    className={cn(
                      'h-9 rounded-full border px-3 text-sm font-medium transition-colors',
                      selected ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {s.name} · {s.durationMinutes}m
                  </button>
                );
              })}
            </div>
            <p className="min-h-5 text-sm text-muted-foreground">
              {chosen.length > 0 && start !== null
                ? `${duration} min · ${formatTimeOfDay(start)} – ${formatTimeOfDay(start + duration)}`
                : 'Pick one or more services.'}
            </p>
          </div>

          <Field label="Notes (optional)" htmlFor="bk-notes">
            <Textarea id="bk-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} className="min-h-14" />
          </Field>

          {outsideHoursWarning && (
            <div className="flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-sm text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{outsideHoursWarning}</p>
                <button type="button" className="mt-1 font-semibold underline underline-offset-2" onClick={() => submit(true)}>
                  Book anyway
                </button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" variant="brand" size="lg" className="h-11" disabled={!canSave}>
              {isPending && <Loader2 className="animate-spin" />}
              {existing ? 'Save changes' : 'Book'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
