'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, Scissors, User, Phone, MessageCircle, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

function BookingManageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Load booking by token/reference
    const timer = setTimeout(() => {
      setIsValid(true);
      setBooking({
        id: token,
        reference: token.startsWith('RJ-') ? token : `RJ-${token.substring(0, 6).toUpperCase()}`,
        serviceName: 'Signature Fade & Beard Sculpt',
        barberName: 'RJ (Master Barber)',
        date: new Date(Date.now() + 86400000).toISOString(),
        duration: 45,
        status: 'confirmed',
        price: 45.00,
        phone: '+1 (555) 234-5678'
      });
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [token]);

  const handleReschedule = () => {
    setRescheduling(true);
    setMessage(null);
    setTimeout(() => {
      const nextDate = new Date(Date.now() + 172800000);
      setBooking((prev: any) => ({ ...prev, date: nextDate.toISOString() }));
      setRescheduling(false);
      setMessage({ type: 'success', text: 'Appointment rescheduled for 24 hours later. WhatsApp notification updated!' });
      toast.success('Appointment successfully rescheduled');
    }, 1000);
  };

  const handleCancel = () => {
    if (!confirm('Are you sure you want to cancel this appointment? Your chair will be released.')) return;

    setCancelling(true);
    setMessage(null);
    setTimeout(() => {
      setBooking((prev: any) => ({ ...prev, status: 'cancelled' }));
      setCancelling(false);
      setMessage({ type: 'success', text: 'Appointment cancelled. Confirmation sent via WhatsApp.' });
      toast.info('Appointment cancelled');
    }, 800);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Retrieving Reservation Pass...
        </p>
      </div>
    );
  }

  if (!token || !isValid) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="bg-[#14161C] border border-white/[0.08] p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Pass Expired or Invalid</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The booking reference token provided is not valid or has expired. Please check your WhatsApp confirmation message.
          </p>
          <Button asChild className="w-full bg-primary text-black font-bold font-mono text-xs uppercase tracking-wider">
            <Link href="/book">Book New Appointment</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-xl mx-auto px-4 py-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-primary/40">
            <Image src="/barber_logo.jpeg" alt="RJ Barber" fill className="object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Appointment Concierge</h1>
            <p className="text-xs font-mono text-primary">Official Self-Service Portal</p>
          </div>
        </div>

        <span
          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border uppercase ${
            booking.status === 'cancelled'
              ? 'bg-destructive/10 text-destructive border-destructive/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}
        >
          {booking.status}
        </span>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-mono border flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30'
              : 'bg-destructive/10 text-destructive border-destructive/30'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Reservation Card */}
      <div className="bg-[#14161C] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-[#181B22] p-4 border-b border-white/[0.06] flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">
              Reference Code
            </span>
            <span className="text-base font-mono font-bold text-primary tracking-wider">
              {booking.reference}
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Due In-Shop: <strong className="text-foreground">${booking.price}.00</strong>
          </span>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3">
            <Scissors className="w-4 h-4 text-primary shrink-0 mt-1" />
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase">Service & Barber</p>
              <h3 className="font-bold text-foreground text-base">{booking.serviceName}</h3>
              <p className="text-xs text-primary font-mono">{booking.barberName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CalendarIcon className="w-4 h-4 text-primary shrink-0 mt-1" />
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase">Scheduled Time</p>
              <h3 className="font-semibold text-foreground text-sm">
                {format(new Date(booking.date), 'EEEE, MMMM do, yyyy')}
              </h3>
              <p className="text-xs font-mono font-bold text-primary">
                {format(new Date(booking.date), 'h:mm a')} ({booking.duration} mins)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-3 border-t border-white/[0.06]">
            <Phone className="w-4 h-4 text-primary shrink-0 mt-1" />
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase">Client Contact</p>
              <p className="text-xs font-mono text-foreground">{booking.phone}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {booking.status !== 'cancelled' ? (
          <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleReschedule}
              disabled={rescheduling || cancelling}
              className="flex-1 border-white/[0.1] hover:border-primary/50 text-xs font-mono uppercase tracking-wider"
            >
              {rescheduling ? 'Updating Slot...' : 'Reschedule Date / Time'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={rescheduling || cancelling}
              className="flex-1 text-xs font-mono uppercase tracking-wider bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
            </Button>
          </div>
        ) : (
          <div className="p-6 pt-0">
            <Button asChild className="w-full bg-primary text-black font-bold font-mono text-xs uppercase tracking-wider">
              <Link href="/book">Book Another Time Slot</Link>
            </Button>
          </div>
        )}
      </div>

      {/* WhatsApp Helper Strip */}
      <div className="bg-[#14161C] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-foreground block">Prefer to chat on WhatsApp?</span>
            <span className="text-muted-foreground">Type "Change my booking" to our 24/7 AI agent.</span>
          </div>
        </div>

        <Button variant="ghost" size="sm" asChild className="text-xs font-mono text-primary hover:bg-primary/10">
          <a href="https://wa.me/15551234567" target="_blank" rel="noopener noreferrer">
            Open Chat <ArrowRight className="ml-1 w-3 h-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export default function BookingManagePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <BookingManageContent />
    </Suspense>
  );
}
