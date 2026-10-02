import { IS_DEMO } from '@/lib/demo';

// Shown on every screen of the online demo, so nobody mistakes it for the live shop POS.
// Fixed in a corner rather than a top bar, so it doesn't change the terminal's fitted layout; hidden on print.
export function DemoBadge() {
  if (!IS_DEMO) return null;
  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-50 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-lg print:hidden">
      DEMO · test data only
    </div>
  );
}
