import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { z } from 'zod';
import { or, ilike } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    let whereClause = undefined;
    if (search) {
      whereClause = or(
        ilike(customers.fullName, `%${search}%`),
        ilike(customers.phone, `%${search}%`)
      );
    }

    const customerList = await db.query.customers.findMany({
      where: whereClause,
      limit: 50
    });

    return NextResponse.json({ customers: customerList });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createCustomerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  notes: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createCustomerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: result.error.issues }, { status: 400 });
    }
    
    const [customer] = await db.insert(customers).values(result.data).returning();

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
