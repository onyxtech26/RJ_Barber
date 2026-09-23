'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function BarberFormDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-neutral-950 border-neutral-800 text-neutral-100">
        <DialogHeader>
          <DialogTitle className="text-[#D4A437]">Add Barber</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" className="bg-neutral-900 border-neutral-800 focus-visible:ring-[#D4A437]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" className="bg-neutral-900 border-neutral-800 focus-visible:ring-[#D4A437]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="555-0199" className="bg-neutral-900 border-neutral-800 focus-visible:ring-[#D4A437]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission">Commission Rate (%)</Label>
              <Input id="commission" type="number" min="0" max="100" defaultValue="50" className="bg-neutral-900 border-neutral-800 focus-visible:ring-[#D4A437]" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="active" defaultChecked />
            <Label htmlFor="active">Active Status</Label>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold text-[#D4A437]">Weekly Schedule</Label>
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-4 p-3 rounded-md bg-neutral-900/50 border border-neutral-800">
                <div className="w-28 flex items-center space-x-2">
                  <Switch id={`day-${day}`} defaultChecked={day !== 'Sunday'} />
                  <Label htmlFor={`day-${day}`}>{day}</Label>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400 w-10">Shift</span>
                    <Input type="time" defaultValue="09:00" className="h-8 bg-neutral-900 border-neutral-800 text-sm" />
                    <span className="text-neutral-500">-</span>
                    <Input type="time" defaultValue="18:00" className="h-8 bg-neutral-900 border-neutral-800 text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400 w-10">Break</span>
                    <Input type="time" defaultValue="13:00" className="h-8 bg-neutral-900 border-neutral-800 text-sm" />
                    <span className="text-neutral-500">-</span>
                    <Input type="time" defaultValue="14:00" className="h-8 bg-neutral-900 border-neutral-800 text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-neutral-800 hover:bg-neutral-900 hover:text-white">Cancel</Button>
          <Button className="bg-[#D4A437] hover:bg-[#b58c2f] text-black">Save Barber</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
