import { BrandLogo } from '@/components/brand-logo';

// Placeholder — the staff PIN pad with server-side verification is built in Phase 3.
export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <BrandLogo size={160} />
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">RJ Barber Salon</h1>
        <p className="text-muted-foreground">Staff PIN sign-in is coming soon.</p>
      </div>
    </div>
  );
}
