import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { requireOwner } from '@/server/auth/session';

export default async function SettingsPage() {
  await requireOwner();

  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <EmptyState
        icon={Settings}
        title="Owner settings"
        description="Services and prices, staff and PINs, DuitNow QR, SST and receipt details."
      />
    </div>
  );
}
