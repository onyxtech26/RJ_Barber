'use client';

import { useState } from 'react';
import { BookingState } from './booking-wizard';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Sparkles, Check, Scissors } from 'lucide-react';

interface StepServiceProps {
  state: BookingState;
  updateState: (updates: Partial<BookingState>) => void;
  onNext: () => void;
}

interface ServiceItem {
  id: string;
  name: string;
  desc: string;
  duration: number;
  price: number;
  highlight?: string;
  category: 'hair' | 'beard' | 'packages';
}

const SERVICES: ServiceItem[] = [
  {
    id: '1',
    name: 'Signature Fade',
    desc: 'Precision skin fade or taper with straight-edge razor line-up and styling finish.',
    duration: 45,
    price: 40,
    highlight: 'House Signature',
    category: 'hair'
  },
  {
    id: '2',
    name: 'Classic Gentlemen’s Cut',
    desc: 'Bespoke scissor and clipper architecture tailored to face profile and natural grain.',
    duration: 30,
    price: 35,
    category: 'hair'
  },
  {
    id: '3',
    name: 'Executive Buzz & Shape',
    desc: 'Uniform clipper cut with crisp hairline perimeter work and neck shave.',
    duration: 20,
    price: 25,
    category: 'hair'
  },
  {
    id: '5',
    name: 'Beard Sculpt & Contour',
    desc: 'Detailed beard trimming, cheek line razor definition, and organic beard oil treatment.',
    duration: 30,
    price: 25,
    category: 'beard'
  },
  {
    id: '6',
    name: 'Traditional Hot Towel Shave',
    desc: 'Warm botanical mist, rich warm shaving lather, straight razor glide, and cold towel close.',
    duration: 45,
    price: 35,
    highlight: 'Classic Ritual',
    category: 'beard'
  },
  {
    id: '8',
    name: 'The Master Experience',
    desc: 'Signature Fade + Beard Sculpting + Hot Towel Treatment + Hair Wash & Scalp Massage.',
    duration: 75,
    price: 75,
    highlight: 'Full Package',
    category: 'packages'
  }
];

export function StepService({ state, updateState, onNext }: StepServiceProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'hair' | 'beard' | 'packages'>('all');

  const filteredServices = activeCategory === 'all'
    ? SERVICES
    : SERVICES.filter(s => s.category === activeCategory);

  const handleSelect = (serviceId: string, name: string, duration: number, price: number) => {
    updateState({
      serviceId,
      serviceName: name,
      serviceDuration: duration,
      servicePrice: price
    });
    setTimeout(() => {
      onNext();
    }, 280);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-primary uppercase">Step 01 / 05</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">Select Service</h2>
          <p className="text-muted-foreground text-sm">Choose your grooming ritual crafted by master barbers.</p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-[#16181D] rounded-lg border border-white/[0.06]">
          {[
            { id: 'all', label: 'All Services' },
            { id: 'hair', label: 'Haircuts' },
            { id: 'beard', label: 'Beard & Shave' },
            { id: 'packages', label: 'Packages' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                activeCategory === tab.id
                  ? 'bg-primary text-black font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service) => {
          const isSelected = state.serviceId === service.id;

          return (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all duration-200 border relative overflow-hidden group hover:-translate-y-0.5 ${
                isSelected
                  ? 'border-primary bg-primary/10 gold-border-glow'
                  : 'border-white/[0.08] bg-[#14161C] hover:border-primary/40'
              }`}
              onClick={() => handleSelect(service.id, service.name, service.duration, service.price)}
            >
              {service.highlight && (
                <div className="absolute top-0 right-0 bg-primary/20 text-primary border-b border-l border-primary/30 text-[10px] font-mono tracking-wider px-2.5 py-0.5 rounded-bl uppercase">
                  {service.highlight}
                </div>
              )}

              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 pr-14">
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {service.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded">
                      <Clock className="h-3 w-3 text-primary" />
                      {service.duration} MIN
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-mono font-bold text-primary">
                      ${service.price}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-black'
                          : 'border-white/20 group-hover:border-primary/50'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
