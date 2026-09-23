'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ServiceFormDialog } from '@/components/admin/service-form-dialog';
import { Plus, Edit2 } from 'lucide-react';

const MOCK_SERVICES = [
  { id: '1', title: 'Classic Haircut', duration: 30, buffer: 5, price: 3500, category: 'Hair Services', isActive: true, sortOrder: 1 },
  { id: '2', title: 'Beard Trim', duration: 15, buffer: 5, price: 2000, category: 'Beard & Grooming', isActive: true, sortOrder: 2 },
  { id: '3', title: 'Hair & Beard Combo', duration: 45, buffer: 5, price: 5000, category: 'Premium Packages', isActive: true, sortOrder: 3 },
  { id: '4', title: 'Kids Haircut', duration: 30, buffer: 5, price: 2500, category: 'Hair Services', isActive: true, sortOrder: 4 },
  { id: '5', title: 'Hot Towel Shave', duration: 30, buffer: 10, price: 4000, category: 'Premium Packages', isActive: false, sortOrder: 5 },
];

export default function ServicesPage() {
  const [services, setServices] = useState(MOCK_SERVICES);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const toggleActive = (id: string) => {
    setServices(services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#D4A437]">Manage Services</h1>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-[#D4A437] hover:bg-[#b58c2f] text-black">
          <Plus className="mr-2 h-4 w-4" /> Add Service
        </Button>
      </div>

      <div className="rounded-md border border-neutral-800 bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 hover:bg-neutral-900/50">
              <TableHead>Order</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration (mins)</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id} className="border-neutral-800 hover:bg-neutral-900/50 text-neutral-300">
                <TableCell>{service.sortOrder}</TableCell>
                <TableCell className="font-medium text-white">{service.title}</TableCell>
                <TableCell>{service.category}</TableCell>
                <TableCell>{service.duration} + {service.buffer} (buf)</TableCell>
                <TableCell>${(service.price / 100).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={service.isActive ? "default" : "secondary"} className={service.isActive ? "bg-green-500/20 text-green-400" : "bg-neutral-800 text-neutral-400"}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(service.id)}>
                      {service.isActive ? 'Disable' : 'Enable'}
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

      <ServiceFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
