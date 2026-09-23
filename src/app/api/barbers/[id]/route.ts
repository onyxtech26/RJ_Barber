import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barbers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const barber = await db.query.barbers.findFirst({
      where: eq(barbers.id, id),
      with: {
        services: true,
        shifts: true
      }
    });

    if (!barber) {
      return NextResponse.json({ error: 'Barber not found' }, { status: 404 });
    }

    return NextResponse.json({ barber });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const fullName = body.fullName || body.name;

    const updateData: Record<string, any> = {};
    if (fullName) updateData.fullName = fullName;
    if (body.phone) updateData.phone = body.phone;
    if (body.email) updateData.email = body.email;
    if (body.avatarUrl) updateData.avatarUrl = body.avatarUrl;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.commissionRate) updateData.commissionRate = String(body.commissionRate);
    
    const [updated] = await db.update(barbers)
      .set(updateData)
      .where(eq(barbers.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Barber not found' }, { status: 404 });
    }

    return NextResponse.json({ barber: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [deleted] = await db.update(barbers)
      .set({ isActive: false })
      .where(eq(barbers.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Barber not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, barber: deleted });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
