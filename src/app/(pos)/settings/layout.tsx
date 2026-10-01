import { SettingsTabs } from '@/features/settings/components/settings-tabs';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  // Each settings page runs its own requireOwner() check — layouts don't re-run on navigation.
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <SettingsTabs />
      {children}
    </div>
  );
}
