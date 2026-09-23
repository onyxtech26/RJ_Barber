import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
      with: {
        customer: true,
        service: true,
        barber: true
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Fetch Booking Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, startTime, endTime } = body;
    
    const updateData: any = {};
    if (status) updateData.status = status;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);

    const [updated] = await db.update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    console.error('Update Booking Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [deleted] = await db.update(appointments)
      .set({ status: 'cancelled' })
      .where(eq(appointments.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, appointment: deleted });
  } catch (error) {
    console.error('Delete Booking Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
