import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { services } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const service = await db.query.services.findFirst({
      where: eq(services.id, id)
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const title = body.title || body.name;
    
    const updateData: Record<string, any> = {};
    if (title) updateData.title = title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.durationMinutes) updateData.durationMinutes = body.durationMinutes;
    if (body.bufferAfterMinutes !== undefined) updateData.bufferAfterMinutes = body.bufferAfterMinutes;
    if (body.priceCents !== undefined) updateData.priceCents = body.priceCents;
    else if (body.price !== undefined) updateData.priceCents = Math.round(body.price * 100);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    
    const [updated] = await db.update(services)
      .set(updateData)
      .where(eq(services.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ service: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [deleted] = await db.update(services)
      .set({ isActive: false })
      .where(eq(services.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, service: deleted });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
