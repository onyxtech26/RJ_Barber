import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, DollarSign, Users, Clock, ArrowUpRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Dashboard | RJ Barber Salon Admin',
};

// Mock data
const recentAppointments = [
  { id: '1', client: 'Michael Scott', service: 'Signature Fade', time: '10:00 AM', status: 'Completed', price: 40 },
  { id: '2', client: 'Jim Halpert', service: 'Classic Cut', time: '11:30 AM', status: 'In Progress', price: 35 },
  { id: '3', client: 'Dwight Schrute', service: 'Beard Sculpt', time: '1:00 PM', status: 'Upcoming', price: 25 },
  { id: '4', client: 'Ryan Howard', service: 'The Full Package', time: '2:30 PM', status: 'Upcoming', price: 75 },
  { id: '5', client: 'Stanley Hudson', service: 'Hot Towel Shave', time: '4:00 PM', status: 'Upcoming', price: 35 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-primary text-black font-bold hover:bg-primary/90">
            <Link href="/pos">
              <CreditCard className="h-4 w-4 mr-1.5" />
              Open POS Terminal
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/queue">
              <Users className="h-4 w-4 mr-1.5 text-primary" />
              Walk-in Bench
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/calendar">
              <CalendarDays className="h-4 w-4 mr-1.5" />
              View Calendar
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 font-medium inline-flex items-center"><ArrowUpRight className="h-3 w-3 mr-1"/>+2</span> from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (Today)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$425</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 font-medium inline-flex items-center"><ArrowUpRight className="h-3 w-3 mr-1"/>+15%</span> from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Walk-ins</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              4 spots remaining today
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1:00 PM</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dwight S. - Beard Sculpt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-5 bg-card border-border/50">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border/50">
              <div className="grid grid-cols-5 bg-secondary/50 p-3 text-sm font-medium text-muted-foreground">
                <div className="col-span-1">Time</div>
                <div className="col-span-1">Client</div>
                <div className="col-span-1">Service</div>
                <div className="col-span-1">Price</div>
                <div className="col-span-1 text-right">Status</div>
              </div>
              <div className="divide-y divide-border/50">
                {recentAppointments.map((apt) => (
                  <div key={apt.id} className="grid grid-cols-5 items-center p-3 text-sm">
                    <div className="col-span-1 font-medium">{apt.time}</div>
                    <div className="col-span-1">{apt.client}</div>
                    <div className="col-span-1 text-muted-foreground">{apt.service}</div>
                    <div className="col-span-1">${apt.price}</div>
                    <div className="col-span-1 text-right">
                      <Badge 
                        variant={
                          apt.status === 'Completed' ? 'default' : 
                          apt.status === 'In Progress' ? 'secondary' : 'outline'
                        }
                        className={apt.status === 'Completed' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 bg-card border-border/50">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <CalendarDays className="mr-2 h-4 w-4" /> Book Appointment
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" /> Add New Client
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <DollarSign className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
