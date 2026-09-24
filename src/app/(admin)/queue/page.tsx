'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Clock, 
  Scissors, 
  UserPlus, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  AlertCircle,
  Phone,
  User,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Chair {
  id: number;
  barberName: string;
  barberId: string;
  status: 'occupied' | 'available' | 'cleaning';
  clientName?: string;
  clientPhone?: string;
  serviceName?: string;
  elapsedMinutes?: number;
  totalDuration?: number;
}

interface WalkIn {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  preferredBarber: string;
  waitTimeMins: number;
  joinedAt: string;
}

export default function QueueAndChairsPage() {
  const [chairs, setChairs] = useState<Chair[]>([
    {
      id: 1,
      barberName: 'RJ (Master Barber)',
      barberId: 'b1',
      status: 'occupied',
      clientName: 'Michael Scott',
      clientPhone: '+1 (555) 234-5678',
      serviceName: 'Signature Skin Fade',
      elapsedMinutes: 32,
      totalDuration: 45,
    },
    {
      id: 2,
      barberName: 'Marcus (Senior Barber)',
      barberId: 'b2',
      status: 'occupied',
      clientName: 'Jim Halpert',
      clientPhone: '+1 (555) 876-5432',
      serviceName: 'Classic Scissor Cut',
      elapsedMinutes: 18,
      totalDuration: 35,
    },
    {
      id: 3,
      barberName: 'David (Artisan)',
      barberId: 'b3',
      status: 'available',
    },
    {
      id: 4,
      barberName: 'Alex (Stylist)',
      barberId: 'b4',
      status: 'cleaning',
    },
  ]);

  const [queue, setQueue] = useState<WalkIn[]>([
    {
      id: 'w-1',
      customerName: 'Sam Rockwell',
      customerPhone: '+1 (555) 345-6789',
      serviceName: 'Buzz Cut / Taper',
      preferredBarber: 'Any Barber',
      waitTimeMins: 12,
      joinedAt: '10:15 AM',
    },
    {
      id: 'w-2',
      customerName: 'Derrick Rose',
      customerPhone: '+1 (555) 789-0123',
      serviceName: 'Executive Hot Towel Shave',
      preferredBarber: 'David (Artisan)',
      waitTimeMins: 20,
      joinedAt: '10:22 AM',
    },
    {
      id: 'w-3',
      customerName: 'Ethan Hunt',
      customerPhone: '+1 (555) 654-3210',
      serviceName: 'The Executive Combo',
      preferredBarber: 'RJ (Master Barber)',
      waitTimeMins: 35,
      joinedAt: '10:30 AM',
    },
  ]);

  // Add Walk-in Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newService, setNewService] = useState('Signature Skin Fade');
  const [newBarberPref, setNewBarberPref] = useState('Any Barber');

  const handleAddWalkIn = () => {
    if (!newName) return;
    const newEntry: WalkIn = {
      id: `w-${Date.now().toString().slice(-4)}`,
      customerName: newName,
      customerPhone: newPhone || 'Walk-in (No phone)',
      serviceName: newService,
      preferredBarber: newBarberPref,
      waitTimeMins: queue.length * 15 + 10,
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setQueue(prev => [...prev, newEntry]);
    setNewName('');
    setNewPhone('');
    setIsAddModalOpen(false);
  };

  const seatClientInChair = (walkInId: string, chairId: number) => {
    const walkIn = queue.find(w => w.id === walkInId);
    if (!walkIn) return;

    setChairs(prev => prev.map(chair => {
      if (chair.id === chairId) {
        return {
          ...chair,
          status: 'occupied',
          clientName: walkIn.customerName,
          clientPhone: walkIn.customerPhone,
          serviceName: walkIn.serviceName,
          elapsedMinutes: 1,
          totalDuration: 40,
        };
      }
      return chair;
    }));

    setQueue(prev => prev.filter(w => w.id !== walkInId));
  };

  const markChairClean = (chairId: number) => {
    setChairs(prev => prev.map(chair => {
      if (chair.id === chairId) {
        return {
          ...chair,
          status: 'available',
          clientName: undefined,
          clientPhone: undefined,
          serviceName: undefined,
          elapsedMinutes: undefined,
          totalDuration: undefined,
        };
      }
      return chair;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-7 w-7 text-primary" />
            <span>Chair & Walk-In Queue Hub</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Live chair occupancy, client seating timers, and fast walk-in queue management.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-black font-semibold hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            + New Walk-In
          </Button>
          <Button variant="outline" asChild className="border-white/10 hover:bg-white/[0.05]">
            <Link href="/pos">
              <CreditCard className="h-4 w-4 mr-2 text-primary" />
              Open POS Register
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#121418] border-white/[0.08]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block">Waiting in Queue</span>
              <span className="text-2xl font-bold text-foreground font-mono">{queue.length} Clients</span>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121418] border-white/[0.08]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block">Chairs Occupied</span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {chairs.filter(c => c.status === 'occupied').length} / {chairs.length}
              </span>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Scissors className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121418] border-white/[0.08]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block">Est. Wait Time</span>
              <span className="text-2xl font-bold text-foreground font-mono">~15 Mins</span>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121418] border-white/[0.08]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block">Served Today</span>
              <span className="text-2xl font-bold text-foreground font-mono">18 Cuts</span>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Chairs Grid */}
      <div>
        <h2 className="text-base font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>Active Barber Chairs</span>
          <span className="text-xs font-mono text-muted-foreground font-normal">({chairs.length} stations)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {chairs.map(chair => (
            <Card
              key={chair.id}
              className={`border transition-all ${
                chair.status === 'occupied'
                  ? 'border-emerald-500/30 bg-[#12161A]'
                  : chair.status === 'cleaning'
                  ? 'border-amber-500/30 bg-[#171612]'
                  : 'border-white/[0.08] bg-[#121418]'
              }`}
            >
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <div>
                  <span className="text-xs font-mono uppercase text-muted-foreground block">
                    Station 0{chair.id}
                  </span>
                  <CardTitle className="text-sm font-bold text-foreground">
                    {chair.barberName}
                  </CardTitle>
                </div>
                <Badge
                  className={`text-[10px] font-mono uppercase ${
                    chair.status === 'occupied'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : chair.status === 'cleaning'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-white/[0.05] text-muted-foreground border-white/10'
                  }`}
                >
                  {chair.status}
                </Badge>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-3">
                {chair.status === 'occupied' ? (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.05]">
                      <span className="text-xs font-bold text-foreground block truncate">
                        {chair.clientName}
                      </span>
                      <span className="text-[11px] text-primary block truncate">
                        {chair.serviceName}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Elapsed Time:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {chair.elapsedMinutes} / {chair.totalDuration} min
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, ((chair.elapsedMinutes || 0) / (chair.totalDuration || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      asChild
                      className="w-full h-8 text-xs font-bold bg-primary text-black hover:bg-primary/90 mt-2"
                    >
                      <Link href="/pos">
                        <span>Send to POS Checkout</span>
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ) : chair.status === 'cleaning' ? (
                  <div className="py-4 text-center space-y-2">
                    <RotateCcw className="h-6 w-6 text-amber-400 mx-auto animate-spin" />
                    <p className="text-xs text-muted-foreground">Station Sanitizing & Reset</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markChairClean(chair.id)}
                      className="h-7 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-950/20"
                    >
                      Mark Ready
                    </Button>
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-3">
                    <div className="h-8 w-8 rounded-full bg-white/[0.04] mx-auto flex items-center justify-center text-muted-foreground">
                      <Scissors className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-muted-foreground">Chair is open and ready for next client.</p>

                    {queue.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => seatClientInChair(queue[0].id, chair.id)}
                        className="w-full h-8 text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400"
                      >
                        Seat Next in Queue
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Walk-in Waiting Bench Table */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <span>Waiting Bench</span>
          <Badge variant="outline" className="border-white/10 font-mono text-xs">
            {queue.length} in line
          </Badge>
        </h2>

        <Card className="bg-[#121418] border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#16181D] border-b border-white/[0.08] text-xs font-mono uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Position</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Requested Service</th>
                  <th className="p-3">Barber Pref</th>
                  <th className="p-3">Check-in</th>
                  <th className="p-3">Est. Wait</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground text-xs">
                      No walk-ins currently waiting. All chairs caught up!
                    </td>
                  </tr>
                ) : (
                  queue.map((item, index) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-mono font-bold text-primary">#{index + 1}</td>
                      <td className="p-3">
                        <span className="font-semibold text-foreground block">{item.customerName}</span>
                        <span className="text-[11px] text-muted-foreground">{item.customerPhone}</span>
                      </td>
                      <td className="p-3 text-xs text-foreground font-medium">{item.serviceName}</td>
                      <td className="p-3 text-xs">
                        <Badge variant="outline" className="border-white/10 text-muted-foreground">
                          {item.preferredBarber}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{item.joinedAt}</td>
                      <td className="p-3 font-mono text-xs text-amber-400 font-semibold">
                        ~{item.waitTimeMins} mins
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {/* Seat action */}
                        {chairs.some(c => c.status === 'available') && (
                          <Button
                            size="sm"
                            onClick={() => {
                              const openChair = chairs.find(c => c.status === 'available');
                              if (openChair) seatClientInChair(item.id, openChair.id);
                            }}
                            className="h-7 text-xs bg-emerald-500 text-black hover:bg-emerald-400 font-semibold"
                          >
                            Seat Now
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="h-7 text-xs border-white/10 hover:bg-white/[0.05]"
                        >
                          <Link href="/pos">Direct POS</Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Walk-in Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md bg-[#121418] border-white/[0.1] text-foreground p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Walk-In Customer</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="text-muted-foreground block mb-1">Customer Full Name *</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Jordan Hayes"
                className="h-9 bg-[#16181D] border-white/[0.08]"
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Phone Number (for SMS / WhatsApp alert)</label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="h-9 bg-[#16181D] border-white/[0.08]"
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Select Service</label>
              <select
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                className="w-full h-9 bg-[#16181D] border border-white/[0.08] rounded-md px-3 text-xs text-foreground focus:outline-none"
              >
                <option value="Signature Skin Fade">Signature Skin Fade ($40)</option>
                <option value="Classic Scissor Cut">Classic Scissor Cut ($35)</option>
                <option value="Executive Hot Towel Shave">Executive Hot Towel Shave ($35)</option>
                <option value="The Executive Combo">The Executive Combo ($65)</option>
                <option value="Beard Sculpt & Razor Edge">Beard Sculpt & Razor Edge ($25)</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Barber Preference</label>
              <select
                value={newBarberPref}
                onChange={(e) => setNewBarberPref(e.target.value)}
                className="w-full h-9 bg-[#16181D] border border-white/[0.08] rounded-md px-3 text-xs text-foreground focus:outline-none"
              >
                <option value="Any Barber">First Available Barber</option>
                <option value="RJ (Master Barber)">RJ (Master Barber)</option>
                <option value="Marcus (Senior Barber)">Marcus (Senior Barber)</option>
                <option value="David (Artisan)">David (Artisan)</option>
                <option value="Alex (Stylist)">Alex (Stylist)</option>
              </select>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="border-white/10 hover:bg-white/[0.05]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddWalkIn}
              className="bg-primary text-black font-bold hover:bg-primary/90"
            >
              Add to Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
