'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookingState } from './booking-wizard';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar as CalendarIcon, MessageCircle, Copy, Check, MapPin, ArrowRight, Share2, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BookingSuccessProps {
  state: BookingState;
}

export function BookingSuccess({ state }: BookingSuccessProps) {
  const [copied, setCopied] = useState(false);
  const formattedDate = state.startTime ? format(state.startTime, 'EEEE, MMMM do, yyyy') : 'Scheduled Date';
  const formattedTime = state.startTime ? format(state.startTime, 'h:mm a') : 'Scheduled Time';
  const reference = state.bookingReference || `RJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reference);
    setCopied(true);
    toast.success('Booking reference copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCalendar = () => {
    if (!state.startTime) return;
    const start = state.startTime.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endTime = new Date(state.startTime.getTime() + (state.serviceDuration || 45) * 60000);
    const end = endTime.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(`RJ Barber Salon - ${state.serviceName}`);
    const details = encodeURIComponent(`Appointment with ${state.barberName} at RJ Barber Salon. Booking Reference: ${reference}`);
    const location = encodeURIComponent('123 Style Avenue, Grooming District, NY 10001');
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-8 animate-in zoom-in-95 duration-500 max-w-xl mx-auto">
      {/* Success Crest & Halo */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 pointer-events-none" />
        <div className="relative z-10 w-20 h-20 rounded-full border-2 border-primary bg-[#101216] flex items-center justify-center shadow-[0_0_30px_rgba(212,164,55,0.4)]">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
          Appointment Secured
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          You're All Set, <span className="gold-gradient-text">{state.customerName.split(' ')[0]}</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          We've reserved your chair at RJ Barber Salon. A confirmation pass has been dispatched.
        </p>
      </div>

      {/* Official Luxury Ticket Pass */}
      <div className="w-full bg-[#14161C] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl text-left">
        {/* Pass Header */}
        <div className="bg-[#181B22] px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-primary/40">
              <Image src="/barber_logo.jpeg" alt="RJ Barber" fill className="object-cover" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">RJ Barber Salon</p>
              <p className="text-[10px] font-mono text-primary">Master Grooming Since 2022</p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-primary/10 border border-primary/30 text-primary px-2 py-0.5 rounded">
            CONFIRMED
          </span>
        </div>

        {/* Pass Body */}
        <div className="p-6 space-y-6">
          {/* Reference Code Strip */}
          <div className="bg-[#0E1014] p-4 rounded-xl border border-white/[0.06] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">
                Booking Reference
              </span>
              <span className="text-xl sm:text-2xl font-mono font-bold tracking-widest text-primary">
                {reference}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="border-white/[0.1] bg-[#14161C] hover:border-primary/50 text-xs font-mono h-9"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1 bg-[#16181D] p-3 rounded-lg border border-white/[0.04]">
              <span className="text-muted-foreground uppercase text-[10px] block">Service & Barber</span>
              <p className="font-semibold text-foreground text-sm font-sans">{state.serviceName}</p>
              <p className="text-primary">with Artisan {state.barberName}</p>
            </div>

            <div className="space-y-1 bg-[#16181D] p-3 rounded-lg border border-white/[0.04]">
              <span className="text-muted-foreground uppercase text-[10px] block">Reserved Schedule</span>
              <p className="font-semibold text-foreground text-sm font-sans">{formattedDate}</p>
              <p className="text-primary font-bold">{formattedTime}</p>
            </div>
          </div>

          {/* Location & Arrival Hint */}
          <div className="flex items-start gap-3 pt-2 border-t border-white/[0.06]">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-foreground">123 Style Avenue, Grooming District</span>
              <p className="text-muted-foreground mt-0.5">
                Complimentary parking available in rear. Please arrive 5 minutes prior to relax and enjoy a beverage.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Sync Notification Banner */}
      {state.whatsappOptin && (
        <div className="w-full flex items-center gap-3.5 text-xs text-emerald-400 bg-emerald-950/20 px-4 py-3.5 rounded-xl border border-emerald-500/20 text-left">
          <MessageCircle className="h-5 w-5 shrink-0 text-emerald-400" />
          <p>
            A WhatsApp verification message and live tracking link have been dispatched to{' '}
            <strong className="text-foreground font-mono">{state.customerPhone}</strong>. You can chat anytime to reschedule.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button
          variant="outline"
          size="lg"
          onClick={handleAddToCalendar}
          className="flex-1 border-white/[0.1] hover:border-primary/50 text-xs font-mono uppercase tracking-wider"
        >
          <CalendarIcon className="w-4 h-4 mr-2 text-primary" />
          Add to Google Calendar
        </Button>

        <Link href="/" className="flex-1">
          <Button
            size="lg"
            className="w-full bg-primary text-black hover:bg-primary/90 font-bold text-xs font-mono uppercase tracking-wider shadow-[0_0_20px_rgba(212,164,55,0.25)]"
          >
            <span>Return to Homepage</span>
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="text-center pt-2">
        <Link
          href={`/manage?token=${encodeURIComponent(reference)}`}
          className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
        >
          Need to make changes later? Open Appointment Concierge
        </Link>
      </div>
    </div>
  );
}
