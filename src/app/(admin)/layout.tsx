'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  CreditCard,
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  UserCog, 
  Scissors, 
  Settings, 
  DollarSign,
  Menu,
  LogOut,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Armchair
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const navItems = [
  { title: 'POS Terminal', href: '/pos', icon: CreditCard, highlight: true },
  { title: 'Chair & Walk-In Queue', href: '/queue', icon: Users },
  { title: 'Live Calendar', href: '/calendar', icon: CalendarDays },
  { title: 'Till & Cash Drawer', href: '/till', icon: DollarSign },
  { title: 'Dashboard Overview', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Client Directory', href: '/customers', icon: Users },
  { title: 'Barber Roster', href: '/barbers', icon: UserCog },
  { title: 'Service Menu', href: '/manage-services', icon: Scissors },
  { title: 'Settings & WhatsApp', href: '/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const NavLinks = () => (
    <div className="space-y-1.5 py-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all text-xs font-mono uppercase tracking-wider ${
              isActive 
                ? 'bg-primary/10 text-primary font-bold border border-primary/20 shadow-sm' 
                : 'text-muted-foreground hover:bg-[#16181D] hover:text-foreground'
            }`}
          >
            <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            {(!collapsed || typeof window === 'undefined') && <span>{item.title}</span>}
            {isActive && (!collapsed || typeof window === 'undefined') && (
              <ChevronRight className="h-3.5 w-3.5 ml-auto text-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/[0.08] bg-[#0E1014]/90 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <Sheet>
          <SheetTrigger className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-[#16181D] text-muted-foreground hover:text-foreground lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation sidebar</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] sm:w-[280px] bg-[#0E1014] border-white/[0.08]">
            <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
            <div className="flex h-16 items-center gap-3 border-b border-white/[0.08] px-2 pb-4 pt-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/40 shrink-0">
                <Image src="/barber_logo.jpeg" alt="RJ Barber" fill className="object-cover" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-wider uppercase block text-foreground">RJ Barber</span>
                <span className="text-[10px] font-mono text-primary">Master Command</span>
              </div>
            </div>
            <NavLinks />
            <div className="pt-4 border-t border-white/[0.08]">
              <Link
                href="/pos"
                className="flex items-center gap-2 text-xs font-mono text-primary hover:text-primary/80 transition-colors px-3 py-2 rounded-lg font-bold"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Open POS Terminal</span>
              </Link>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-primary/40">
              <Image src="/barber_logo.jpeg" alt="RJ Barber" fill className="object-cover" />
            </div>
            <span className="font-bold text-sm tracking-wider uppercase text-foreground">RJ POS</span>
          </div>
          
          <div className="hidden lg:flex lg:items-center lg:gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className="text-muted-foreground hover:text-foreground hover:bg-[#16181D]"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-1 items-center justify-end gap-3">
            <Link
              href="/pos"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-black font-bold bg-primary hover:bg-primary/90 transition-all px-3 py-1.5 rounded-lg shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>POS Fast Checkout</span>
            </Link>

            <Link
              href="/queue"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors bg-[#14161C] border border-white/[0.06] px-3 py-1.5 rounded-lg"
            >
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>Walk-in Bench</span>
            </Link>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-9 w-9 rounded-full overflow-hidden border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                <Avatar className="h-full w-full">
                  <AvatarFallback className="bg-primary/20 text-primary font-mono text-xs font-bold">RJ</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#14161C] border-white/[0.08]" align="end">
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-foreground">RJ (Founder)</p>
                    <p className="text-xs font-mono text-primary">Master Barber Admin</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem className="text-xs font-mono cursor-pointer p-0">
                  <Link href="/settings" className="flex items-center w-full px-2 py-1.5">
                    <Settings className="mr-2 h-3.5 w-3.5" />
                    <span>System Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem className="text-xs font-mono text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside 
          className={`hidden lg:flex lg:flex-col border-r border-white/[0.08] bg-[#0E1014] transition-all duration-300 ${
            collapsed ? 'w-[72px]' : 'w-[250px]'
          }`}
        >
          <div className="flex h-16 items-center gap-3 border-b border-white/[0.08] px-4">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/40 shrink-0">
              <Image src="/barber_logo.jpeg" alt="RJ Barber" fill className="object-cover" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <span className="font-bold text-sm tracking-wider uppercase block text-foreground whitespace-nowrap">RJ Barber</span>
                <span className="text-[10px] font-mono text-primary tracking-widest uppercase block whitespace-nowrap">Management Hub</span>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <NavLinks />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
