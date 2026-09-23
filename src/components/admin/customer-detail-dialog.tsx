'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const MOCK_DETAIL = {
  id: '1',
  name: 'Alex Carter',
  phone: '555-1234',
  email: 'alex@example.com',
  visits: 12,
  noShows: 0,
  totalSpent: 420.00,
  whatsappOptin: true,
  notes: 'Prefers #2 guard on sides, tapered neckline. Sensitive skin on neck.',
  history: [
    { id: 'a1', date: '2023-10-15', service: 'Classic Haircut', barber: 'James "RJ" Smith', status: 'completed' },
    { id: 'a2', date: '2023-09-20', service: 'Hair & Beard Combo', barber: 'Mike Johnson', status: 'completed' },
    { id: 'a3', date: '2023-08-10', service: 'Classic Haircut', barber: 'James "RJ" Smith', status: 'completed' },
  ]
};

export function CustomerDetailDialog({ customerId, open, onOpenChange }: { customerId: string, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [notes, setNotes] = useState(MOCK_DETAIL.notes);
  const customer = MOCK_DETAIL; // In real app, fetch based on customerId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-neutral-950 border-neutral-800 text-neutral-100">
        <DialogHeader>
          <DialogTitle className="text-[#D4A437] text-xl">Customer Profile</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg text-white">{customer.name}</h3>
              <p className="text-sm text-neutral-400">{customer.phone}</p>
              <p className="text-sm text-neutral-400">{customer.email}</p>
              <div className="mt-2">
                {customer.whatsappOptin ? (
                  <Badge variant="outline" className="text-green-400 border-green-500/30">WhatsApp Connected</Badge>
                ) : (
                  <Badge variant="outline" className="text-neutral-500 border-neutral-700">No WhatsApp</Badge>
                )}
              </div>
            </div>
            <div className="bg-neutral-900 rounded-md p-3 grid grid-cols-2 gap-2 text-center text-sm">
              <div className="flex flex-col">
                <span className="text-neutral-400">Total Visits</span>
                <span className="font-bold text-white">{customer.visits}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-400">No Shows</span>
                <span className="font-bold text-white">{customer.noShows}</span>
              </div>
              <div className="flex flex-col col-span-2 mt-2">
                <span className="text-neutral-400">Total Spent</span>
                <span className="font-bold text-[#D4A437]">${customer.totalSpent.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-[#D4A437]">Barber Notes</h4>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-neutral-900 border-neutral-800 min-h-[80px] focus-visible:ring-[#D4A437]"
            />
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-[#D4A437]">Recent Appointments</h4>
            <div className="border border-neutral-800 rounded-md overflow-hidden">
              <table className="w-full text-sm text-left text-neutral-300">
                <thead className="bg-neutral-900/50 text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Service</th>
                    <th className="px-3 py-2 font-medium">Barber</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.history.map((apt) => (
                    <tr key={apt.id} className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-900/30">
                      <td className="px-3 py-2">{apt.date}</td>
                      <td className="px-3 py-2">{apt.service}</td>
                      <td className="px-3 py-2">{apt.barber}</td>
                      <td className="px-3 py-2 capitalize">{apt.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-neutral-800 hover:bg-neutral-900 hover:text-white">Close</Button>
          <Button className="bg-[#D4A437] hover:bg-[#b58c2f] text-black">Save Notes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
