'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarberFormDialog } from '@/components/admin/barber-form-dialog';
import { Plus, Edit2 } from 'lucide-react';

const MOCK_BARBERS = [
  { id: '1', name: 'James "RJ" Smith', email: 'rj@example.com', phone: '555-0101', commission: 0.6, isActive: true },
  { id: '2', name: 'Mike Johnson', email: 'mike@example.com', phone: '555-0102', commission: 0.5, isActive: true },
  { id: '3', name: 'David Lee', email: 'david@example.com', phone: '555-0103', commission: 0.5, isActive: false },
];

export default function BarbersPage() {
  const [barbers, setBarbers] = useState(MOCK_BARBERS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const toggleActive = (id: string) => {
    setBarbers(barbers.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#D4A437]">Manage Barbers</h1>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-[#D4A437] hover:bg-[#b58c2f] text-black">
          <Plus className="mr-2 h-4 w-4" /> Add Barber
        </Button>
      </div>

      <div className="rounded-md border border-neutral-800 bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 hover:bg-neutral-900/50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {barbers.map((barber) => (
              <TableRow key={barber.id} className="border-neutral-800 hover:bg-neutral-900/50 text-neutral-300">
                <TableCell className="font-medium text-white">{barber.name}</TableCell>
                <TableCell>{barber.email}</TableCell>
                <TableCell>{barber.phone}</TableCell>
                <TableCell>{(barber.commission * 100).toFixed(0)}%</TableCell>
                <TableCell>
                  <Badge variant={barber.isActive ? "default" : "secondary"} className={barber.isActive ? "bg-green-500/20 text-green-400" : "bg-neutral-800 text-neutral-400"}>
                    {barber.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(barber.id)}>
                      {barber.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[#D4A437] hover:text-[#b58c2f] hover:bg-[#D4A437]/10">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BarberFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
