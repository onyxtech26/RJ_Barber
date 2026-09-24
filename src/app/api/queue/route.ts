import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queueEntries } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      // In-memory demo data for queue & chairs
      return NextResponse.json({
        queue: [
          {
            id: 'q-1',
            customerName: 'Sam Rockwell',
            customerPhone: '+1 (555) 345-6789',
            serviceName: 'Skin Fade + Beard Lineup',
            preferredBarberName: 'RJ (Master Barber)',
            status: 'waiting',
            estimatedWaitMinutes: 10,
            joinedAt: new Date(Date.now() - 15 * 60000).toISOString(),
          },
          {
            id: 'q-2',
            customerName: 'Derrick Rose',
            customerPhone: '+1 (555) 789-0123',
            serviceName: 'Executive Hot Towel Shave',
            preferredBarberName: 'Marcus',
            status: 'waiting',
            estimatedWaitMinutes: 25,
            joinedAt: new Date(Date.now() - 5 * 60000).toISOString(),
          },
        ],
        chairs: [
          {
            chairNumber: 1,
            barberName: 'RJ (Master Barber)',
            barberId: 'barber-1',
            status: 'in_chair',
            clientName: 'Michael Scott',
            serviceName: 'Signature Fade',
            elapsedMinutes: 28,
            estimatedTotalMinutes: 45,
          },
          {
            chairNumber: 2,
            barberName: 'Marcus',
            barberId: 'barber-2',
            status: 'in_chair',
            clientName: 'Jim Halpert',
            serviceName: 'Classic Cut',
            elapsedMinutes: 14,
            estimatedTotalMinutes: 30,
          },
          {
            chairNumber: 3,
            barberName: 'David L.',
            barberId: 'barber-3',
            status: 'available',
            clientName: null,
            serviceName: null,
            elapsedMinutes: 0,
            estimatedTotalMinutes: 0,
          },
        ],
      });
    }

    const liveQueue = await db.query.queueEntries.findMany({
      where: eq(queueEntries.status, 'waiting'),
      orderBy: [desc(queueEntries.joinedAt)],
      with: {
        service: true,
        preferredBarber: true,
      },
    });

    return NextResponse.json({ queue: liveQueue });
  } catch (error) {
    console.error('Queue API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve queue' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, customerPhone, serviceId, preferredBarberId, notes } = body;

    if (!customerName) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        entry: {
          id: `q-${Date.now().toString().slice(-4)}`,
          customerName,
          customerPhone,
          serviceId,
          preferredBarberId,
          status: 'waiting',
          estimatedWaitMinutes: 15,
          joinedAt: new Date().toISOString(),
          notes,
        },
      });
    }

    const [newEntry] = await db.insert(queueEntries).values({
      customerName,
      customerPhone: customerPhone || null,
      serviceId: serviceId || null,
      preferredBarberId: preferredBarberId || null,
      status: 'waiting',
      estimatedWaitMinutes: 15,
      notes: notes || null,
    }).returning();

    return NextResponse.json({ success: true, entry: newEntry }, { status: 201 });
  } catch (error) {
    console.error('Queue creation error:', error);
    return NextResponse.json({ error: 'Failed to add walk-in to queue' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing entry id or status' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, id, status });
    }

    const updateData: any = { status };
    if (status === 'in_chair') {
      updateData.seatedAt = new Date();
    } else if (status === 'completed' || status === 'cancelled') {
      updateData.completedAt = new Date();
    }

    const [updated] = await db.update(queueEntries)
      .set(updateData)
      .where(eq(queueEntries.id, id))
      .returning();

    return NextResponse.json({ success: true, entry: updated });
  } catch (error) {
    console.error('Queue update error:', error);
    return NextResponse.json({ error: 'Failed to update queue entry' }, { status: 500 });
  }
}
