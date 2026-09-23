'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scissors } from 'lucide-react';

const CRAFT_HIGHLIGHTS = [
  {
    tag: 'SIGNATURE CRAFT',
    desc: 'Precision Razor Fades & Beard Architecture',
    action: 'Walk-ins & Bookings',
  },
  {
    tag: 'CLASSIC RITUAL',
    desc: 'Hot Towel Steam & Japanese Steel Shaves',
    action: 'Est. 2022',
  },
  {
    tag: 'THE ATELIER',
    desc: 'Bespoke Scissor Work & Scalp Treatments',
    action: 'Reserve Chair',
  },
];

export function AtelierBadge() {
  const [index, setIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % CRAFT_HIGHLIGHTS.length);
        setIsFading(false);
      }, 300);
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  const current = CRAFT_HIGHLIGHTS[index];

  return (
    <Link
      href="/book"
      className="group relative inline-flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 pr-3 sm:pr-4 rounded-full bg-[#12141A]/95 border border-[#D4A437]/35 hover:border-[#D4A437] transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_25px_rgba(212,164,55,0.22)] hover:-translate-y-0.5 cursor-pointer backdrop-blur-md max-w-[95vw]"
    >
      {/* Subtle traveling brass sheen on hover */}
      <div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-transparent via-[#D4A437]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -z-10" />

      {/* Barbershop Pole & Heritage Seal */}
      <div className="flex items-center gap-1.5 pl-1 shrink-0">
        {/* Animated Barber Pole Cylinder */}
        <div 
          className="relative w-3.5 h-6 rounded-sm overflow-hidden border border-[#D4A437]/60 shadow-inner shrink-0"
          title="RJ Barber Atelier"
        >
          {/* Authentic Diagonal Barber Pole Motion */}
          <div 
            className="absolute inset-0 w-full h-[200%]"
            style={{
              background: 'repeating-linear-gradient(135deg, #A82020 0px, #A82020 3px, #FFFFFF 3px, #FFFFFF 6px, #1A365D 6px, #1A365D 9px, #D4A437 9px, #D4A437 12px)',
              animation: 'barberPole 2.5s linear infinite'
            }}
          />
        </div>

        {/* Roman Numeral Founding Stamp */}
        <div className="hidden xs:flex items-center gap-1 bg-[#1A1D24] px-2 py-0.5 rounded-full border border-white/[0.08] text-[10px] font-mono tracking-widest text-[#D4A437] font-semibold">
          <span>MMXXII</span>
          <span className="text-muted-foreground/60 text-[8px]">•</span>
          <span className="text-foreground/80">EST.</span>
        </div>
      </div>

      {/* Brass Barber Tool Motif (Scissors) */}
      <div className="flex items-center gap-1 text-[#D4A437] shrink-0">
        <Scissors className="w-3.5 h-3.5 transform -rotate-45" />
      </div>

      {/* Rotating Craft Content */}
      <div className="flex items-center gap-2 overflow-hidden">
        <div
          className={`flex items-center gap-2 text-[11px] sm:text-xs font-mono tracking-wide transition-all duration-300 ${
            isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Category Tag in Gold */}
          <span className="text-[#D4A437] font-bold uppercase whitespace-nowrap">
            {current.tag}:
          </span>

          {/* Craft Description */}
          <span className="text-foreground/90 font-medium whitespace-nowrap hidden sm:inline">
            {current.desc}
          </span>
          <span className="text-foreground/90 font-medium whitespace-nowrap sm:hidden">
            {current.action}
          </span>

          {/* Separator & Pill */}
          <span className="text-muted-foreground/40 text-[10px] hidden md:inline">·</span>
          <span className="text-[10px] text-[#D4A437] uppercase tracking-wider hidden md:inline font-sans font-semibold bg-[#1A1D24] px-2 py-0.5 rounded border border-[#D4A437]/25 whitespace-nowrap">
            {current.action}
          </span>
        </div>
      </div>

      {/* Right Micro Action Arrow */}
      <div className="w-4 h-4 rounded-full bg-[#D4A437]/15 border border-[#D4A437]/35 flex items-center justify-center text-[#D4A437] text-[10px] shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform duration-200">
        →
      </div>

      {/* Embedded CSS keyframe for barber pole spin */}
      <style jsx>{`
        @keyframes barberPole {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </Link>
  );
}
