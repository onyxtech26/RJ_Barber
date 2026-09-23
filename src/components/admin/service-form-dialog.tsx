'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ServiceFormDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-neutral-950 border-neutral-800 text-neutral-100">
        <DialogHeader>
          <DialogTitle className="text-[#D4A437]">Add Service</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Classic Haircut" className="bg-neutral-900 border-neutral-800 focus-visible:ring-[#D4A437]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="A classic tailored haircut..." className="bg-neutral-900 border-neutral-800 focus-visible:ring-[#D4A437]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input id="duration" type="number" defaultValue="30" className="bg-neutral-900 border-neutral-800 focus-visible:ring-[#D4A437]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer">Buffer After (minutes)</Label>
              <Input id="buffer" type="number" defaultValue="5" className="bg-neutral-900 border-neutral-800 focus-visible:ring-[#D4A437]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" step="0.01" defaultValue="35.00" className="bg-neutral-900 border-neutral-800 focus-visible:ring-[#D4A437]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort">Sort Order</Label>
              <Input id="sort" type="number" defaultValue="1" className="bg-neutral-900 border-neutral-800 focus-visible:ring-[#D4A437]" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select defaultValue="hair">
              <SelectTrigger className="bg-neutral-900 border-neutral-800 focus:ring-[#D4A437]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="hair">Hair Services</SelectItem>
                <SelectItem value="beard">Beard & Grooming</SelectItem>
                <SelectItem value="premium">Premium Packages</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch id="active-service" defaultChecked />
            <Label htmlFor="active-service">Active Status</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-neutral-800 hover:bg-neutral-900 hover:text-white">Cancel</Button>
          <Button className="bg-[#D4A437] hover:bg-[#b58c2f] text-black">Save Service</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
