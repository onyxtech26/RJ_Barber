'use client';

import React, { useState } from 'react';
import { 
  DollarSign, 
  Wallet, 
  CreditCard, 
  Receipt, 
  Lock, 
  Unlock, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowDownLeft, 
  ArrowUpRight,
  Clock,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface PettyCashEntry {
  id: string;
  type: 'paid_out' | 'paid_in';
  amount: number;
  reason: string;
  time: string;
}

export default function TillManagementPage() {
  const [isSessionOpen, setIsSessionOpen] = useState(true);
  const [openingFloat, setOpeningFloat] = useState(200);
  
  // Shift sales tallies
  const [cashSales, setCashSales] = useState(485);
  const [cardSales, setCardSales] = useState(620);
  const [digitalSales, setDigitalSales] = useState(130);
  const [barberTips, setBarberTips] = useState(175);

  // Petty cash
  const [pettyCashEntries, setPettyCashEntries] = useState<PettyCashEntry[]>([
    { id: 'pc-1', type: 'paid_out', amount: 15, reason: 'Barber disinfectant spray', time: '11:15 AM' },
    { id: 'pc-2', type: 'paid_out', amount: 22, reason: 'Linen / Towel service delivery', time: '01:40 PM' },
  ]);

  // Modals
  const [isPettyModalOpen, setIsPettyModalOpen] = useState(false);
  const [pettyType, setPettyType] = useState<'paid_out' | 'paid_in'>('paid_out');
  const [pettyAmount, setPettyAmount] = useState<number>(0);
  const [pettyReason, setPettyReason] = useState('');

  const [isCloseoutModalOpen, setIsCloseoutModalOpen] = useState(false);
  const [countedCash, setCountedCash] = useState<number>(0);
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [isXReportOpen, setIsXReportOpen] = useState(false);

  // Math calculations
  const totalPaidOut = pettyCashEntries
    .filter(e => e.type === 'paid_out')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const totalPaidIn = pettyCashEntries
    .filter(e => e.type === 'paid_in')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expectedCashInDrawer = openingFloat + cashSales + totalPaidIn - totalPaidOut;
  const cashDiscrepancy = countedCash - expectedCashInDrawer;
  const totalGrossRevenue = cashSales + cardSales + digitalSales;

  const handleAddPettyCash = () => {
    if (pettyAmount <= 0 || !pettyReason) return;
    const newEntry: PettyCashEntry = {
      id: `pc-${Date.now().toString().slice(-4)}`,
      type: pettyType,
      amount: pettyAmount,
      reason: pettyReason,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setPettyCashEntries(prev => [...prev, newEntry]);
    setPettyAmount(0);
    setPettyReason('');
    setIsPettyModalOpen(false);
  };

  const handleExecuteZReport = () => {
    setIsSessionOpen(false);
    setIsCloseoutModalOpen(false);
    setIsZReportOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <DollarSign className="h-7 w-7 text-primary" />
            <span>Till & Cash Drawer Register</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Cash float balancing, petty cash ledger, and X/Z shift reconciliation reports.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsXReportOpen(true)}
            className="border-white/10 hover:bg-white/[0.05]"
          >
            <FileText className="h-4 w-4 mr-2 text-primary" />
            Print X-Report (Midday)
          </Button>

          {isSessionOpen ? (
            <Button
              onClick={() => {
                setCountedCash(expectedCashInDrawer);
                setIsCloseoutModalOpen(true);
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-bold"
            >
              <Lock className="h-4 w-4 mr-2" />
              Close Shift (Z-Report)
            </Button>
          ) : (
            <Button
              onClick={() => setIsSessionOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
            >
              <Unlock className="h-4 w-4 mr-2" />
              Open New Shift
            </Button>
          )}
        </div>
      </div>

      {/* Register State Alert */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${
        isSessionOpen
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
          : 'bg-red-950/20 border-red-500/30 text-red-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            isSessionOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isSessionOpen ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-bold text-sm">
              {isSessionOpen ? 'Register Drawer is ACTIVE & OPEN' : 'Register Drawer is CLOSED'}
            </h3>
            <span className="text-xs text-muted-foreground">
              Shift started at 09:00 AM by Cashier Desk #1 · Float: ${openingFloat}.00
            </span>
          </div>
        </div>
        <Badge variant="outline" className={`font-mono ${
          isSessionOpen ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'
        }`}>
          {isSessionOpen ? 'SESSION #104' : 'LOCKED'}
        </Badge>
      </div>

      {/* Till Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#121418] border-white/[0.08]">
          <CardHeader className="p-4 pb-2">
            <span className="text-xs text-muted-foreground uppercase font-mono">Expected Cash in Drawer</span>
            <CardTitle className="text-2xl font-bold font-mono text-emerald-400">
              ${expectedCashInDrawer}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Opening (${openingFloat}) + Cash Sales (${cashSales}) - Petty Cash (${totalPaidOut})
          </CardContent>
        </Card>

        <Card className="bg-[#121418] border-white/[0.08]">
          <CardHeader className="p-4 pb-2">
            <span className="text-xs text-muted-foreground uppercase font-mono">Total Sales (Today)</span>
            <CardTitle className="text-2xl font-bold font-mono text-foreground">
              ${totalGrossRevenue}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Cash: ${cashSales} | Card: ${cardSales} | Digital: ${digitalSales}
          </CardContent>
        </Card>

        <Card className="bg-[#121418] border-white/[0.08]">
          <CardHeader className="p-4 pb-2">
            <span className="text-xs text-muted-foreground uppercase font-mono">Barber Tips Collected</span>
            <CardTitle className="text-2xl font-bold font-mono text-primary">
              ${barberTips}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Earmarked for evening barber staff distribution
          </CardContent>
        </Card>

        <Card className="bg-[#121418] border-white/[0.08]">
          <CardHeader className="p-4 pb-2">
            <span className="text-xs text-muted-foreground uppercase font-mono">Petty Cash Disbursed</span>
            <CardTitle className="text-2xl font-bold font-mono text-amber-400">
              ${totalPaidOut}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            {pettyCashEntries.length} logged expense adjustments
          </CardContent>
        </Card>
      </div>

      {/* Petty Cash Paid In / Out Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wider">
            Petty Cash & Drawer Adjustments
          </h2>
          <Button
            size="sm"
            onClick={() => setIsPettyModalOpen(true)}
            className="h-8 text-xs bg-primary text-black font-semibold hover:bg-primary/90"
          >
            + Paid In / Paid Out
          </Button>
        </div>

        <Card className="bg-[#121418] border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#16181D] border-b border-white/[0.08] text-xs font-mono uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Reason / Description</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {pettyCashEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3">
                      {entry.type === 'paid_out' ? (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] font-mono">
                          PAID OUT
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                          PAID IN
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{entry.time}</td>
                    <td className="p-3 text-xs text-foreground font-medium">{entry.reason}</td>
                    <td className={`p-3 text-right font-mono font-bold ${
                      entry.type === 'paid_out' ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {entry.type === 'paid_out' ? `-$${entry.amount}` : `+$${entry.amount}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Petty Cash Modal */}
      <Dialog open={isPettyModalOpen} onOpenChange={setIsPettyModalOpen}>
        <DialogContent className="max-w-md bg-[#121418] border-white/[0.1] text-foreground p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Record Petty Cash Transaction</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="text-muted-foreground block mb-1">Adjustment Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPettyType('paid_out')}
                  className={`py-2 rounded-md font-semibold text-xs border transition-all ${
                    pettyType === 'paid_out'
                      ? 'border-red-500 bg-red-950/30 text-red-400'
                      : 'border-white/[0.08] bg-[#16181D] text-muted-foreground'
                  }`}
                >
                  Paid Out (Expense)
                </button>
                <button
                  onClick={() => setPettyType('paid_in')}
                  className={`py-2 rounded-md font-semibold text-xs border transition-all ${
                    pettyType === 'paid_in'
                      ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400'
                      : 'border-white/[0.08] bg-[#16181D] text-muted-foreground'
                  }`}
                >
                  Paid In (Float Top-up)
                </button>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Amount ($) *</label>
              <Input
                type="number"
                value={pettyAmount || ''}
                onChange={(e) => setPettyAmount(Number(e.target.value))}
                placeholder="20.00"
                className="h-9 font-mono bg-[#16181D] border-white/[0.08]"
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Reason / Description *</label>
              <Input
                value={pettyReason}
                onChange={(e) => setPettyReason(e.target.value)}
                placeholder="e.g. Purchased neck strips & disinfectant"
                className="h-9 bg-[#16181D] border-white/[0.08]"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsPettyModalOpen(false)}
              className="border-white/10 hover:bg-white/[0.05]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPettyCash}
              className="bg-primary text-black font-bold hover:bg-primary/90"
            >
              Save Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End of Day Z-Report Closeout Modal */}
      <Dialog open={isCloseoutModalOpen} onOpenChange={setIsCloseoutModalOpen}>
        <DialogContent className="max-w-md bg-[#121418] border-white/[0.1] text-foreground p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-400" />
              <span>Shift Closeout (Z-Report)</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Count all physical cash and coins in the drawer before locking register session #104.
            </p>

            <div className="p-3 rounded-lg bg-[#16181D] border border-white/[0.05] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Cash in Drawer:</span>
                <span className="font-mono font-bold text-foreground">${expectedCashInDrawer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opening Float:</span>
                <span className="font-mono">${openingFloat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash Sales:</span>
                <span className="font-mono">${cashSales}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Petty Cash Paid Out:</span>
                <span className="font-mono text-red-400">-${totalPaidOut}</span>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Physically Counted Cash ($) *</label>
              <Input
                type="number"
                value={countedCash}
                onChange={(e) => setCountedCash(Number(e.target.value))}
                className="h-10 text-lg font-mono font-bold bg-[#16181D] border-white/[0.1]"
              />
            </div>

            {/* Discrepancy indicator */}
            <div className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${
              cashDiscrepancy === 0
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
                : cashDiscrepancy > 0
                ? 'border-blue-500/30 bg-blue-950/20 text-blue-400'
                : 'border-red-500/30 bg-red-950/20 text-red-400'
            }`}>
              <span>Variance / Discrepancy:</span>
              <span className="font-mono font-extrabold text-sm">
                {cashDiscrepancy === 0 ? 'PERFECT MATCH ($0)' : cashDiscrepancy > 0 ? `OVER +$${cashDiscrepancy}` : `SHORT -$${Math.abs(cashDiscrepancy)}`}
              </span>
            </div>
          </div>

          <DialogFooter className="flex justify-between gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsCloseoutModalOpen(false)}
              className="border-white/10 hover:bg-white/[0.05]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteZReport}
              className="bg-red-500 hover:bg-red-600 text-white font-bold"
            >
              Lock Shift & Print Z-Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printed X/Z Report Receipt Preview */}
      <Dialog open={isXReportOpen || isZReportOpen} onOpenChange={(open) => {
        if (!open) {
          setIsXReportOpen(false);
          setIsZReportOpen(false);
        }
      }}>
        <DialogContent className="max-w-sm bg-neutral-900 border-neutral-800 text-neutral-100 p-6 font-mono text-xs">
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-neutral-700">
            <h3 className="font-bold text-sm tracking-wider uppercase text-white">RJ BARBER SALON</h3>
            <p className="text-[11px] font-bold text-primary">
              {isZReportOpen ? 'OFFICIAL Z-REPORT (SHIFT CLOSE)' : 'MIDDAY X-REPORT (READING)'}
            </p>
            <p className="text-[10px] text-neutral-400">Date: {new Date().toLocaleDateString()} · Time: {new Date().toLocaleTimeString()}</p>
            <p className="text-[10px] text-neutral-400">Register: #01 · Cashier: Staff Station</p>
          </div>

          <div className="space-y-1.5 py-3 border-b border-dashed border-neutral-700">
            <div className="flex justify-between">
              <span>Opening Float:</span>
              <span>${openingFloat}.00</span>
            </div>
            <div className="flex justify-between">
              <span>Cash Sales:</span>
              <span>${cashSales}.00</span>
            </div>
            <div className="flex justify-between">
              <span>Card Terminal Sales:</span>
              <span>${cardSales}.00</span>
            </div>
            <div className="flex justify-between">
              <span>Digital / QR Sales:</span>
              <span>${digitalSales}.00</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-1">
              <span>TOTAL GROSS REVENUE:</span>
              <span>${totalGrossRevenue}.00</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Total Tips Collected:</span>
              <span>${barberTips}.00</span>
            </div>
          </div>

          <div className="space-y-1.5 py-3 border-b border-dashed border-neutral-700">
            <div className="flex justify-between">
              <span>Petty Cash Paid Out:</span>
              <span className="text-red-400">-${totalPaidOut}.00</span>
            </div>
            <div className="flex justify-between">
              <span>Expected Cash in Drawer:</span>
              <span>${expectedCashInDrawer}.00</span>
            </div>
            {isZReportOpen && (
              <>
                <div className="flex justify-between font-bold text-white">
                  <span>Counted Cash:</span>
                  <span>${countedCash}.00</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-400">
                  <span>Cash Difference:</span>
                  <span>{cashDiscrepancy === 0 ? '$0.00' : `${cashDiscrepancy > 0 ? '+' : '-'}$${Math.abs(cashDiscrepancy)}.00`}</span>
                </div>
              </>
            )}
          </div>

          <div className="pt-2 text-center text-[10px] text-neutral-400 space-y-1">
            <p>--- END OF REPORT ---</p>
            <p>RJ Barber Salon · All Rights Reserved</p>
          </div>

          <div className="pt-3 flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex-1 border-neutral-700 hover:bg-neutral-800 text-xs"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print Report
            </Button>
            <Button
              onClick={() => {
                setIsXReportOpen(false);
                setIsZReportOpen(false);
              }}
              className="flex-1 bg-primary text-black font-bold hover:bg-primary/90 text-xs"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
