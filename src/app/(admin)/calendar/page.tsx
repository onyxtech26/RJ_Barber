'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CreditCard, Users } from 'lucide-react';

const MOCK_BARBERS = ['James "RJ"', 'Mike J.', 'David L.'];
const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', 
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
];

const MOCK_APPOINTMENTS = [
  { id: '1', barber: 0, slot: 2, duration: 2, customer: 'Alex Carter', service: 'Haircut', status: 'confirmed' }, // blue
  { id: '2', barber: 1, slot: 0, duration: 1, customer: 'Brian Miller', service: 'Beard', status: 'completed' }, // gray
  { id: '3', barber: 1, slot: 4, duration: 2, customer: 'Chris Davis', service: 'Combo', status: 'in-chair' }, // green
  { id: '4', barber: 2, slot: 8, duration: 1, customer: 'Daniel Evans', service: 'Haircut', status: 'no-show' }, // red
];

export default function CalendarPage() {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-blue-500/20 border-blue-500/50 text-blue-200';
      case 'completed': return 'bg-neutral-600/20 border-neutral-600/50 text-neutral-300';
      case 'in-chair': return 'bg-green-500/20 border-green-500/50 text-green-200';
      case 'no-show': return 'bg-red-500/20 border-red-500/50 text-red-200';
      default: return 'bg-neutral-800 border-neutral-700 text-neutral-200';
    }
  };

  return (
    <div className="space-y-6 p-6 h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#D4A437]">Appointment Calendar</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Multi-barber daily timeline grid with live chair dispatch</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild className="bg-primary text-black font-bold hover:bg-primary/90 h-9 text-xs">
            <Link href="/pos">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Open POS Register
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-neutral-800 text-neutral-300 hover:bg-neutral-900 h-9 text-xs">
            <Link href="/queue">
              <Users className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Walk-in Bench
            </Link>
          </Button>
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-md">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-400 hover:text-white"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium px-2">Today</span>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-400 hover:text-white"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-md border border-neutral-800 bg-neutral-950 text-sm">
        <div className="grid grid-cols-[80px_1fr_1fr_1fr] min-w-[800px]">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-neutral-950 border-b border-r border-neutral-800 p-3 text-center text-neutral-400 font-medium">Time</div>
          {MOCK_BARBERS.map((barber, i) => (
            <div key={i} className="sticky top-0 z-10 bg-neutral-950 border-b border-r border-neutral-800 p-3 text-center text-[#D4A437] font-medium last:border-r-0">
              {barber}
            </div>
          ))}

          {/* Grid Body */}
          {TIME_SLOTS.map((time, slotIdx) => (
            <div key={slotIdx} className="contents group">
              <div className="border-b border-r border-neutral-800/50 p-2 text-xs text-neutral-500 text-right pr-3 bg-neutral-950/50">
                {time}
              </div>
              {MOCK_BARBERS.map((_, barberIdx) => {
                const apt = MOCK_APPOINTMENTS.find(a => a.barber === barberIdx && a.slot === slotIdx);
                const isCovered = MOCK_APPOINTMENTS.some(a => a.barber === barberIdx && slotIdx > a.slot && slotIdx < a.slot + a.duration);
                
                if (isCovered) return null;
                
                return (
                  <div 
                    key={barberIdx} 
                    className={`border-b border-r border-neutral-800/50 p-1 last:border-r-0 hover:bg-neutral-900/30 transition-colors relative min-h-[48px]`}
                    style={apt ? { gridRowEnd: `span ${apt.duration}` } : {}}
                  >
                    {apt && (
                      <div className={`w-full h-full rounded border p-2 flex flex-col gap-1 ${getStatusColor(apt.status)}`}>
                        <span className="font-medium text-xs leading-none">{apt.customer}</span>
                        <span className="text-[10px] opacity-80 leading-none">{apt.service}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
