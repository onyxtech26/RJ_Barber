'use client';

import { useState, useTransition } from 'react';
import { Loader2, Lock, LockOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatRM } from '@/lib/money';
import { closeDay, reopenDay } from '../actions';

export function CloseDayButton({
  businessDate,
  dayLabel,
  duitnowSen,
  cashSen,
  disabledReason,
}: {
  businessDate: string;
  dayLabel: string;
  duitnowSen: number;
  cashSen: number;
  disabledReason: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <Button variant="brand" size="xl" disabled={disabledReason !== null} onClick={() => setOpen(true)}>
          <Lock />
          Close day
        </Button>
        {disabledReason && <p className="text-sm text-muted-foreground">{disabledReason}</p>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = await closeDay({ businessDate, notes });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success(`${dayLabel} closed`);
                setOpen(false);
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Close {dayLabel}?</DialogTitle>
              <DialogDescription>
                The totals will be frozen, no more sales can be taken for this day, and its sales can no longer be voided.
                You can reopen it if needed.
              </DialogDescription>
            </DialogHeader>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <dt className="text-muted-foreground">Check bank for DuitNow</dt>
                <dd className="text-lg font-bold tabular-nums">{formatRM(duitnowSen)}</dd>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <dt className="text-muted-foreground">Cash in hand</dt>
                <dd className="text-lg font-bold tabular-nums">{formatRM(cashSen)}</dd>
              </div>
            </dl>
            <div className="grid gap-1.5">
              <Label htmlFor="close-notes">Notes (optional)</Label>
              <Textarea
                id="close-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                placeholder="e.g. DuitNow matched bank statement"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="lg" className="h-11" onClick={() => setOpen(false)}>
                Not yet
              </Button>
              <Button type="submit" variant="brand" size="lg" className="h-11" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                Close day
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ReopenDayButton({ businessDate, dayLabel }: { businessDate: string; dayLabel: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button variant="outline" size="lg" className="h-11" onClick={() => setOpen(true)}>
        <LockOpen />
        Reopen day
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (reason.trim().length < 3) return;
              startTransition(async () => {
                const result = await reopenDay({ businessDate, reason });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success(`${dayLabel} reopened`);
                setOpen(false);
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Reopen {dayLabel}?</DialogTitle>
              <DialogDescription>Sales can be taken and voided again until you close it once more.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="reopen-reason">Reason</Label>
              <Textarea
                id="reopen-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={200}
                autoFocus
                placeholder="e.g. Closed too early, one more customer"
              />
            </div>
            <DialogFooter>
              <Button type="submit" size="lg" className="h-11" disabled={isPending || reason.trim().length < 3}>
                {isPending && <Loader2 className="animate-spin" />}
                Reopen day
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
