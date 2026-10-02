import { redirect } from 'next/navigation';
import { BrandLogo } from '@/components/brand-logo';
import { PinLogin } from '@/features/auth/pin-login';
import { getLoginStaff } from '@/features/auth/queries';
import { getCurrentStaff } from '@/server/auth/session';
import { DEMO_PINS, IS_DEMO } from '@/lib/demo';

export default async function LoginPage() {
  if (await getCurrentStaff()) redirect('/');
  const staffList = await getLoginStaff();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandLogo size={112} />
        <h1 className="text-2xl font-bold tracking-tight">RJ Barber Salon</h1>
      </div>
      {IS_DEMO && (
        <p className="max-w-md rounded-xl bg-accent p-3 text-center text-sm">
          This is a <span className="font-semibold">demo</span> with sample data. Tap a name — the demo PIN is shown
          under it.
        </p>
      )}
      <PinLogin staffList={staffList} demoPins={IS_DEMO ? DEMO_PINS : null} />
    </div>
  );
}
