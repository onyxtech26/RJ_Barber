'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, ReceiptText, Settings, ShoppingCart } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Terminal', icon: ShoppingCart },
  { href: '/orders', label: 'Orders', icon: ReceiptText },
  { href: '/close', label: 'Day Close', icon: CalendarCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b bg-card">
      <div className="flex h-16 items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <BrandLogo size={40} />
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-bold tracking-tight">RJ Barber Salon</p>
            <p className="text-xs text-muted-foreground">Point of Sale</p>
          </div>
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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

        {/* Signed-in staff member + sign out arrive with PIN auth (Phase 3). */}
        <div className="hidden shrink-0 text-right text-xs text-muted-foreground lg:block">
          Not signed in
        </div>
      </div>
    </header>
  );
}
