'use client';

import { BookingState } from './booking-wizard';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Star } from 'lucide-react';

interface StepBarberProps {
  state: BookingState;
  updateState: (updates: Partial<BookingState>) => void;
  onNext: () => void;
}

const BARBERS = [
  { id: '1', name: 'RJ', role: 'Master Barber & Founder', specialty: 'Signature Fades & Hot Razor Shaves', exp: '8+ yrs', rating: '5.0' },
  { id: '2', name: 'Marcus', role: 'Senior Stylist', specialty: 'Precision Tapers & Scissor Architecture', exp: '5 yrs', rating: '4.9' },
  { id: '3', name: 'David', role: 'Grooming Artisan', specialty: 'Beard Sculpting & Traditional Lather', exp: '4 yrs', rating: '4.8' },
];

export function StepBarber({ state, updateState, onNext }: StepBarberProps) {
  const handleSelect = (barberId: string, name: string) => {
    updateState({
      barberId,
      barberName: name
    });
    setTimeout(() => {
      onNext();
    }, 300);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Select Barber</h2>
        <p className="text-muted-foreground">Choose your preferred barber or select any available.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Any Available Option */}
        <Card 
          className={`cursor-pointer transition-all duration-200 border-2 hover:border-primary/50 sm:col-span-2 md:col-span-1 ${
            state.barberId === 'any' ? 'border-primary bg-primary/5' : 'border-border/50 bg-card'
          }`}
          onClick={() => handleSelect('any', 'Any Available')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              state.barberId === 'any' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
            }`}>
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Any Available</h3>
              <p className="text-sm text-muted-foreground">First available time slot</p>
            </div>
          </CardContent>
        </Card>

        {/* Individual Barbers */}
        {BARBERS.map((barber) => {
          const isSelected = state.barberId === barber.id;
          
          return (
            <Card 
              key={barber.id} 
              className={`cursor-pointer transition-all duration-300 border-2 hover:border-primary/60 hover:-translate-y-0.5 ${
                isSelected ? 'border-primary bg-primary/10 gold-border-glow' : 'border-border/50 bg-card'
              }`}
              onClick={() => handleSelect(barber.id, barber.name)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary/40">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                    {barber.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{barber.name}</h3>
                      <p className="text-xs text-primary font-medium">{barber.role}</p>
                    </div>
                    <div className="flex items-center text-xs text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">
                      <Star className="h-3 w-3 mr-1 fill-primary" />
                      {barber.rating}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{barber.specialty}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Exp: {barber.exp}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
