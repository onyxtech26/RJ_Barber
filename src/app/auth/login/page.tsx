'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Scissors, 
  Loader2, 
  CreditCard, 
  KeyRound, 
  UserCheck, 
  ShieldCheck, 
  Lock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  
  // Standard credentials
  const [email, setEmail] = useState('admin@rjbarbersalon.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  // Quick Station PIN
  const [pin, setPin] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('Cashier Station #1');

  const staffRoster = [
    { name: 'Cashier Station #1', role: 'Front Desk / POS', pin: '0000', defaultPath: '/pos' },
    { name: 'RJ (Master Barber)', role: 'Owner & Artisan', pin: '1111', defaultPath: '/pos' },
    { name: 'Marcus (Senior Stylist)', role: 'Chair #2', pin: '2222', defaultPath: '/queue' },
    { name: 'Shop Manager', role: 'Executive Operations', pin: '9999', defaultPath: '/dashboard' },
  ];

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      toast.success('Authenticated successfully. Opening POS System...');
      router.push('/pos');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleClearPin = () => {
    setPin('');
  };

  const verifyPin = async (enteredPin: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const staff = staffRoster.find(s => s.name === selectedStaff);
    if (staff && staff.pin === enteredPin) {
      toast.success(`Welcome, ${staff.name}!`);
      router.push(staff.defaultPath);
      router.refresh();
    } else {
      toast.error('Incorrect 4-digit PIN. (Demo PINs: 0000, 1111, 2222, 9999)');
      setPin('');
      setIsLoading(false);
    }
  };

  const handleFastPreset = (staff: typeof staffRoster[0]) => {
    setSelectedStaff(staff.name);
    setPin(staff.pin);
    toast.success(`Logging in as ${staff.name}...`);
    setTimeout(() => {
      router.push(staff.defaultPath);
      router.refresh();
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#090A0D] p-4 text-foreground selection:bg-primary selection:text-black">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/50 to-amber-500/30 blur-md opacity-75"></div>
            <div className="relative h-16 w-16 rounded-full border-2 border-primary/60 p-0.5 bg-[#121418] overflow-hidden shadow-xl">
              <Image
                src="/barber_logo.jpeg"
                alt="RJ Barber Salon Logo"
                width={64}
                height={64}
                className="h-full w-full object-cover rounded-full"
                priority
              />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-wider uppercase text-foreground">
              RJ BARBER SALON
            </h1>
            <p className="text-xs font-mono text-primary uppercase tracking-widest">
              POS Terminal & Operations Access
            </p>
          </div>
        </div>

        {/* Auth Mode Tabs: Fast PIN Station vs Email/Password */}
        <Card className="border-white/[0.08] shadow-2xl bg-[#121418]/90 backdrop-blur-md">
          <Tabs defaultValue="pin" className="w-full">
            <div className="px-6 pt-5 pb-2">
              <TabsList className="grid grid-cols-2 bg-[#1A1D24] border border-white/[0.05] p-1 h-10">
                <TabsTrigger value="pin" className="text-xs font-mono data-[state=active]:bg-primary data-[state=active]:text-black font-semibold">
                  <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                  Station PIN
                </TabsTrigger>
                <TabsTrigger value="credentials" className="text-xs font-mono data-[state=active]:bg-primary data-[state=active]:text-black font-semibold">
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  Staff Email
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: QUICK 4-DIGIT STATION PIN PAD (Salon Industry Standard) */}
            <TabsContent value="pin" className="p-6 pt-3 space-y-4">
              <div className="space-y-1.5 text-center">
                <Label className="text-xs text-muted-foreground">Select Operating Station / Barber</Label>
                <select
                  value={selectedStaff}
                  onChange={(e) => {
                    setSelectedStaff(e.target.value);
                    setPin('');
                  }}
                  className="w-full h-10 bg-[#181B22] border border-white/[0.1] rounded-lg px-3 text-sm font-semibold text-foreground focus:outline-none focus:border-primary"
                >
                  {staffRoster.map(staff => (
                    <option key={staff.name} value={staff.name}>
                      {staff.name} · {staff.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* PIN Display Dots */}
              <div className="flex justify-center items-center gap-3 py-2">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                      pin.length > index
                        ? 'bg-primary border-primary scale-110 shadow-[0_0_10px_rgba(212,164,55,0.5)]'
                        : 'border-white/20 bg-transparent'
                    }`}
                  />
                ))}
              </div>

              {/* 3x4 Touch PIN Keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handlePinDigit(digit)}
                    disabled={isLoading}
                    className="h-12 rounded-xl bg-[#1A1E26] hover:bg-primary hover:text-black border border-white/[0.06] text-lg font-mono font-bold text-foreground transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearPin}
                  className="h-12 rounded-xl bg-[#1A1E26] hover:bg-red-950/40 text-red-400 border border-white/[0.06] text-xs font-mono font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handlePinDigit('0')}
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-[#1A1E26] hover:bg-primary hover:text-black border border-white/[0.06] text-lg font-mono font-bold text-foreground transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => verifyPin(pin)}
                  disabled={pin.length !== 4 || isLoading}
                  className="h-12 rounded-xl bg-primary text-black disabled:opacity-40 disabled:hover:bg-primary disabled:hover:text-black hover:bg-primary/90 font-mono font-bold text-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-md"
                >
                  ENTER
                </button>
              </div>

              {/* 1-Click Fast Bypass Demo Buttons */}
              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block text-center">
                  Quick 1-Click Station Unlock:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {staffRoster.slice(0, 2).map(staff => (
                    <button
                      key={staff.name}
                      type="button"
                      onClick={() => handleFastPreset(staff)}
                      className="p-2 rounded-lg bg-[#181B22] hover:bg-primary/10 border border-white/[0.08] hover:border-primary/40 text-left transition-all text-xs"
                    >
                      <span className="font-bold text-foreground block truncate">{staff.name.split(' ')[0]}</span>
                      <span className="text-[10px] text-primary font-mono block">PIN: {staff.pin} → POS</span>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: STANDARD EMAIL & PASSWORD */}
            <TabsContent value="credentials" className="p-6 pt-3">
              <form onSubmit={handleStandardLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs text-muted-foreground">Staff Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@rjbarbersalon.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    className="bg-[#181B22] border-white/[0.08] h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="bg-[#181B22] border-white/[0.08] h-10 text-sm font-mono"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full font-bold text-sm h-11 bg-primary text-black hover:bg-primary/90 mt-2" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Unlocking Terminal...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Sign In to POS
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        
        {/* Footer info */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Encrypted Point of Sale & Booking System
          </p>
          <p>&copy; {new Date().getFullYear()} RJ Barber Salon. Internal Operations Only.</p>
        </div>
      </div>
    </div>
  );
}
