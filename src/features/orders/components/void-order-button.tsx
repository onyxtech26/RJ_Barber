'use client';

import { useState, useTransition } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatRM } from '@/lib/money';
import { voidOrder } from '../actions';

export function VoidOrderButton({ orderId, receiptNo, totalSen }: { orderId: string; receiptNo: string; totalSen: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();
  const canSubmit = reason.trim().length >= 3 && !isPending;

  return (
    <>
      <Button variant="destructive" size="lg" className="h-11" onClick={() => setOpen(true)}>
        <Ban />
        Void sale
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) return;
              startTransition(async () => {
                const result = await voidOrder({ orderId, reason });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success(`${receiptNo} voided`);
                setOpen(false);
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Void {receiptNo}?</DialogTitle>
              <DialogDescription>
                {formatRM(totalSen)} will be removed from takings and commission. Refund the customer separately. The sale
                stays on record as voided.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="void-reason">Reason</Label>
              <Textarea
                id="void-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={200}
                autoFocus
                placeholder="e.g. Charged the wrong service, customer refunded"
                className="min-h-20"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="lg" className="h-11" onClick={() => setOpen(false)}>
                Keep sale
              </Button>
              <Button type="submit" variant="destructive" size="lg" className="h-11" disabled={!canSubmit}>
                {isPending && <Loader2 className="animate-spin" />}
                Void sale
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
