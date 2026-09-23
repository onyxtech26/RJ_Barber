import Link from 'next/link';
import Image from 'next/image';
import { Menu, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-18 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-primary/60 p-0.5 shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:border-primary">
                <Image
                  src="/barber_logo.jpeg"
                  alt="RJ Barber Salon Logo"
                  width={44}
                  height={44}
                  className="h-full w-full rounded-full object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-wider text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
                  RJ BARBER SALON
                </span>
                <span className="text-[10px] tracking-widest font-mono uppercase text-muted-foreground">
                  Haircuts & Shaves · Est. 2022
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Home
            </Link>
            <Link href="/services" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Services
            </Link>
            <Link href="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              About & Craft
            </Link>
            <Button asChild className="ml-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gold-glow">
              <Link href="/book">Book Your Cut</Link>
            </Button>
          </nav>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger className="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="text-lg font-medium hover:text-primary transition-colors">
                    Home
                  </Link>
                  <Link href="/services" className="text-lg font-medium hover:text-primary transition-colors">
                    Services
                  </Link>
                  <div className="mt-4 border-t border-border pt-4">
                    <Button asChild className="w-full">
                      <Link href="/book">Book Now</Link>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/60 backdrop-blur py-12 md:py-16">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-8 px-4 sm:px-6">
          <div className="flex flex-col gap-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-primary/50">
                <Image
                  src="/barber_logo.jpeg"
                  alt="RJ Barber Salon Logo"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <span className="font-bold text-base tracking-wide text-foreground">RJ BARBER SALON</span>
                <p className="text-[10px] font-mono tracking-widest uppercase text-primary">Est. 2022</p>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              Precision haircuts, traditional hot towel shaves, and artisanal beard sculpting for the modern gentleman.
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Navigation</h3>
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Home</Link>
            <Link href="/services" className="text-sm text-muted-foreground hover:text-primary transition-colors">Services & Pricing</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Our Craft</Link>
            <Link href="/book" className="text-sm text-muted-foreground hover:text-primary transition-colors">Book Online</Link>
            <Link href="/dashboard" className="text-xs font-mono text-primary/80 hover:text-primary transition-colors pt-1 flex items-center gap-1">
              <span>Admin Hub</span> →
            </Link>
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-foreground">Hours</h3>
            <div className="text-sm text-muted-foreground flex justify-between w-48">
              <span>Mon - Fri:</span> <span>9:00 AM - 8:00 PM</span>
            </div>
            <div className="text-sm text-muted-foreground flex justify-between w-48">
              <span>Saturday:</span> <span>10:00 AM - 6:00 PM</span>
            </div>
            <div className="text-sm text-muted-foreground flex justify-between w-48">
              <span>Sunday:</span> <span>Closed</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-foreground">Location</h3>
            <p className="text-sm text-muted-foreground">
              123 Style Avenue<br />
              Grooming District, NY 10001
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              (555) 123-4567<br />
              info@rjbarbersalon.com
            </p>
          </div>
        </div>
        <div className="container px-4 mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
          <span>© {new Date().getFullYear()} RJ Barber Salon. All rights reserved.</span>
          <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
            Barber & Staff Command Portal
          </Link>
        </div>
      </footer>
    </div>
  );
}
