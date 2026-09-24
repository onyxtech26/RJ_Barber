import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, appointments } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      // In-memory mock response if DATABASE_URL is not yet connected
      return NextResponse.json({
        orders: [
          {
            id: 'ord-101',
            customerName: 'Marcus Vance',
            customerPhone: '+1 (555) 234-5678',
            barberName: 'RJ (Master Barber)',
            subtotalCents: 4500,
            discountCents: 0,
            tipCents: 1000,
            totalCents: 5500,
            paymentMethod: 'card',
            status: 'completed',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            items: [{ itemName: 'Signature Cut & Beard Sculpt', quantity: 1, unitPriceCents: 4500 }],
          },
          {
            id: 'ord-102',
            customerName: 'Liam Chen',
            customerPhone: '+1 (555) 876-5432',
            barberName: 'Marcus',
            subtotalCents: 3500,
            discountCents: 500,
            tipCents: 500,
            totalCents: 3500,
            paymentMethod: 'cash',
            status: 'completed',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            items: [{ itemName: 'Precision Skin Fade', quantity: 1, unitPriceCents: 3500 }],
          },
        ],
      });
    }

    const fetchedOrders = await db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
      limit: 50,
      with: {
        items: true,
        barber: true,
        customer: true,
      },
    });

    return NextResponse.json({ orders: fetchedOrders });
  } catch (error) {
    console.error('Failed to fetch POS orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerId,
      customerName = 'Walk-in Client',
      customerPhone,
      barberId,
      appointmentId,
      subtotalCents,
      discountCents = 0,
      tipCents = 0,
      taxCents = 0,
      totalCents,
      paymentMethod = 'cash',
      amountTenderedCents,
      changeDueCents = 0,
      paymentDetails,
      notes,
      items = [],
    } = body;

    if (!totalCents || totalCents <= 0) {
      return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      // In-memory mock response for local testing without DB
      const mockOrderId = `ord-${Date.now().toString().slice(-6)}`;
      return NextResponse.json({
        success: true,
        order: {
          id: mockOrderId,
          customerName,
          customerPhone,
          barberId,
          subtotalCents,
          discountCents,
          tipCents,
          taxCents,
          totalCents,
          paymentMethod,
          amountTenderedCents,
          changeDueCents,
          createdAt: new Date().toISOString(),
          items,
        },
      });
    }

    // Insert order in DB
    const [newOrder] = await db.insert(orders).values({
      customerId: customerId || null,
      customerName,
      customerPhone: customerPhone || null,
      barberId: barberId || null,
      appointmentId: appointmentId || null,
      subtotalCents,
      discountCents,
      tipCents,
      taxCents,
      totalCents,
      paymentMethod,
      amountTenderedCents: amountTenderedCents || totalCents,
      changeDueCents,
      paymentDetails: paymentDetails || null,
      notes: notes || null,
      status: 'completed',
    }).returning();

    // Insert order items
    if (items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        orderId: newOrder.id,
        serviceId: item.serviceId || null,
        barberId: item.barberId || barberId || null,
        itemName: item.itemName,
        itemType: item.itemType || 'service',
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity || 1,
        totalPriceCents: item.totalPriceCents || (item.unitPriceCents * (item.quantity || 1)),
        commissionCents: Math.round((item.unitPriceCents * (item.quantity || 1)) * 0.5),
      }));

      await db.insert(orderItems).values(itemsToInsert);
    }

    // If an appointment was linked, mark it as completed
    if (appointmentId) {
      await db.update(appointments)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(appointments.id, appointmentId));
    }

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error) {
    console.error('POS Checkout error:', error);
    return NextResponse.json({ error: 'Failed to complete POS transaction' }, { status: 500 });
  }
}
