'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { CalendarClock, Lock, Scissors, X } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import type { ItemKind, PaymentMethod } from '@/lib/enums';
import { priceTicket, PricingError, type TicketTotals } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { formatTimeOfDay } from '@/lib/scheduling';
import type { BookingForSale } from '@/features/bookings/queries';
import { createOrder } from '../actions';
import type { OrderReceipt, PendingOrder, TerminalData } from '../queries';
import { ApprovalDialog } from './approval-dialog';
import { CatalogGrid, type CatalogEntry } from './catalog-grid';
import { DiscountDialog } from './discount-dialog';
import { PaymentDialog } from './payment-dialog';
import { PendingTray } from './pending-tray';
import { ReceiptDialog } from './receipt-dialog';
import { TicketPanel } from './ticket-panel';

export type TicketLine = {
  key: string;
  catalogItemId: string;
  name: string;
  kind: ItemKind;
  unitPriceSen: number;
  quantity: number;
  barberId: string | null;
};

export type TicketDiscount = { type: 'percent' | 'amount'; value: number; reason: string };

export function Terminal({ data, booking }: { data: TerminalData; booking: BookingForSale | null }) {
  const { currentStaff, catalog, barbers, owners, settings, pendingOrders, isTodayClosed } = data;

  const defaultBarberId = booking?.barberId ?? (currentStaff.isBarber ? currentStaff.id : (barbers[0]?.id ?? null));
  const [activeBarberId, setActiveBarberId] = useState<string | null>(defaultBarberId);
  // Charging a booking: start the ticket with its services and barber, at today's catalog prices.
  const [lines, setLines] = useState<TicketLine[]>(() => (booking ? ticketFromBooking(booking, catalog) : []));
  const [customerName, setCustomerName] = useState(booking?.customerName ?? '');
  const [bookingId, setBookingId] = useState<string | null>(booking?.id ?? null);

  const [discount, setDiscount] = useState<TicketDiscount | null>(null);

  // A different booking was opened while the terminal stayed mounted: start its ticket.
  // (The booking prop going back to null after a charge is ignored — the ticket was already handled.)
  const [prefilledFor, setPrefilledFor] = useState<string | null>(booking?.id ?? null);
  if (booking && booking.id !== prefilledFor) {
    setPrefilledFor(booking.id);
    setBookingId(booking.id);
    setLines(ticketFromBooking(booking, catalog));
    setCustomerName(booking.customerName);
    setDiscount(null);
    setActiveBarberId(booking.barberId);
  }

  const [discountOpen, setDiscountOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<PendingOrder | null>(null);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [chargingMethod, setChargingMethod] = useState<PaymentMethod | null>(null);
  const [, startTransition] = useTransition();

  // One id per ticket version: a retry of the same ticket reuses it (no duplicate sale),
  // any edit to the ticket starts a fresh one.
  const orderIdRef = useRef<string | null>(null);
  const pendingMethodRef = useRef<PaymentMethod>('duitnow');
  const editTicket = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => (value: React.SetStateAction<T>) => {
    orderIdRef.current = null;
    setter(value);
  };
  const updateLines = editTicket(setLines);
  const updateDiscount = editTicket(setDiscount);
  const updateCustomerName = editTicket(setCustomerName);
  // Drop ?booking= from the address without a navigation: a navigation would remount the terminal
  // (it's keyed by booking) and lose the payment dialog that opens right after charging.
  const forgetBooking = () => {
    setBookingId(null);
    window.history.replaceState(null, '', '/');
  };
  const detachBooking = () => {
    orderIdRef.current = null;
    forgetBooking();
  };

  const { totals, pricingError } = useMemo((): { totals: TicketTotals | null; pricingError: string | null } => {
    try {
      return {
        totals: priceTicket(
          lines.map((l) => ({ unitPriceSen: l.unitPriceSen, quantity: l.quantity, commissionBps: 0 })),
          discount,
          settings.sstRateBps
        ),
        pricingError: null,
      };
    } catch (error) {
      if (error instanceof PricingError) return { totals: null, pricingError: error.message };
      throw error;
    }
  }, [lines, discount, settings.sstRateBps]);

  const addItem = (item: CatalogEntry) =>
    updateLines((prev) => {
      const barberId = activeBarberId;
      const existing = prev.find((l) => l.catalogItemId === item.id && l.barberId === barberId);
      if (existing) {
        return prev.map((l) => (l === existing ? { ...l, quantity: Math.min(l.quantity + 1, 99) } : l));
      }
      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          catalogItemId: item.id,
          name: item.name,
          kind: item.kind,
          unitPriceSen: item.priceSen,
          quantity: 1,
          barberId,
        },
      ];
    });

  const resetTicket = () => {
    orderIdRef.current = null;
    setLines([]);
    setDiscount(null);
    setCustomerName('');
    if (bookingId) forgetBooking();
  };

  const charge = (method: PaymentMethod, approval?: { ownerId: string; pin: string }) => {
    if (!totals || lines.length === 0) return;
    const unassigned = lines.find((l) => l.kind === 'service' && !l.barberId);
    if (unassigned) {
      toast.error(`Choose who did “${unassigned.name}”.`);
      return;
    }

    orderIdRef.current ??= crypto.randomUUID();
    pendingMethodRef.current = method;
    setChargingMethod(method);

    startTransition(async () => {
      try {
        const result = await createOrder({
          id: orderIdRef.current!,
          paymentMethod: method,
          customerName,
          lines: lines.map((l) => ({ catalogItemId: l.catalogItemId, quantity: l.quantity, barberId: l.barberId })),
          discount,
          approval: approval ?? null,
          bookingId,
        });

        if (!result.ok) {
          if (result.code === 'approval_required') {
            setApprovalError(approval ? result.error : null);
            setApprovalOpen(true);
          } else {
            toast.error(result.error);
          }
          return;
        }

        setApprovalOpen(false);
        setApprovalError(null);
        resetTicket();
        setPayingOrder(result.data);
      } catch {
        toast.error('Couldn’t reach the till. Check the connection and try again — the sale won’t be duplicated.');
      } finally {
        setChargingMethod(null);
      }
    });
  };

  if (catalog.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={Scissors} title="No services yet" description="The owner can add services in Settings." />
      </div>
    );
  }

  return (
    <div className="grid flex-1 grid-cols-1 lg:h-[calc(100dvh-4rem)] lg:flex-none lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-1 lg:overflow-hidden">
      <div className="flex min-h-0 flex-col">
        {booking && bookingId && (
          <div className="flex items-center gap-2 border-b bg-accent px-4 py-2.5 text-sm">
            <CalendarClock className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              Charging the booking for <span className="font-semibold">{booking.customerName}</span> at{' '}
              {formatTimeOfDay(booking.startMinutes)}. Paying marks it completed.
            </span>
            <button
              type="button"
              onClick={detachBooking}
              className="flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-background/60"
              aria-label="Don’t link this sale to the booking"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        {isTodayClosed && (
          <div className="flex items-center gap-2 border-b bg-warning-soft px-4 py-2.5 text-sm font-medium text-warning">
            <Lock className="size-4 shrink-0" />
            Today has been closed. Pending sales can still be settled; new sales need the owner to reopen the day.
          </div>
        )}
        {barbers.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto border-b bg-card px-4 py-2.5">
            <span className="shrink-0 text-sm text-muted-foreground">Barber:</span>
            {barbers.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveBarberId(b.id)}
                className={cn(
                  'h-10 shrink-0 rounded-lg px-4 text-sm font-semibold transition-colors',
                  activeBarberId === b.id ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}
        <CatalogGrid catalog={catalog} onAdd={addItem} />
      </div>

      <TicketPanel
        lines={lines}
        barbers={barbers}
        customerName={customerName}
        discount={discount}
        totals={totals}
        pricingError={pricingError}
        sstRateBps={settings.sstRateBps}
        chargingMethod={chargingMethod}
        chargeDisabled={isTodayClosed}
        onCustomerName={updateCustomerName}
        onQuantity={(key, delta) =>
          updateLines((prev) =>
            prev.flatMap((l) => {
              if (l.key !== key) return [l];
              const quantity = l.quantity + delta;
              return quantity <= 0 ? [] : [{ ...l, quantity: Math.min(quantity, 99) }];
            })
          )
        }
        onBarber={(key, barberId) => updateLines((prev) => prev.map((l) => (l.key === key ? { ...l, barberId } : l)))}
        onRemove={(key) => updateLines((prev) => prev.filter((l) => l.key !== key))}
        onClear={resetTicket}
        onEditDiscount={() => setDiscountOpen(true)}
        onRemoveDiscount={() => updateDiscount(null)}
        onCharge={(method) => charge(method)}
        pendingTray={<PendingTray orders={pendingOrders} onResume={setPayingOrder} />}
      />

      <DiscountDialog
        open={discountOpen}
        initial={discount}
        subtotalSen={totals?.subtotalSen ?? lines.reduce((s, l) => s + l.unitPriceSen * l.quantity, 0)}
        approvalThresholdBps={settings.discountApprovalThresholdBps}
        needsApproval={currentStaff.role !== 'owner'}
        onOpenChange={setDiscountOpen}
        onApply={(d) => {
          updateDiscount(d);
          setDiscountOpen(false);
        }}
      />

      {approvalOpen && (
        <ApprovalDialog
          open={approvalOpen}
          owners={owners}
          error={approvalError}
          isSubmitting={chargingMethod !== null}
          onOpenChange={(open) => {
            setApprovalOpen(open);
            if (!open) setApprovalError(null);
          }}
          onSubmit={(approval) => charge(pendingMethodRef.current, approval)}
        />
      )}

      <PaymentDialog
        order={payingOrder}
        settings={settings}
        onClose={() => setPayingOrder(null)}
        onPaid={(paid) => {
          setPayingOrder(null);
          setReceipt(paid);
        }}
      />

      <ReceiptDialog receipt={receipt} onDone={() => setReceipt(null)} />
    </div>
  );
}

function ticketFromBooking(booking: BookingForSale, catalog: TerminalData['catalog']): TicketLine[] {
  const items = new Map(catalog.flatMap((c) => c.items).map((i) => [i.id, i]));
  return booking.catalogItemIds.flatMap((id) => {
    const item = items.get(id);
    return item
      ? [
          {
            key: crypto.randomUUID(),
            catalogItemId: item.id,
            name: item.name,
            kind: item.kind,
            unitPriceSen: item.priceSen,
            quantity: 1,
            barberId: booking.barberId,
          },
        ]
      : [];
  });
}
