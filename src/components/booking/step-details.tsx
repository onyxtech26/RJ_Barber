'use client';

import { BookingState } from './booking-wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Phone, Mail, User, MessageCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface StepDetailsProps {
  state: BookingState;
  updateState: (updates: Partial<BookingState>) => void;
  onNext: () => void;
}

export function StepDetails({ state, updateState, onNext }: StepDetailsProps) {
  const isNextDisabled = !state.customerName.trim() || !state.customerPhone.trim();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="pb-2 border-b border-white/[0.06]">
        <span className="text-[11px] font-mono tracking-widest text-primary uppercase">Step 04 / 05</span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">Client Credentials</h2>
        <p className="text-muted-foreground text-sm">Where should we deliver your appointment ticket and WhatsApp alerts?</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-mono uppercase tracking-wider text-foreground">
            Full Name <span className="text-primary">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-primary/70" />
            <Input
              id="name"
              placeholder="e.g. Alexander Vance"
              className="pl-10 h-12 bg-[#14161C] border-white/[0.1] focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-foreground text-sm"
              value={state.customerName}
              onChange={(e) => updateState({ customerName: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Contact Info (Phone & Email) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs font-mono uppercase tracking-wider text-foreground">
              WhatsApp / Mobile Phone <span className="text-primary">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-primary/70" />
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 234-5678"
                className="pl-10 h-12 bg-[#14161C] border-white/[0.1] focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-foreground text-sm font-mono"
                value={state.customerPhone}
                onChange={(e) => updateState({ customerPhone: e.target.value })}
                required
              />
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">Include country code for WhatsApp sync</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-foreground">
              Email Address <span className="text-muted-foreground text-[10px] normal-case">(Optional)</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-primary/70" />
              <Input
                id="email"
                type="email"
                placeholder="alexander@example.com"
                className="pl-10 h-12 bg-[#14161C] border-white/[0.1] focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-foreground text-sm"
                value={state.customerEmail}
                onChange={(e) => updateState({ customerEmail: e.target.value })}
              />
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">For calendar invites (.ics)</p>
          </div>
        </div>

        {/* Special Requests */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-mono uppercase tracking-wider text-foreground">
            Styling Preferences & Special Requests
          </Label>
          <Textarea
            id="notes"
            placeholder="Tell your barber about your hair goals, scalp sensitivities, or preferred clipper guards..."
            className="min-h-[90px] resize-none bg-[#14161C] border-white/[0.1] focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-foreground text-sm leading-relaxed"
            value={state.notes}
            onChange={(e) => updateState({ notes: e.target.value })}
          />
        </div>

        {/* WhatsApp Concierge Opt-In Banner */}
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex items-start gap-4 transition-all">
          <div className="mt-1 p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground">WhatsApp Live Concierge</span>
              <Switch
                id="whatsapp"
                checked={state.whatsappOptin}
                onCheckedChange={(checked) => updateState({ whatsappOptin: checked })}
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Receive your confirmed ticket instantly, automated 2-hour arrival reminders, and one-tap rescheduling directly through our verified WhatsApp bot.
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/80 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Zero spam guarantee. Your details are strictly reserved for appointment logistics.</span>
        </div>
      </div>

      <div className="pt-4 border-t border-white/[0.06] flex justify-end">
        <Button
          onClick={onNext}
          disabled={isNextDisabled}
          size="lg"
          className="w-full sm:w-auto bg-primary text-black hover:bg-primary/90 font-bold px-8 shadow-[0_0_20px_rgba(212,164,55,0.25)]"
        >
          <span>Review & Confirm</span>
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
