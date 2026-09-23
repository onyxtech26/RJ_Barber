import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barbers } from '@/lib/db/schema';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');
    
    let whereClause = eq(barbers.isActive, true);
    if (shopId) {
      whereClause = and(whereClause, eq(barbers.shopId, shopId)) as any;
    }

    const activeBarbers = await db.query.barbers.findMany({
      where: whereClause,
      with: {
        services: true
      }
    });

    return NextResponse.json({ barbers: activeBarbers });
  } catch (error) {
    console.error('API /barbers GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createBarberSchema = z.object({
  fullName: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  email: z.string().email(),
  phone: z.string().min(10),
  shopId: z.string().uuid().optional(),
  avatarUrl: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createBarberSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: result.error.issues }, { status: 400 });
    }

    const fullName = result.data.fullName || result.data.name;
    if (!fullName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const [barber] = await db.insert(barbers).values({
      fullName,
      email: result.data.email,
      phone: result.data.phone,
      shopId: result.data.shopId,
      avatarUrl: result.data.avatarUrl,
      isActive: true
    }).returning();

    return NextResponse.json({ barber }, { status: 201 });
  } catch (error) {
    console.error('API /barbers POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
