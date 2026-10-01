import { TopBar } from '@/features/shell/top-bar';
import { requireStaff } from '@/server/auth/session';

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  // For display only (name, role-based nav). Each page and action still runs its own check,
  // because layouts don't re-render on client-side navigation.
  const currentStaff = await requireStaff();

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar currentStaff={currentStaff} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
