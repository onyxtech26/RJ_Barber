'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, CalendarClock, LogOut, ReceiptText, Settings, ShoppingCart } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { signOut } from '@/features/auth/actions';
import type { CurrentStaff } from '@/server/auth/session';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Terminal', icon: ShoppingCart, ownerOnly: false },
  { href: '/bookings', label: 'Bookings', icon: CalendarClock, ownerOnly: false },
  { href: '/orders', label: 'Orders', icon: ReceiptText, ownerOnly: false },
  { href: '/close', label: 'Day Close', icon: CalendarCheck, ownerOnly: true },
  { href: '/settings', label: 'Settings', icon: Settings, ownerOnly: true },
];

export function TopBar({ currentStaff }: { currentStaff: CurrentStaff }) {
  const pathname = usePathname();
  const isOwner = currentStaff.role === 'owner';

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-card">
      <div className="flex h-full items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <BrandLogo size={40} />
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-bold tracking-tight">RJ Barber Salon</p>
            <p className="text-xs text-muted-foreground">Point of Sale</p>
          </div>
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
          {NAV_ITEMS.filter((item) => isOwner || !item.ownerOnly).map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-brand text-brand-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="size-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden text-right leading-tight lg:block">
            <p className="text-sm font-medium">{currentStaff.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentStaff.role}</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="lg" className="h-11" aria-label="Switch staff (sign out)">
              <LogOut />
              <span className="hidden sm:inline">Switch</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
