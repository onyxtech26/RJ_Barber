'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STATUS_ITEMS = [
  {
    prefix: 'LIVE ATELIER',
    text: 'CHAIRS ACTIVE TODAY',
    highlight: 'WALK-INS & RESERVATIONS',
  },
  {
    prefix: 'HANDCRAFTED',
    text: 'JAPANESE STEEL & HOT TOWEL STEAM',
    highlight: 'UNHURRIED RITUAL',
  },
  {
    prefix: 'META VERIFIED',
    text: 'WHATSAPP LIVE CONCIERGE',
    highlight: 'INSTANT PASS DELIVERY',
  }
];

export function AtelierBadge() {
  const [index, setIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % STATUS_ITEMS.length);
        setIsFading(false);
      }, 350);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const current = STATUS_ITEMS[index];

  return (
    <Link
      href="/book"
      className="group relative inline-flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 pr-3.5 sm:pr-4 rounded-full bg-[#111317]/95 border border-[#D4A437]/30 hover:border-[#D4A437] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_25px_rgba(212,164,55,0.25)] hover:-translate-y-0.5 cursor-pointer backdrop-blur-md"
    >
      {/* Subtle traveling metallic sheen across border */}
      <div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-transparent via-[#D4A437]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -z-10" />

      {/* Mini Barbershop Emblem / Cylindrical Animated Pole */}
      <div className="flex items-center gap-1.5 pl-1">
        {/* Animated Barber Pole Cylinder */}
        <div 
          className="relative w-3.5 h-6 rounded-sm overflow-hidden border border-[#D4A437]/50 shadow-inner shrink-0"
          title="Master Barber Atelier"
        >
          {/* Diagonal Barber Pole Stripes */}
          <div 
            className="absolute inset-0 w-full h-[200%]"
            style={{
              background: 'repeating-linear-gradient(135deg, #A82020 0px, #A82020 3px, #FFFFFF 3px, #FFFFFF 6px, #1A365D 6px, #1A365D 9px, #D4A437 9px, #D4A437 12px)',
              animation: 'barberPole 2.5s linear infinite'
            }}
          />
        </div>

        {/* Studio Hallmark Stamp */}
        <div className="hidden sm:flex items-center gap-1 bg-[#1A1D24] px-2 py-0.5 rounded-full border border-white/[0.06] text-[10px] font-mono tracking-widest text-[#D4A437] font-semibold">
          <span>MMXXII</span>
          <span className="text-muted-foreground/60 text-[8px]">•</span>
          <span className="text-foreground/80">EST.</span>
        </div>
      </div>

      {/* Mechanical Separator Notch */}
      <span className="text-[#D4A437]/40 text-xs font-mono select-none">◆</span>

      {/* Live Status Beacon */}
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </span>

        {/* Rotating Content with Smooth Fade Transition */}
        <div
          className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-mono tracking-wider transition-all duration-300 ${
            isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
          }`}
        >
          <span className="text-primary font-bold uppercase">{current.prefix}:</span>
          <span className="text-foreground font-medium uppercase hidden xs:inline">
            {current.text}
          </span>
          <span className="text-muted-foreground uppercase xs:hidden">
            {current.prefix}
          </span>
          <span className="text-muted-foreground/50 text-[10px] hidden md:inline">·</span>
          <span className="text-[10px] text-primary/80 uppercase tracking-widest hidden md:inline font-sans font-semibold bg-[#181B22] px-1.5 py-0.5 rounded border border-primary/20">
            {current.highlight}
          </span>
        </div>
      </div>

      {/* Right Micro Action Arrow */}
      <div className="w-4 h-4 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-[10px] ml-1 group-hover:translate-x-0.5 transition-transform duration-200">
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
