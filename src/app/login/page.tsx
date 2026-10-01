import { redirect } from 'next/navigation';
import { BrandLogo } from '@/components/brand-logo';
import { PinLogin } from '@/features/auth/pin-login';
import { getLoginStaff } from '@/features/auth/queries';
import { getCurrentStaff } from '@/server/auth/session';

export default async function LoginPage() {
  if (await getCurrentStaff()) redirect('/');
  const staffList = await getLoginStaff();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandLogo size={112} />
        <h1 className="text-2xl font-bold tracking-tight">RJ Barber Salon</h1>
      </div>
      <PinLogin staffList={staffList} />
    </div>
  );
}
