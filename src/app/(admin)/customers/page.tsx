'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CustomerDetailDialog } from '@/components/admin/customer-detail-dialog';
import { Search } from 'lucide-react';

const MOCK_CUSTOMERS = [
  { id: '1', name: 'Alex Carter', phone: '555-1234', email: 'alex@example.com', visits: 12, noShows: 0, whatsappOptin: true },
  { id: '2', name: 'Brian Miller', phone: '555-5678', email: 'brian@example.com', visits: 5, noShows: 1, whatsappOptin: false },
  { id: '3', name: 'Chris Davis', phone: '555-9012', email: 'chris@example.com', visits: 24, noShows: 0, whatsappOptin: true },
  { id: '4', name: 'Daniel Evans', phone: '555-3456', email: 'daniel@example.com', visits: 1, noShows: 0, whatsappOptin: true },
  { id: '5', name: 'Eric Foster', phone: '555-7890', email: 'eric@example.com', visits: 8, noShows: 2, whatsappOptin: false },
];

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const filteredCustomers = MOCK_CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#D4A437]">Customers</h1>
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
          <Input 
            placeholder="Search by name or phone..." 
            className="pl-9 bg-neutral-950 border-neutral-800 focus-visible:ring-[#D4A437]" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-neutral-800 bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 hover:bg-neutral-900/50">
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Total Visits</TableHead>
              <TableHead>No-Shows</TableHead>
              <TableHead>WhatsApp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow 
                key={customer.id} 
                className="border-neutral-800 hover:bg-neutral-900 text-neutral-300 cursor-pointer"
                onClick={() => setSelectedCustomerId(customer.id)}
              >
                <TableCell className="font-medium text-white">{customer.name}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.visits}</TableCell>
                <TableCell>
                  <span className={customer.noShows > 0 ? "text-red-400 font-bold" : ""}>
                    {customer.noShows}
                  </span>
                </TableCell>
                <TableCell>
                  {customer.whatsappOptin ? (
                    <Badge variant="outline" className="text-green-400 border-green-500/30">Opted In</Badge>
                  ) : (
                    <Badge variant="outline" className="text-neutral-500 border-neutral-700">Not Opted In</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedCustomerId && (
        <CustomerDetailDialog 
          customerId={selectedCustomerId} 
          open={!!selectedCustomerId} 
          onOpenChange={(open) => !open && setSelectedCustomerId(null)} 
        />
      )}
    </div>
  );
}
