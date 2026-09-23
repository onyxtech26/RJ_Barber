import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, id),
      with: {
        appointments: {
          with: {
            service: true,
            barber: true
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { fullName, phone, email, notes } = body;
    
    const [updated] = await db.update(customers)
      .set({ fullName, phone, email, notes })
      .where(eq(customers.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
