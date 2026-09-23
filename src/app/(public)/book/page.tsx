import Image from 'next/image';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { ShieldCheck, MessageCircle, Clock } from 'lucide-react';

export const metadata = {
  title: 'Book Appointment | RJ Barber Salon',
  description: 'Reserve your haircut, beard trim, or traditional hot towel shave at RJ Barber Salon.',
};

export default function BookPage() {
  return (
    <div className="relative min-h-[calc(100vh-80px)] py-12 md:py-16 overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_top,_rgba(212,164,55,0.12),transparent_70%)] pointer-events-none -z-10" />

      <div className="container mx-auto max-w-3xl px-4">
        {/* Header with official emblem */}
        <div className="flex flex-col items-center text-center space-y-4 mb-10">
          <div className="relative w-16 h-16 rounded-full border-2 border-primary/40 p-0.5 shadow-[0_0_20px_rgba(212,164,55,0.2)]">
            <Image
              src="/barber_logo.jpeg"
              alt="RJ Barber Salon Emblem"
              fill
              className="object-cover rounded-full"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-mono tracking-widest uppercase">
            <span>Official Booking Concierge</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Reserve Your <span className="gold-gradient-text">Appointment</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg">
            Select your preferred artisan barber, signature grooming service, and time slot. Instant live WhatsApp confirmation.
          </p>

          {/* Luxury reassurance badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-muted-foreground font-mono">
            <div className="inline-flex items-center gap-1.5 bg-card/60 border border-white/[0.06] px-3 py-1 rounded-full">
              <MessageCircle className="w-3.5 h-3.5 text-primary" />
              <span>WhatsApp Live Sync</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-card/60 border border-white/[0.06] px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Zero Waiting Time</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-card/60 border border-white/[0.06] px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Pay In-Shop</span>
            </div>
          </div>
        </div>

        {/* Interactive Booking Wizard */}
        <BookingWizard />
      </div>
    </div>
  );
}
