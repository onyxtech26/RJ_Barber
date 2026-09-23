import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAvailableSlots } from '@/lib/scheduling/engine';
import { db } from '@/lib/db';
import { services } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const slotsQuerySchema = z.object({
  barberId: z.string().uuid(),
  date: z.string().datetime(),
  serviceId: z.string().uuid()
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = {
      barberId: searchParams.get('barberId'),
      date: searchParams.get('date'),
      serviceId: searchParams.get('serviceId')
    };

    const result = slotsQuerySchema.safeParse(query);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: result.error.issues }, { status: 400 });
    }

    const { barberId, date, serviceId } = result.data;
    
    const service = await db.query.services.findFirst({
      where: eq(services.id, serviceId)
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const slots = await getAvailableSlots(barberId, new Date(date), service.durationMinutes || 30, 5);
    
    return NextResponse.json({
      slots: slots.map(s => s.toISOString())
    });

  } catch (error) {
    console.error('API /slots GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
