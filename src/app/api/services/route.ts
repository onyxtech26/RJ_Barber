import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { services } from '@/lib/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const activeServices = await db.query.services.findMany({
      where: eq(services.isActive, true)
    });

    // Group by category if we had one, but we'll just return as list for now
    return NextResponse.json({ services: activeServices });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createServiceSchema = z.object({
  title: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  priceCents: z.number().int().positive().optional(),
  durationMinutes: z.number().positive(),
  bufferAfterMinutes: z.number().int().nonnegative().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createServiceSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: result.error.issues }, { status: 400 });
    }

    const title = result.data.title || result.data.name;
    if (!title) {
      return NextResponse.json({ error: 'Title or name is required' }, { status: 400 });
    }

    const priceCents = result.data.priceCents ?? (result.data.price ? Math.round(result.data.price * 100) : 0);
    
    const [service] = await db.insert(services).values({
      title,
      description: result.data.description,
      durationMinutes: result.data.durationMinutes,
      bufferAfterMinutes: result.data.bufferAfterMinutes ?? 5,
      priceCents,
      isActive: true
    }).returning();

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
