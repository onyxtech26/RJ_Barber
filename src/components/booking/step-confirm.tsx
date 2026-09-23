'use client';

import { BookingState, BookingStepType } from './booking-wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Scissors, Calendar as CalendarIcon, User, MessageCircle, Clock, ShieldCheck, Edit3 } from 'lucide-react';
import { format } from 'date-fns';

interface StepConfirmProps {
  state: BookingState;
  onNext: () => void;
  isSubmitting: boolean;
  onEdit: (step: BookingStepType) => void;
}

export function StepConfirm({ state, onNext, isSubmitting, onEdit }: StepConfirmProps) {
  const formattedDate = state.startTime ? format(state.startTime, 'EEEE, MMMM do, yyyy') : 'Date not selected';
  const formattedTime = state.startTime ? format(state.startTime, 'h:mm a') : 'Time not selected';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="pb-2 border-b border-white/[0.06]">
        <span className="text-[11px] font-mono tracking-widest text-primary uppercase">Step 05 / 05</span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">Review & Confirm</h2>
        <p className="text-muted-foreground text-sm">Please verify your booking itinerary before finalizing.</p>
      </div>

      {/* Luxury Ticket Pass Summary */}
      <Card className="bg-[#14161C] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Ticket Header Strip */}
        <div className="bg-[#181B22] px-6 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-primary font-bold">
              RJ Barber Salon • Official Pass
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">
            Payment Due In-Shop
          </span>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Section 1: Service & Barber */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Scissors className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">{state.serviceName}</h3>
                <p className="text-xs text-primary font-medium">with Artisan {state.barberName}</p>
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <Clock className="w-3 h-3 text-primary" />
                  <span>{state.serviceDuration} Minutes Estimated Duration</span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-white/[0.04]">
              <span className="text-2xl font-mono font-bold text-primary">${state.servicePrice}.00</span>
              <button
                type="button"
                onClick={() => onEdit('service')}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-mono mt-1"
              >
                <Edit3 className="w-3 h-3" /> Change
              </button>
            </div>
          </div>

          {/* Section 2: Date & Time Schedule */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase font-mono tracking-wider text-muted-foreground">Reserved Schedule</p>
                <h4 className="font-semibold text-foreground text-base">{formattedDate}</h4>
                <p className="text-sm font-mono font-bold text-primary">{formattedTime}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onEdit('datetime')}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-mono self-start sm:self-center"
            >
              <Edit3 className="w-3 h-3" /> Change
            </button>
          </div>

          {/* Section 3: Client & WhatsApp Notification */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <User className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase font-mono tracking-wider text-muted-foreground">Client Contact</p>
                <h4 className="font-semibold text-foreground">{state.customerName}</h4>
                <p className="text-xs font-mono text-muted-foreground">{state.customerPhone}</p>
                {state.customerEmail && (
                  <p className="text-xs text-muted-foreground">{state.customerEmail}</p>
                )}
                {state.notes && (
                  <p className="text-xs text-muted-foreground/80 italic mt-1 bg-secondary/50 px-2.5 py-1 rounded">
                    "{state.notes}"
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onEdit('details')}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-mono self-start sm:self-center"
            >
              <Edit3 className="w-3 h-3" /> Change
            </button>
          </div>

          {/* WhatsApp Status Pill */}
          {state.whatsappOptin ? (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Instant confirmation pass & automated arrival reminders will dispatch to {state.customerPhone}</span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground font-mono">
              WhatsApp updates disabled. Please screenshot your confirmation reference.
            </div>
          )}

          {/* Pricing Itemization Table */}
          <div className="bg-[#111317] p-4 rounded-xl border border-white/[0.06] space-y-2 text-xs font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>Service Subtotal:</span>
              <span>${state.servicePrice}.00</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Reservation Lock Fee:</span>
              <span className="text-emerald-400">FREE ($0.00)</span>
            </div>
            <div className="flex justify-between text-foreground font-bold text-sm pt-2 border-t border-white/[0.06]">
              <span>Total Due In-Shop:</span>
              <span className="text-primary font-mono text-base">${state.servicePrice}.00</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Actions */}
      <div className="pt-2 text-center space-y-4">
        <Button
          onClick={onNext}
          disabled={isSubmitting}
          size="lg"
          className="w-full sm:w-auto px-12 h-14 text-base font-bold bg-primary text-black hover:bg-primary/90 shadow-[0_0_25px_rgba(212,164,55,0.3)] transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Securing Chair & Syncing WhatsApp...
            </>
          ) : (
            'Confirm Appointment Now'
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Pay at shop upon completion • Free 24h cancellation via WhatsApp</span>
        </div>
      </div>
    </div>
  );
}
