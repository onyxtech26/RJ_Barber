'use client';

import { useState, useTransition } from 'react';
import { KeyRound, Loader2, Plus, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { StaffRole } from '@/lib/enums';
import { formatPercent, parsePercent } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { CurrentStaff } from '@/server/auth/session';
import { resetStaffPin, saveStaff } from '../actions';
import type { StaffForEdit } from '../queries';
import { Field } from './shop-settings-form';

const PIN_PATTERN = /^\d{4,6}$/;

export function StaffEditor({ rows, me }: { rows: StaffForEdit[]; me: CurrentStaff }) {
  const [editing, setEditing] = useState<StaffForEdit | 'new' | null>(null);
  const [resettingPin, setResettingPin] = useState<StaffForEdit | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="lg" className="h-11" onClick={() => setEditing('new')}>
          <Plus />
          Add staff
        </Button>
      </div>

      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {rows.map((member) => (
          <li key={member.id} className={cn('flex flex-wrap items-center justify-between gap-3 p-3', !member.isActive && 'opacity-60')}>
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-medium">
                {member.name}
                {member.id === me.id && <span className="text-xs text-muted-foreground">(you)</span>}
              </p>
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span className="capitalize">{member.role}</span>
                {member.isBarber && (
                  <span className="flex items-center gap-1">
                    · <Scissors className="size-3.5" /> Barber, {formatPercent(member.commissionBps)}% commission
                  </span>
                )}
                {!member.isActive && <span>· Inactive</span>}
                {member.isLocked && (
                  <span className="font-medium text-destructive">· Locked (wrong PINs)</span>
                )}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="lg" className="h-10" onClick={() => setResettingPin(member)}>
                <KeyRound />
                Reset PIN
              </Button>
              <Button variant="outline" size="lg" className="h-10" onClick={() => setEditing(member)}>
                Edit
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <StaffDialog
          member={editing === 'new' ? null : editing}
          isSelf={editing !== 'new' && editing.id === me.id}
          nextSortOrder={rows.length}
          onClose={() => setEditing(null)}
        />
      )}
      {resettingPin && <PinDialog member={resettingPin} onClose={() => setResettingPin(null)} />}
    </div>
  );
}

function StaffDialog({
  member,
  isSelf,
  nextSortOrder,
  onClose,
}: {
  member: StaffForEdit | null;
  isSelf: boolean;
  nextSortOrder: number;
  onClose: () => void;
}) {
  const [name, setName] = useState(member?.name ?? '');
  const [role, setRole] = useState<StaffRole>(member?.role ?? 'staff');
  const [isBarber, setIsBarber] = useState(member?.isBarber ?? true);
  const [commission, setCommission] = useState(member ? formatPercent(member.commissionBps) : '50');
  const [isActive, setIsActive] = useState(member?.isActive ?? true);
  const [pin, setPin] = useState('');
  const [isPending, startTransition] = useTransition();

  const commissionBps = parsePercent(commission);
  const needsPin = member === null;
  const canSave =
    name.trim() !== '' && (!isBarber || commissionBps !== null) && (!needsPin || PIN_PATTERN.test(pin)) && !isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSave) return;
            startTransition(async () => {
              const result = await saveStaff({
                id: member?.id ?? null,
                name,
                role,
                isBarber,
                commissionBps: isBarber ? commissionBps! : 0,
                isActive,
                sortOrder: member?.sortOrder ?? nextSortOrder,
                pin: needsPin ? pin : null,
              });
              if (!result.ok) return void toast.error(result.error);
              toast.success(`${name.trim()} saved`);
              onClose();
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{member ? `Edit ${member.name}` : 'Add staff'}</DialogTitle>
          </DialogHeader>

          <Field label="Name" htmlFor="staff-name">
            <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus required />
          </Field>

          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Role</span>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              {(['staff', 'owner'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn('h-9 rounded-md text-sm font-medium', role === r ? 'bg-card shadow-sm' : 'text-muted-foreground')}
                >
                  {r === 'owner' ? 'Owner' : 'Staff'}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Owners can close days, void sales, approve big discounts and change settings.
            </p>
          </div>

          <label className="flex items-center gap-3">
            <Switch checked={isBarber} onCheckedChange={setIsBarber} />
            <span className="text-sm font-medium">Cuts hair (appears in the barber list)</span>
          </label>

          {isBarber && (
            <Field
              label="Commission on services (%)"
              htmlFor="staff-commission"
              error={commissionBps === null ? 'Enter a percentage between 0 and 100' : null}
            >
              <Input
                id="staff-commission"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                inputMode="decimal"
                className="max-w-32"
              />
            </Field>
          )}

          {needsPin && (
            <Field label="PIN (4–6 digits)" htmlFor="staff-pin" error={pin && !PIN_PATTERN.test(pin) ? 'Use 4 to 6 digits' : null}>
              <Input
                id="staff-pin"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="max-w-40 tracking-[0.4em]"
              />
            </Field>
          )}

          {member && !isSelf && (
            <label className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <span className="text-sm font-medium">Active (can sign in)</span>
            </label>
          )}

          <DialogFooter>
            <Button type="submit" variant="brand" size="lg" className="h-11" disabled={!canSave}>
              {isPending && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PinDialog({ member, onClose }: { member: StaffForEdit; onClose: () => void }) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isPending, startTransition] = useTransition();
  const mismatch = confirm !== '' && pin !== confirm;
  const canSave = PIN_PATTERN.test(pin) && pin === confirm && !isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSave) return;
            startTransition(async () => {
              const result = await resetStaffPin({ staffId: member.id, pin });
              if (!result.ok) return void toast.error(result.error);
              toast.success(`PIN changed for ${member.name}`);
              onClose();
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>New PIN for {member.name}</DialogTitle>
            <DialogDescription>They’ll be signed out and need the new PIN next time. Any lockout is cleared.</DialogDescription>
          </DialogHeader>
          <Field label="New PIN (4–6 digits)" htmlFor="new-pin">
            <Input
              id="new-pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="tracking-[0.4em]"
            />
          </Field>
          <Field label="Type it again" htmlFor="confirm-pin" error={mismatch ? 'PINs don’t match' : null}>
            <Input
              id="confirm-pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="tracking-[0.4em]"
            />
          </Field>
          <DialogFooter>
            <Button type="submit" variant="brand" size="lg" className="h-11" disabled={!canSave}>
              {isPending && <Loader2 className="animate-spin" />}
              Change PIN
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
