import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Scissors, Sparkles, Check, MessageCircle, ArrowRight } from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  desc: string;
  duration: number;
  price: number;
  popular?: boolean;
  features: string[];
}

interface ServiceCategory {
  id: string;
  name: string;
  subtitle: string;
  services: ServiceItem[];
}

const CATEGORIES: ServiceCategory[] = [
  {
    id: 'hair',
    name: 'Precision Hair Architecture',
    subtitle: 'Crafted with master scissors and surgical clippers to harmonize with your cranial geometry.',
    services: [
      {
        id: '1',
        name: 'Signature Fade',
        desc: 'Seamless skin fade or low taper crafted with micro-foil shaver, hairline edge-up, and razor neck finish.',
        duration: 45,
        price: 40,
        popular: true,
        features: ['Skin taper / drop / burst fade', 'Straight-edge razor perimeter', 'Botanical styling finish']
      },
      {
        id: '2',
        name: 'Classic Gentlemen’s Cut',
        desc: 'Traditional shear and clipper work with customized texture, side-part definition, and neck taper.',
        duration: 30,
        price: 35,
        features: ['Precision scissor architecture', 'Hot lather neck trim', 'Matte clay styling']
      },
      {
        id: '3',
        name: 'Executive Buzz & Shape',
        desc: 'Uniform high-power clipper cut with surgical hairline alignment and warm bay rum spritz.',
        duration: 20,
        price: 25,
        features: ['Dual guard clipper blending', 'Razor sharp edge-up', 'Tonic refresh']
      },
      {
        id: '4',
        name: 'Young Gentlemen’s Cut',
        desc: 'Tailored haircut for boys under 12, delivered with patience and precision craftsmanship.',
        duration: 30,
        price: 30,
        features: ['Child-friendly styling', 'Gentle neck cleanup', 'Complimentary lollipop']
      }
    ]
  },
  {
    id: 'beard',
    name: 'Beard Sculpting & Traditional Shaving',
    subtitle: 'Old-world hot towel rituals blended with surgical razor precision and nourishing oils.',
    services: [
      {
        id: '5',
        name: 'Beard Sculpt & Contour',
        desc: 'Detailed beard architectural shaping, bulk reduction, razor cheek lines, and organic cedarwood oil soak.',
        duration: 30,
        price: 25,
        popular: true,
        features: ['Length gradation & graduation', 'Cheek & neckline straight razor', 'Beard balm conditioning']
      },
      {
        id: '6',
        name: 'Traditional Hot Towel Shave',
        desc: 'Eucalyptus steamed towels, warm pre-shave lather, Japanese feather blade glide, and cold compress close.',
        duration: 45,
        price: 35,
        features: ['3-Stage essential oil compress', 'Badger brush warm lathering', 'Cold witch hazel finish']
      },
      {
        id: '7',
        name: 'Quick Beard Tidy',
        desc: 'Express clipper cleanup and mustache outline for the gentleman on the go.',
        duration: 15,
        price: 18,
        features: ['Clipper shape up', 'Mustache trim', 'Beard mist']
      }
    ]
  },
  {
    id: 'packages',
    name: 'Curated Grooming Rituals',
    subtitle: 'The full indulgence. All-inclusive experiences for milestone days or total rejuvenation.',
    services: [
      {
        id: '8',
        name: 'The Master Experience',
        desc: 'Signature Fade + Precision Beard Sculpt + Hot Towel Eucalyptus Shave + Clarifying Hair Wash & Scalp Massage.',
        duration: 75,
        price: 75,
        popular: true,
        features: ['Signature Fade + Beard Sculpt', 'Full hot towel facial ritual', 'Scalp massage + Hair wash', 'Complimentary drink']
      },
      {
        id: '9',
        name: 'The Executive Refresh',
        desc: 'Classic Gentlemen’s Cut + Beard Tidy + Clarifying Shampoo & Charcoal Face Cleansing Mist.',
        duration: 60,
        price: 55,
        features: ['Haircut + Beard shaping', 'Invigorating shampoo wash', 'Cooling facial towel']
      }
    ]
  }
];

export const metadata = {
  title: 'Services & Menu | RJ Barber Salon',
  description: 'Explore our bespoke grooming menu including precision fades, traditional hot towel shaves, and executive packages.',
};

export default function ServicesPage() {
  return (
    <div className="relative py-16 md:py-24 overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,_rgba(212,164,55,0.1),transparent_70%)] pointer-events-none -z-10" />

      <div className="container px-4 max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-mono tracking-widest uppercase">
            <span>Bespoke Grooming Menu</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Artisan <span className="gold-gradient-text">Services</span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Every haircut and shave is an intentional ritual. Executed with Japanese steel, organic botanicals, and classic barbershop hospitality.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-20">
          {CATEGORIES.map((category) => (
            <section key={category.id} className="space-y-8">
              <div className="border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {category.name}
                  </h2>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-2xl">
                  {category.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.services.map((service) => (
                  <Card
                    key={service.id}
                    className={`bg-[#14161C] border transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between ${
                      service.popular
                        ? 'border-primary/40 shadow-[0_10px_30px_rgba(212,164,55,0.12)]'
                        : 'border-white/[0.08] hover:border-primary/40'
                    }`}
                  >
                    {service.popular && (
                      <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-mono font-bold tracking-widest px-3 py-1 rounded-bl-lg uppercase">
                        Client Favorite
                      </div>
                    )}

                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <CardTitle className="text-xl font-bold text-foreground">
                          {service.name}
                        </CardTitle>
                        <span className="text-2xl font-mono font-bold text-primary shrink-0">
                          ${service.price}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1 text-xs font-mono text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{service.duration} Minutes</span>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground leading-relaxed pt-2">
                        {service.desc}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 pt-0 space-y-4">
                      <div className="space-y-1.5 pt-3 border-t border-white/[0.06]">
                        {service.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="w-3 h-3 text-primary shrink-0 stroke-[2.5]" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>

                    <CardFooter className="p-6 pt-0">
                      <Button
                        className="w-full text-xs font-mono uppercase tracking-wider font-bold h-11"
                        variant={service.popular ? "default" : "outline"}
                        asChild
                      >
                        <Link href={`/book`}>
                          <span>Reserve Spot</span>
                          <ArrowRight className="ml-2 w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* WhatsApp Concierge Booking Strip */}
        <div className="relative rounded-2xl p-8 md:p-12 border border-white/[0.08] bg-[#14161C] overflow-hidden text-center space-y-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,164,55,0.08),transparent_70%)] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Direct WhatsApp Concierge</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              Prefer to book via WhatsApp conversation?
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Our automated WhatsApp booking agent is online 24/7. Ask questions about styles, check real-time chair availability, and confirm bookings directly from your phone.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button size="lg" className="w-full sm:w-auto bg-primary text-black hover:bg-primary/90 font-bold font-mono text-xs uppercase tracking-wider" asChild>
                <Link href="/book">Use Web Reservation</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/30 font-mono text-xs uppercase tracking-wider" asChild>
                <a href="https://wa.me/15551234567?text=Hi%20RJ%20Barber%20Salon,%20I'd%20like%20to%20book%20an%20appointment" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
