import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Scissors, Star, MapPin, Clock, ShieldCheck, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Our Story & Team | RJ Barber Salon',
  description: 'Discover the craft behind RJ Barber Salon, meet our master artisans, and explore our shop atmosphere.',
};

const BARBERS = [
  {
    id: 1,
    name: 'RJ',
    title: 'Master Barber & Founder',
    specialty: 'Signature Skin Fades, Scissor Geometry & Traditional Lather Shaves',
    experience: '8+ Years Crafting',
    rating: '5.0',
    cuts: '4,500+ Cuts'
  },
  {
    id: 2,
    name: 'Marcus',
    title: 'Senior Precision Stylist',
    specialty: 'Low Drop Fades, Textured Crops & Hairline Architecture',
    experience: '5 Years Crafting',
    rating: '4.9',
    cuts: '2,800+ Cuts'
  },
  {
    id: 3,
    name: 'David',
    title: 'Grooming Artisan',
    specialty: 'Beard Sculpting, Facial Contouring & Botanical Steam Treatments',
    experience: '4 Years Crafting',
    rating: '4.8',
    cuts: '2,100+ Cuts'
  },
];

const PILLARS = [
  {
    num: '01',
    title: 'Surgical Precision Tooling',
    desc: 'We utilize Japanese 440C stainless steel shears and zero-gapped micro-motors, sharpened weekly to ensure flawless cut geometry.'
  },
  {
    num: '02',
    title: 'Organic Apothecary',
    desc: 'Every hot towel compress and tonic is infused with organic cedarwood, eucalyptus, and witch hazel—free from harsh chemicals.'
  },
  {
    num: '03',
    title: 'Unhurried Hospitality',
    desc: 'We never rush a chair. Each appointment includes a consultation, hot beverage or espresso, and dedicated time for your signature finish.'
  }
];

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden border-b border-white/[0.08]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,_rgba(212,164,55,0.12),transparent_70%)] pointer-events-none -z-10" />

        <div className="container px-4 text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-mono tracking-widest uppercase">
            <span>The Atelier & Heritage</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            Precision Grooming. <br />
            <span className="gold-gradient-text">Classic Hospitality.</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Founded in 2022 by Master Barber RJ, our salon was built on a single timeless tenet: a gentlemen’s haircut is not a maintenance chore—it is an artisanal ritual that shapes your confidence.
          </p>

          <div className="flex items-center justify-center pt-4">
            <div className="relative w-20 h-20 rounded-full border-2 border-primary/40 p-1 shadow-[0_0_25px_rgba(212,164,55,0.25)]">
              <Image
                src="/barber_logo.jpeg"
                alt="RJ Barber Salon Emblem"
                fill
                className="object-cover rounded-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Craft Pillars */}
      <section className="py-20 border-b border-white/[0.06] bg-[#0E1014]">
        <div className="container px-4 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-primary">The Philosophy</span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">How We Approach The Craft</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.num}
                className="bg-[#14161C] border border-white/[0.08] p-8 rounded-2xl relative overflow-hidden space-y-4 hover:border-primary/40 transition-colors"
              >
                <span className="text-3xl font-mono font-bold text-primary/40 block">
                  {pillar.num}
                </span>
                <h3 className="text-lg font-bold text-foreground">{pillar.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Master Barbers */}
      <section className="py-20 bg-background border-b border-white/[0.06]">
        <div className="container px-4 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-primary">The Collective</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Meet Your Master Artisans</h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              Decades of combined mastery behind the chair. Dedicated to consistent perfection with every stroke.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BARBERS.map((barber) => (
              <Card
                key={barber.id}
                className="bg-[#14161C] border border-white/[0.08] hover:border-primary/40 transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                <CardContent className="pt-8 pb-8 px-6 space-y-6">
                  {/* Avatar with gold ring */}
                  <div className="mx-auto w-24 h-24 rounded-full bg-[#181A20] flex items-center justify-center border-2 border-primary/30 shadow-lg group-hover:border-primary transition-colors">
                    <Avatar className="h-full w-full">
                      <AvatarFallback className="text-2xl font-bold font-mono bg-primary/10 text-primary">
                        {barber.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-foreground">{barber.name}</h3>
                    <p className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                      {barber.title}
                    </p>
                    <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
                      {barber.specialty}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/[0.06] text-xs font-mono text-muted-foreground">
                    <div className="bg-[#181A20] p-2 rounded">
                      <span className="block text-[10px] text-primary">RATING</span>
                      <span className="font-bold text-foreground flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 fill-primary text-primary" /> {barber.rating}
                      </span>
                    </div>
                    <div className="bg-[#181A20] p-2 rounded">
                      <span className="block text-[10px] text-primary">EXPERIENCE</span>
                      <span className="font-bold text-foreground">{barber.experience}</span>
                    </div>
                  </div>

                  <Button className="w-full text-xs font-mono uppercase tracking-wider font-bold" variant="outline" asChild>
                    <Link href={`/book`}>Reserve with {barber.name}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Shop Location & Hours */}
      <section className="py-20 bg-[#0E1014]">
        <div className="container px-4 max-w-5xl mx-auto">
          <div className="bg-[#14161C] border border-white/[0.08] rounded-2xl p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-mono">
                <MapPin className="w-3.5 h-3.5" />
                <span>Shop Coordinates</span>
              </div>

              <h2 className="text-3xl font-bold text-foreground">Visit The Grooming Studio</h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground block">RJ Barber Salon</strong>
                    <span className="text-muted-foreground">123 Style Avenue, Grooming District</span>
                    <span className="text-muted-foreground block">New York, NY 10001</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground block">Operating Hours</strong>
                    <span className="text-muted-foreground">Monday – Saturday: 9:00 AM – 7:00 PM</span>
                    <span className="text-muted-foreground block">Sunday: Closed for Razor Care</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button size="lg" className="bg-primary text-black hover:bg-primary/90 font-bold font-mono text-xs uppercase tracking-wider" asChild>
                  <Link href="/book">
                    <span>Book Your Visit</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative aspect-video md:aspect-square rounded-xl overflow-hidden border border-white/[0.08] bg-[#181B22] flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="relative w-24 h-24 rounded-full border-2 border-primary/40 p-1">
                <Image src="/barber_logo.jpeg" alt="RJ Barber Emblem" fill className="object-cover rounded-full" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">Haircuts & Shaves Since 2022</p>
                <p className="text-xs text-muted-foreground font-mono">Walk-ins welcomed when chairs permit</p>
                <p className="text-xs text-primary font-mono font-semibold">Priority given to online & WhatsApp bookings</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
