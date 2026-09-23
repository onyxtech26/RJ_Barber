import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Scissors, 
  Brush, 
  Flame, 
  Crown, 
  Clock, 
  CheckCircle2, 
  Star, 
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { AtelierBadge } from '@/components/home/atelier-badge';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden radial-ambient pt-16 pb-24 md:pt-24 md:pb-32 lg:pt-32 lg:pb-40 border-b border-border/40">
        <div className="container relative z-10 px-4 sm:px-6 flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto">
          
          {/* Logo Crest */}
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/50 via-amber-300/30 to-primary/50 blur-lg opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full border-2 border-primary/80 p-1 bg-card shadow-2xl">
              <Image 
                src="/barber_logo.jpeg" 
                alt="RJ Barber Salon Crest" 
                width={128} 
                height={128} 
                className="h-full w-full rounded-full object-cover" 
                priority 
              />
            </div>
          </div>

          {/* Bespoke Atelier Hallmark & Live Registry */}
          <AtelierBadge />

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl">
            Precision Cuts. <br className="hidden sm:inline" />
            <span className="gold-gradient-text">Timeless Craftsmanship.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
            A ritual of unhurried grooming. Step into RJ Barber Salon for bespoke razor architecture, hot lather shaves, and sharp styling designed for the modern gentleman.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2 w-full sm:w-auto">
            <Button size="lg" className="h-14 px-9 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gold-glow transition-all duration-300" asChild>
              <Link href="/book" className="flex items-center justify-center gap-2">
                <span>Book Your Chair</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border hover:border-primary/50 hover:bg-secondary transition-all duration-300" asChild>
              <Link href="/services">View Services & Pricing</Link>
            </Button>
          </div>

          {/* Trust Highlights Strip */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 w-full border-t border-border/30 mt-8">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-primary mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">4.9 / 5 Rating</span>
              <span className="text-xs text-muted-foreground">Over 500+ Reviews</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="font-mono text-xl font-bold text-foreground mb-1">10,000+</span>
              <span className="text-sm font-semibold text-foreground">Cuts Delivered</span>
              <span className="text-xs text-muted-foreground">Since 2022</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-foreground mb-1">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">Zero Double Book</span>
              </div>
              <span className="text-xs text-muted-foreground">Real-time Slot Locks</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-green-500 mb-1">
                <MessageSquare className="h-5 w-5" />
                <span className="font-semibold text-sm text-foreground">WhatsApp Live</span>
              </div>
              <span className="text-xs text-muted-foreground">Reminders & Updates</span>
            </div>
          </div>

        </div>
      </section>

      {/* Signature Services Section */}
      <section className="w-full py-24 bg-card/40 border-b border-border/40">
        <div className="container px-4 sm:px-6 space-y-14 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-primary">Artisanal Grooming</div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Signature Services</h2>
              <p className="text-muted-foreground max-w-xl">
                Every service is delivered with surgical precision, clean lines, and premium styling pomades.
              </p>
            </div>
            <Link href="/services" className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5 shrink-0">
              <span>View Full Menu</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Service 1 */}
            <Card className="bg-card border-border/60 hover:border-primary/60 transition-all duration-300 group hover:-translate-y-1 shadow-sm flex flex-col justify-between">
              <CardHeader>
                <div className="mb-4 bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Scissors className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Signature Fade</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Custom skin, taper, or burst fade with crisp razor line-up and styling finish.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    <span>45 MIN</span>
                  </div>
                  <span className="font-mono text-xl font-bold text-foreground">$40.00</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full group-hover:border-primary group-hover:text-primary transition-colors" asChild>
                  <Link href="/book">Book This Service</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Service 2 */}
            <Card className="bg-card border-border/60 hover:border-primary/60 transition-all duration-300 group hover:-translate-y-1 shadow-sm flex flex-col justify-between">
              <CardHeader>
                <div className="mb-4 bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Brush className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Beard Sculpt</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Detailed clipper shaping, hot lather razor edge, and nourishing beard oil finish.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    <span>30 MIN</span>
                  </div>
                  <span className="font-mono text-xl font-bold text-foreground">$25.00</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full group-hover:border-primary group-hover:text-primary transition-colors" asChild>
                  <Link href="/book">Book This Service</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Service 3 */}
            <Card className="bg-card border-border/60 hover:border-primary/60 transition-all duration-300 group hover:-translate-y-1 shadow-sm flex flex-col justify-between">
              <CardHeader>
                <div className="mb-4 bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Flame className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Hot Towel Shave</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Eucalyptus hot towels, pre-shave cream, straight-edge razor, and cold towel close.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    <span>45 MIN</span>
                  </div>
                  <span className="font-mono text-xl font-bold text-foreground">$35.00</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full group-hover:border-primary group-hover:text-primary transition-colors" asChild>
                  <Link href="/book">Book This Service</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Service 4 - Featured */}
            <Card className="bg-card border-primary/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-md flex flex-col justify-between gold-border-glow">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold font-mono px-3 py-1 rounded-bl-lg tracking-wider">
                SIGNATURE RITUAL
              </div>
              <CardHeader>
                <div className="mb-4 bg-primary text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center shadow-md">
                  <Crown className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">The Full Package</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Signature haircut, tailored beard trim, hot towel straight shave, and shampoo wash.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    <span>75 MIN</span>
                  </div>
                  <span className="font-mono text-xl font-bold text-primary">$75.00</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" asChild>
                  <Link href="/book">Book The Package</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* The Ritual / 4-Step Experience */}
      <section className="w-full py-24 bg-background border-b border-border/40">
        <div className="container px-4 sm:px-6 max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-primary">The RJ Standard</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">The 4-Step Grooming Ritual</h2>
            <p className="text-muted-foreground">
              Every appointment follows our dedicated standard to ensure you walk out looking exceptional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col space-y-3 p-6 rounded-2xl bg-card/60 border border-border/50">
              <span className="font-mono text-3xl font-bold text-primary/40">01</span>
              <h3 className="font-semibold text-lg text-foreground">Style Consultation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We analyze your head shape, hair texture, and daily styling routine before picking up shears.
              </p>
            </div>

            <div className="flex flex-col space-y-3 p-6 rounded-2xl bg-card/60 border border-border/50">
              <span className="font-mono text-3xl font-bold text-primary/40">02</span>
              <h3 className="font-semibold text-lg text-foreground">Precision Architecture</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Clean scissor-over-comb cuts and graduated fades with high-torque magnetic clippers.
              </p>
            </div>

            <div className="flex flex-col space-y-3 p-6 rounded-2xl bg-card/60 border border-border/50">
              <span className="font-mono text-3xl font-bold text-primary/40">03</span>
              <h3 className="font-semibold text-lg text-foreground">Hot Towel & Straight Razor</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Steamed towels soften whiskers, followed by Japanese steel razor work on the neckline and temples.
              </p>
            </div>

            <div className="flex flex-col space-y-3 p-6 rounded-2xl bg-card/60 border border-border/50">
              <span className="font-mono text-3xl font-bold text-primary/40">04</span>
              <h3 className="font-semibold text-lg text-foreground">Tonic, Splash & Finish</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Invigorating bay rum aftershave splash, cooling tonic massage, and matte clay styling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Seamless Experience Banner */}
      <section className="w-full py-20 bg-card/70 border-b border-border/40">
        <div className="container px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-secondary/40 to-card p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
              <div className="lg:col-span-3 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono uppercase tracking-wider">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp Real-Time Sync</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Book on Web. Confirm & Reschedule on WhatsApp.
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  No accounts to create. No apps to download. Book your slot online in 60 seconds, and we’ll send automated confirmations, 24-hour reminders, and 1-click reschedule buttons right to your WhatsApp.
                </p>
                <div className="flex flex-wrap gap-4 pt-2 text-xs font-mono text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Instant Confirmation</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>24h & 2h Reminder Alerts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>1-Tap Reschedule</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 bg-background/80 rounded-2xl border border-border/50 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Official Business API</h4>
                  <p className="text-xs text-muted-foreground mt-1">Meta Cloud Verified Webhook</p>
                </div>
                <Button className="w-full bg-primary text-primary-foreground font-semibold" asChild>
                  <Link href="/book">Schedule Your Visit</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Action Invitation */}
      <section className="w-full py-24 bg-background relative overflow-hidden">
        <div className="container relative z-10 px-4 sm:px-6 text-center space-y-6 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 font-mono uppercase tracking-widest text-xs">
            Reserve Ahead
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Ready to Look Your Absolute Best?
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Select your preferred barber, choose a time that fits your calendar, and step into our chairs for an unmatched grooming experience.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-14 px-10 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 gold-glow" asChild>
              <Link href="/book">Book Your Appointment Now</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border hover:bg-secondary" asChild>
              <Link href="/about">Meet The Barbers</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
