'use server';

import { refresh } from 'next/cache';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, orderItems, orders, receiptCounters, staff, catalogItems, type PaymentMethod } from '@/server/db';
import { logAudit } from '@/server/audit';
import { attemptPin } from '@/server/auth/pin-attempt';
import { requireStaff } from '@/server/auth/session';
import { toBusinessDate } from '@/lib/business-date';
import { PAYMENT_METHODS } from '@/lib/enums';
import { priceTicket, PricingError } from '@/lib/pricing';
import { getOrderReceipt, toPendingOrder, type OrderReceipt, type PendingOrder } from './queries';
import {
  confirmPaymentSchema,
  createOrderSchema,
  type ActionResult,
  type ConfirmPaymentInput,
  type CreateOrderInput,
} from './schemas';

const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? 'Invalid input.';
const orderIdSchema = z.string().min(1).max(64);
const paymentMethodSchema = z.enum(PAYMENT_METHODS);

/**
 * Charge: turns the ticket into an order awaiting payment.
 * Prices, commission, discount and SST are all recomputed here from the database —
 * the browser only says which items, how many, and which barber.
 */
export async function createOrder(input: CreateOrderInput): Promise<ActionResult<PendingOrder>> {
  const me = await requireStaff();
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const ticket = parsed.data;

  // Same id sent twice (double tap, flaky connection) → return the order we already made.
  const existing = await loadPendingOrder(ticket.id);
  if (existing) {
    return existing.createdBy === me.id
      ? { ok: true, data: existing.summary }
      : { ok: false, error: 'This sale was already created by someone else.' };
  }

  const itemIds = [...new Set(ticket.lines.map((l) => l.catalogItemId))];
  const items = await db.query.catalogItems.findMany({
    where: and(inArray(catalogItems.id, itemIds), eq(catalogItems.isActive, true)),
  });
  const itemsById = new Map(items.map((i) => [i.id, i]));
  if (itemsById.size !== itemIds.length) {
    return { ok: false, code: 'stale', error: 'An item on this ticket is no longer for sale. Refresh and try again.' };
  }

  const barberIds = [...new Set(ticket.lines.map((l) => l.barberId).filter((id): id is string => id !== null))];
  const barbers = barberIds.length
    ? await db.query.staff.findMany({
        where: and(inArray(staff.id, barberIds), eq(staff.isActive, true), eq(staff.isBarber, true)),
        columns: { id: true, commissionBps: true },
      })
    : [];
  const barbersById = new Map(barbers.map((b) => [b.id, b]));
  if (barbersById.size !== barberIds.length) {
    return { ok: false, code: 'stale', error: 'A barber on this ticket is no longer active. Refresh and try again.' };
  }

  const resolvedLines = ticket.lines.map((line) => {
    const item = itemsById.get(line.catalogItemId)!;
    const barber = line.barberId ? barbersById.get(line.barberId)! : null;
    // Item override wins; otherwise services earn the barber's rate and products earn nothing.
    const commissionBps = barber ? (item.commissionBps ?? (item.kind === 'service' ? barber.commissionBps : 0)) : 0;
    return { line, item, commissionBps };
  });

  const missingBarber = resolvedLines.find(({ line, item }) => item.kind === 'service' && !line.barberId);
  if (missingBarber) return { ok: false, error: `Choose who did "${missingBarber.item.name}".` };

  const settings = await db.query.shopSettings.findFirst();
  const sstRateBps = settings?.sstEnabled ? settings.sstRateBps : 0;

  let totals;
  try {
    totals = priceTicket(
      resolvedLines.map(({ line, item, commissionBps }) => ({
        unitPriceSen: item.priceSen,
        quantity: line.quantity,
        commissionBps,
      })),
      ticket.discount ? { type: ticket.discount.type, value: ticket.discount.value } : null,
      sstRateBps
    );
  } catch (error) {
    if (error instanceof PricingError) return { ok: false, error: error.message };
    throw error;
  }
  if (totals.totalSen <= 0) return { ok: false, error: 'The total must be more than RM 0.00.' };

  // Big discounts need an owner. An owner at the counter approves their own; staff need an owner's PIN.
  let discountApprovedBy: string | null = null;
  const threshold = settings?.discountApprovalThresholdBps ?? 2000;
  if (ticket.discount && totals.discountBps > threshold) {
    if (me.role === 'owner') {
      discountApprovedBy = me.id;
    } else {
      if (!ticket.approval) {
        return { ok: false, code: 'approval_required', error: 'This discount needs the owner’s PIN.' };
      }
      const owner = await db.query.staff.findFirst({
        where: and(eq(staff.id, ticket.approval.ownerId), eq(staff.role, 'owner'), eq(staff.isActive, true)),
        columns: { id: true },
      });
      if (!owner) return { ok: false, code: 'approval_required', error: 'Choose an owner to approve.' };
      const attempt = await attemptPin(owner.id, ticket.approval.pin, 'approval');
      if (!attempt.ok) return { ok: false, code: 'approval_required', error: attempt.error };
      discountApprovedBy = owner.id;
    }
  }

  const businessDate = toBusinessDate();

  await db.transaction(async (tx) => {
    // Next receipt number for today, atomically: RJ-20261001-001, -002, ...
    const [counter] = await tx
      .insert(receiptCounters)
      .values({ businessDate, lastSeq: 1 })
      .onConflictDoUpdate({ target: receiptCounters.businessDate, set: { lastSeq: sql`${receiptCounters.lastSeq} + 1` } })
      .returning({ seq: receiptCounters.lastSeq });
    const receiptNo = `RJ-${businessDate.replaceAll('-', '')}-${String(counter.seq).padStart(3, '0')}`;

    await tx.insert(orders).values({
      id: ticket.id,
      receiptNo,
      businessDate,
      status: 'awaiting_payment',
      paymentMethod: ticket.paymentMethod,
      customerName: ticket.customerName ?? null,
      customerPhone: ticket.customerPhone ?? null,
      subtotalSen: totals.subtotalSen,
      discountType: ticket.discount?.type ?? null,
      discountValue: ticket.discount?.value ?? null,
      discountSen: totals.discountSen,
      discountReason: ticket.discount?.reason ?? null,
      discountApprovedBy,
      sstRateBps,
      sstSen: totals.sstSen,
      totalSen: totals.totalSen,
      createdBy: me.id,
    });

    await tx.insert(orderItems).values(
      resolvedLines.map(({ line, item, commissionBps }, i) => ({
        orderId: ticket.id,
        catalogItemId: item.id,
        position: i,
        kind: item.kind,
        name: item.name,
        unitPriceSen: item.priceSen,
        quantity: line.quantity,
        lineTotalSen: totals.lines[i].lineTotalSen,
        barberId: line.barberId,
        commissionBps,
        commissionSen: totals.lines[i].commissionSen,
      }))
    );

    await logAudit(
      { actorId: me.id, action: 'order.created', entity: 'order', entityId: ticket.id, details: { receiptNo, totalSen: totals.totalSen } },
      tx
    );
    if (discountApprovedBy && discountApprovedBy !== me.id) {
      await logAudit(
        {
          actorId: discountApprovedBy,
          action: 'discount.approved',
          entity: 'order',
          entityId: ticket.id,
          details: { discountSen: totals.discountSen, requestedBy: me.id },
        },
        tx
      );
    }
  });

  const created = await loadPendingOrder(ticket.id);
  refresh();
  return { ok: true, data: created!.summary };
}

/** Staff confirm the money has arrived (DuitNow) or been handed over (cash). */
export async function confirmPayment(input: ConfirmPaymentInput): Promise<ActionResult<OrderReceipt>> {
  const me = await requireStaff();
  const parsed = confirmPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { orderId, paymentRef, cashReceivedSen } = parsed.data;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { status: true, paymentMethod: true, totalSen: true },
  });
  if (!order) return { ok: false, error: 'Sale not found.' };
  if (order.status !== 'awaiting_payment') return { ok: false, code: 'stale', error: alreadyHandled(order.status) };

  let cash: { cashReceivedSen: number; changeSen: number } | null = null;
  if (order.paymentMethod === 'cash') {
    const received = cashReceivedSen ?? order.totalSen;
    if (received < order.totalSen) return { ok: false, error: 'Cash received is less than the total.' };
    cash = { cashReceivedSen: received, changeSen: received - order.totalSen };
  }

  // Only flips if it's still awaiting payment, so two clicks (or two people) can't both confirm.
  const updated = await db.transaction(async (tx) => {
    const rows = await tx
      .update(orders)
      .set({
        status: 'paid',
        confirmedBy: me.id,
        confirmedAt: new Date(),
        paymentRef: order.paymentMethod === 'duitnow' ? (paymentRef ?? null) : null,
        cashReceivedSen: cash?.cashReceivedSen ?? null,
        changeSen: cash?.changeSen ?? null,
      })
      .where(and(eq(orders.id, orderId), eq(orders.status, 'awaiting_payment')))
      .returning({ id: orders.id });
    if (rows.length === 1) {
      await logAudit(
        { actorId: me.id, action: 'order.paid', entity: 'order', entityId: orderId, details: { method: order.paymentMethod } },
        tx
      );
    }
    return rows.length === 1;
  });
  if (!updated) return { ok: false, code: 'stale', error: 'This sale was already handled.' };

  refresh();
  return { ok: true, data: (await getOrderReceipt(orderId))! };
}

/** Nothing was collected — the customer left, or the ticket was wrong. Any staff member can do this. */
export async function cancelPendingOrder(rawOrderId: string): Promise<ActionResult<null>> {
  const me = await requireStaff();
  const parsedId = orderIdSchema.safeParse(rawOrderId);
  if (!parsedId.success) return { ok: false, error: 'Sale not found.' };
  const orderId = parsedId.data;
  const rows = await db.transaction(async (tx) => {
    const result = await tx
      .update(orders)
      .set({ status: 'cancelled', cancelledBy: me.id, cancelledAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.status, 'awaiting_payment')))
      .returning({ id: orders.id });
    if (result.length === 1) {
      await logAudit({ actorId: me.id, action: 'order.cancelled', entity: 'order', entityId: orderId }, tx);
    }
    return result;
  });
  if (rows.length === 0) return { ok: false, code: 'stale', error: 'This sale was already handled.' };

  refresh();
  return { ok: true, data: null };
}

/** Customer changed their mind about how to pay, before paying. */
export async function changePaymentMethod(rawOrderId: string, rawMethod: PaymentMethod): Promise<ActionResult<PendingOrder>> {
  const me = await requireStaff();
  const parsedId = orderIdSchema.safeParse(rawOrderId);
  const parsedMethod = paymentMethodSchema.safeParse(rawMethod);
  if (!parsedId.success || !parsedMethod.success) return { ok: false, error: 'Invalid request.' };
  const orderId = parsedId.data;
  const method = parsedMethod.data;

  const rows = await db.transaction(async (tx) => {
    const result = await tx
      .update(orders)
      .set({ paymentMethod: method })
      .where(and(eq(orders.id, orderId), eq(orders.status, 'awaiting_payment')))
      .returning({ id: orders.id });
    if (result.length === 1) {
      await logAudit(
        { actorId: me.id, action: 'order.method_changed', entity: 'order', entityId: orderId, details: { method } },
        tx
      );
    }
    return result;
  });
  if (rows.length === 0) return { ok: false, code: 'stale', error: 'This sale was already handled.' };

  refresh();
  return { ok: true, data: (await loadPendingOrder(orderId))!.summary };
}

async function loadPendingOrder(orderId: string) {
  const row = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: { columns: { name: true, quantity: true }, orderBy: (i, { asc }) => asc(i.position) },
      createdByStaff: { columns: { name: true } },
    },
  });
  return row ? { createdBy: row.createdBy, summary: toPendingOrder(row) } : null;
}

function alreadyHandled(status: string) {
  if (status === 'paid') return 'This sale is already paid.';
  if (status === 'cancelled') return 'This sale was cancelled.';
  return 'This sale was already handled.';
}
