'use client';

import { useState, useEffect } from 'react';
import { BookingState } from './booking-wizard';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Sun, Sunset, ArrowRight } from 'lucide-react';

interface StepDatetimeProps {
  state: BookingState;
  updateState: (updates: Partial<BookingState>) => void;
  onNext: () => void;
}

const MORNING_TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const AFTERNOON_TIMES = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

export function StepDatetime({ state, updateState, onNext }: StepDatetimeProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(state.date || undefined);
  const [selectedTimeStr, setSelectedTimeStr] = useState<string | null>(
    state.startTime ? format(state.startTime, 'HH:mm') : null
  );

  useEffect(() => {
    if (state.date) {
      setSelectedDate(state.date);
    }
    if (state.startTime) {
      setSelectedTimeStr(format(state.startTime, 'HH:mm'));
    }
  }, [state.date, state.startTime]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    updateState({ date: date || null, startTime: null });
    setSelectedTimeStr(null);
  };

  const handleTimeSelect = (timeStr: string) => {
    setSelectedTimeStr(timeStr);
    if (selectedDate) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(hours, minutes, 0, 0);
      updateState({ startTime: newDateTime });
    }
  };

  const isNextDisabled = !selectedDate || !selectedTimeStr;

  const formatDisplayTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="pb-2 border-b border-white/[0.06]">
        <span className="text-[11px] font-mono tracking-widest text-primary uppercase">Step 03 / 05</span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">Select Date & Time</h2>
        <p className="text-muted-foreground text-sm">Reserve your designated chair with zero waiting queue.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Picker */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-primary uppercase tracking-wider font-semibold">
              01. Choose Appointment Date
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">Mon–Sat (9AM–7PM)</span>
          </div>

          <div className="bg-[#14161C] border border-white/[0.08] rounded-xl p-3 flex justify-center shadow-inner">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today || date.getDay() === 0; // Disable past and Sundays
              }}
              className="rounded-md"
            />
          </div>
        </div>

        {/* Time Slot Picker */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-primary uppercase tracking-wider font-semibold">
              02. Choose Available Time
            </span>
            {selectedDate && (
              <span className="text-[11px] font-mono text-foreground">
                {format(selectedDate, 'EEE, MMM d')}
              </span>
            )}
          </div>

          {selectedDate ? (
            <div className="space-y-4">
              {/* Morning Slots */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <Sun className="w-3.5 h-3.5 text-primary" />
                  <span>MORNING SESSION</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MORNING_TIMES.map((time) => {
                    const isSelected = selectedTimeStr === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeSelect(time)}
                        className={`py-2.5 px-2 rounded-lg text-xs font-mono font-medium transition-all text-center border ${
                          isSelected
                            ? 'bg-primary text-black font-bold border-primary shadow-[0_0_12px_rgba(212,164,55,0.4)] scale-[1.02]'
                            : 'bg-[#16181D] border-white/[0.08] text-foreground hover:border-primary/50 hover:bg-[#1E2128]'
                        }`}
                      >
                        {formatDisplayTime(time)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Afternoon Slots */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <Sunset className="w-3.5 h-3.5 text-primary" />
                  <span>AFTERNOON & EVENING</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {AFTERNOON_TIMES.map((time) => {
                    const isSelected = selectedTimeStr === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeSelect(time)}
                        className={`py-2.5 px-2 rounded-lg text-xs font-mono font-medium transition-all text-center border ${
                          isSelected
                            ? 'bg-primary text-black font-bold border-primary shadow-[0_0_12px_rgba(212,164,55,0.4)] scale-[1.02]'
                            : 'bg-[#16181D] border-white/[0.08] text-foreground hover:border-primary/50 hover:bg-[#1E2128]'
                        }`}
                      >
                        {formatDisplayTime(time)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.1] rounded-xl bg-[#14161C]/50">
              <CalendarIcon className="w-8 h-8 text-primary/40 mb-3" />
              <p className="text-sm text-foreground font-medium">Select a date on the calendar</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                Available slots for your chosen barber will appear here instantly.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Schedule Banner & CTA */}
      <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto">
          {selectedDate && selectedTimeStr ? (
            <div className="flex items-center gap-2.5 bg-primary/10 border border-primary/30 px-3.5 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <div className="text-xs">
                <span className="text-muted-foreground">Reserved: </span>
                <span className="font-mono font-bold text-foreground">
                  {format(selectedDate, 'EEE, MMM d, yyyy')} @ {formatDisplayTime(selectedTimeStr)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground font-mono">
              Please choose both a date and time slot to continue.
            </span>
          )}
        </div>

        <Button
          onClick={onNext}
          disabled={isNextDisabled}
          size="lg"
          className="w-full sm:w-auto bg-primary text-black hover:bg-primary/90 font-bold px-8 shadow-[0_0_20px_rgba(212,164,55,0.25)]"
        >
          <span>Continue to Details</span>
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
