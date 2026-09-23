import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { appointments, customers, services } from '@/lib/db/schema';
import { acquireSlotLock, getAvailableSlots } from '@/lib/scheduling/engine';
import { sendTemplateMessage } from '@/lib/whatsapp/client';
import { buildConfirmationMessage } from '@/lib/whatsapp/templates';
import { generateBookingToken } from '@/lib/tokens';
import { eq, desc } from 'drizzle-orm';
import { format } from 'date-fns';

const createBookingSchema = z.object({
  barberId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startTime: z.string().datetime(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email().optional(),
  sessionId: z.string()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createBookingSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request data', details: result.error }, { status: 400 });
    }
    
    const data = result.data;
    const startTime = new Date(data.startTime);
    
    const service = await db.query.services.findFirst({
      where: eq(services.id, data.serviceId)
    });
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const availableSlots = await getAvailableSlots(data.barberId, startTime, service.durationMinutes, 5);
    const isSlotAvailable = availableSlots.some(s => s.getTime() === startTime.getTime());
    
    if (!isSlotAvailable) {
      return NextResponse.json({ error: 'Slot is no longer available' }, { status: 409 });
    }

    const locked = await acquireSlotLock(data.barberId, startTime, data.sessionId);
    if (!locked) {
      return NextResponse.json({ error: 'Slot is locked by another user' }, { status: 409 });
    }

    let customer = await db.query.customers.findFirst({
      where: eq(customers.phone, data.customerPhone)
    });

    if (!customer) {
      const [newCustomer] = await db.insert(customers).values({
        fullName: data.customerName,
        phone: data.customerPhone,
        email: data.customerEmail
      }).returning();
      customer = newCustomer;
    } else {
      await db.update(customers).set({
        fullName: data.customerName,
        email: data.customerEmail || customer.email
      }).where(eq(customers.id, customer.id));
    }

    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

    const [appointment] = await db.insert(appointments).values({
      barberId: data.barberId,
      customerId: customer.id,
      serviceId: service.id,
      startTime,
      endTime,
      status: 'confirmed',
      totalPriceCents: service.priceCents
    }).returning();

    const manageToken = generateBookingToken(appointment.id);
    const dateStr = format(startTime, 'MMM dd, yyyy');
    const timeStr = format(startTime, 'hh:mm a');

    try {
      if (process.env.WHATSAPP_ACCESS_TOKEN) {
        await sendTemplateMessage(
          customer.phone,
          'appointment_confirmation',
          'en',
          buildConfirmationMessage(
            customer.fullName,
            service.title,
            'RJ Barber', 
            dateStr,
            timeStr,
            'RJ Barber Salon'
          )
        );
      }
    } catch (e) {
      console.error('Failed to send WhatsApp confirmation', e);
    }

    return NextResponse.json({ appointment, manageToken }, { status: 201 });
  } catch (error) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const barberId = searchParams.get('barberId');
    
    let whereClause = undefined;
    if (barberId) {
      whereClause = eq(appointments.barberId, barberId);
    }

    const appts = await db.query.appointments.findMany({
      where: whereClause,
      orderBy: [desc(appointments.startTime)],
      with: {
        customer: true,
        service: true,
        barber: true
      },
      limit: 100
    });

    return NextResponse.json({ appointments: appts });
  } catch (error) {
    console.error('Fetch Bookings Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
