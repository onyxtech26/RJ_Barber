'use client';

import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Owner = { id: string; name: string };

/** Asks an owner to approve a large discount with their PIN. The server checks it (with lockout). */
export function ApprovalDialog({
  open,
  owners,
  error,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: {
  open: boolean;
  owners: Owner[];
  error: string | null;
  isSubmitting: boolean;
  onSubmit: (approval: { ownerId: string; pin: string }) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? '');
  const [pin, setPin] = useState('');
  const [lastError, setLastError] = useState(error);
  if (error !== lastError) {
    setLastError(error);
    setPin('');
  }

  const valid = ownerId !== '' && /^\d{4,6}$/.test(pin);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid && !isSubmitting) onSubmit({ ownerId, pin });
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" />
              Owner approval
            </DialogTitle>
            <DialogDescription>This discount is above the limit staff can give on their own.</DialogDescription>
          </DialogHeader>

          {owners.length > 1 && (
            <div className="grid gap-1.5">
              <Label htmlFor="approval-owner">Owner</Label>
              <select
                id="approval-owner"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="h-10 rounded-lg border bg-background px-2"
              >
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="approval-pin">{owners.length === 1 ? `${owners[0].name}’s PIN` : 'Owner PIN'}</Label>
            <Input
              id="approval-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="h-12 text-center text-2xl tracking-[0.5em]"
            />
            <p role="alert" className="min-h-5 text-sm font-medium text-destructive">
              {error}
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" variant="brand" size="xl" className="w-full sm:w-auto" disabled={!valid || isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Approve & charge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
