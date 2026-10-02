'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Delete, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { signIn, type SignInState } from './actions';
import type { LoginStaff } from './queries';

const MAX_PIN_LENGTH = 6;
const MIN_PIN_LENGTH = 4;

export function PinLogin({
  staffList,
  demoPins,
}: {
  staffList: LoginStaff[];
  /** Online demo only: show each role's demo PIN on its tile. */
  demoPins: { owner: string; staff: string } | null;
}) {
  const [selected, setSelected] = useState<LoginStaff | null>(null);

  if (!selected) {
    return (
      <div className="w-full max-w-md space-y-4">
        <h2 className="text-center text-lg font-semibold">Who&apos;s at the counter?</h2>
        {staffList.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No staff found. Run <code className="font-mono">npm run db:setup</code>.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {staffList.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelected(member)}
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-brand-foreground">
                  {member.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="font-medium">{member.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                {demoPins && (
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs">PIN {demoPins[member.role]}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Remounting on staff change resets the typed PIN and any previous error.
  return <PinPad key={selected.id} member={selected} onBack={() => setSelected(null)} />;
}

function PinPad({ member, onBack }: { member: LoginStaff; onBack: () => void }) {
  const [pin, setPin] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<SignInState, FormData>(signIn, {});

  // Clear the dots after a failed attempt so the next try starts fresh.
  const [lastError, setLastError] = useState(state.error);
  if (state.error !== lastError) {
    setLastError(state.error);
    setPin('');
  }

  const press = (digit: string) => setPin((p) => (p.length < MAX_PIN_LENGTH ? p + digit : p));
  const backspace = () => setPin((p) => p.slice(0, -1));
  const canSubmit = pin.length >= MIN_PIN_LENGTH && !isPending;

  // Physical keyboard support for desktop use. Enter submits through the form so the
  // button's disabled rule (min length, not already pending) still applies.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) setPin((p) => (p.length < MAX_PIN_LENGTH ? p + e.key : p));
      else if (e.key === 'Backspace') setPin((p) => p.slice(0, -1));
      else if (e.key === 'Escape') onBack();
      else if (e.key === 'Enter') {
        e.preventDefault();
        const submit = formRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (submit && !submit.disabled) formRef.current?.requestSubmit(submit);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  return (
    <form ref={formRef} action={formAction} className="w-full max-w-xs space-y-5">
      <input type="hidden" name="staffId" value={member.id} />
      <input type="hidden" name="pin" value={pin} />

      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon-lg" onClick={onBack} aria-label="Choose someone else">
          <ArrowLeft />
        </Button>
        <div>
          <p className="font-semibold">{member.name}</p>
          <p className="text-sm text-muted-foreground">Enter your PIN</p>
        </div>
      </div>

      <div className="flex justify-center gap-3" aria-label={`${pin.length} digits entered`}>
        {Array.from({ length: MAX_PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'size-3.5 rounded-full border-2 border-foreground/70 transition-colors',
              i < pin.length && 'bg-foreground',
              i >= MIN_PIN_LENGTH && i >= pin.length && 'border-dashed border-foreground/30'
            )}
          />
        ))}
      </div>

      <p role="alert" className="min-h-5 text-center text-sm font-medium text-destructive">
        {state.error}
      </p>

      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <PadKey key={digit} onClick={() => press(digit)}>
            {digit}
          </PadKey>
        ))}
        <PadKey onClick={() => setPin('')} className="text-sm text-muted-foreground">
          Clear
        </PadKey>
        <PadKey onClick={() => press('0')}>0</PadKey>
        <PadKey onClick={backspace} aria-label="Delete last digit">
          <Delete className="size-5" />
        </PadKey>
      </div>

      <Button type="submit" variant="brand" size="xl" className="w-full" disabled={!canSubmit}>
        {isPending ? <Loader2 className="animate-spin" /> : 'Sign in'}
      </Button>
    </form>
  );
}

function PadKey({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-16 items-center justify-center rounded-xl border bg-card text-2xl font-semibold tabular-nums transition-colors select-none hover:bg-muted active:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        className
      )}
      {...props}
    />
  );
}
