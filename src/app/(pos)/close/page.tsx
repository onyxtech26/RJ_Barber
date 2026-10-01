import { CalendarCheck } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { requireOwner } from '@/server/auth/session';

export default async function DayClosePage() {
  await requireOwner();

  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <h1 className="text-xl font-bold">Day Close</h1>
      <EmptyState
        icon={CalendarCheck}
        title="Nothing to close yet"
        description="DuitNow and cash totals, plus sales and commission per barber, will show here."
      />
    </div>
  );
}
