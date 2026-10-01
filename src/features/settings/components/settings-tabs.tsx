'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/settings', label: 'Shop & payments' },
  { href: '/settings/catalog', label: 'Services & products' },
  { href: '/settings/staff', label: 'Staff' },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b" aria-label="Settings sections">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              active ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
