'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#D4A437]">Settings</h1>
        <p className="text-neutral-400 mt-1">Manage your barber shop configurations and integrations.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-neutral-950 border border-neutral-800 mb-4">
          <TabsTrigger value="general" className="data-[state=active]:bg-neutral-900 data-[state=active]:text-[#D4A437]">General</TabsTrigger>
          <TabsTrigger value="hours" className="data-[state=active]:bg-neutral-900 data-[state=active]:text-[#D4A437]">Operating Hours</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-neutral-900 data-[state=active]:text-[#D4A437]">Integrations</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-neutral-900 data-[state=active]:text-[#D4A437]">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Shop Information</CardTitle>
              <CardDescription className="text-neutral-400">Update your shop's basic details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shop-name">Shop Name</Label>
                <Input id="shop-name" defaultValue="RJ Barber Salon" className="bg-neutral-900 border-neutral-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue="123 Fade Avenue, Styling City, SC 12345" className="bg-neutral-900 border-neutral-800" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue="(555) 123-4567" className="bg-neutral-900 border-neutral-800" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="hello@rjbarber.com" className="bg-neutral-900 border-neutral-800" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-[#D4A437] hover:bg-[#b58c2f] text-black">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Operating Hours</CardTitle>
              <CardDescription className="text-neutral-400">Set the default shop hours. Barbers can have individual schedules within these hours.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-4 p-3 rounded-md bg-neutral-900/50 border border-neutral-800">
                  <div className="w-28 flex items-center space-x-2">
                    <Switch id={`shop-day-${day}`} defaultChecked={day !== 'Sunday'} />
                    <Label htmlFor={`shop-day-${day}`} className="text-white">{day}</Label>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <Input type="time" defaultValue="09:00" className="h-9 w-32 bg-neutral-900 border-neutral-800" disabled={day === 'Sunday'} />
                    <span className="text-neutral-500">to</span>
                    <Input type="time" defaultValue="18:00" className="h-9 w-32 bg-neutral-900 border-neutral-800" disabled={day === 'Sunday'} />
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button className="bg-[#D4A437] hover:bg-[#b58c2f] text-black">Save Hours</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">WhatsApp Integration</CardTitle>
              <CardDescription className="text-neutral-400">Connect WhatsApp Business API for customer notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-neutral-800 rounded-md bg-neutral-900/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xl">W</div>
                  <div>
                    <h4 className="font-medium text-white flex items-center gap-2">
                      WhatsApp Cloud API
                      <Badge variant="outline" className="text-green-400 border-green-500/30">Connected</Badge>
                    </h4>
                    <p className="text-sm text-neutral-400">Phone: +1 (555) 123-4567</p>
                  </div>
                </div>
                <Button variant="outline" className="border-neutral-700 text-white hover:bg-neutral-800">Disconnect</Button>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-[#D4A437]">Test Connection</h4>
                <div className="flex gap-2">
                  <Input placeholder="Enter phone number with country code" className="bg-neutral-900 border-neutral-800 max-w-sm" />
                  <Button variant="secondary" className="bg-neutral-800 hover:bg-neutral-700 text-white">Send Test Message</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Notification Settings</CardTitle>
              <CardDescription className="text-neutral-400">Configure when and how customers receive updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-neutral-800 rounded-md bg-neutral-900/50">
                  <div className="space-y-1">
                    <Label className="text-white text-base">Booking Confirmation</Label>
                    <p className="text-sm text-neutral-400">Sent immediately when an appointment is booked.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-4 border border-neutral-800 rounded-md bg-neutral-900/50">
                  <div className="space-y-1">
                    <Label className="text-white text-base">24-Hour Reminder</Label>
                    <p className="text-sm text-neutral-400">Sent 24 hours before the appointment.</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border border-neutral-800 rounded-md bg-neutral-900/50">
                  <div className="space-y-1">
                    <Label className="text-white text-base">2-Hour Reminder</Label>
                    <p className="text-sm text-neutral-400">Sent 2 hours before the appointment.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-[#D4A437] hover:bg-[#b58c2f] text-black">Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
