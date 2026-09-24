import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { registerSessions, orders } from '@/lib/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        activeSession: {
          id: 'session-demo',
          openedBy: 'RJ Cashier Station #1',
          openingFloatCents: 20000,
          status: 'open',
          openedAt: new Date(Date.now() - 28800000).toISOString(),
          cashCollectedCents: 45000,
          cardCollectedCents: 62500,
          tipsCollectedCents: 15500,
          totalTransactions: 14,
        },
      });
    }

    const activeSession = await db.query.registerSessions.findFirst({
      where: eq(registerSessions.status, 'open'),
      orderBy: [desc(registerSessions.openedAt)],
    });

    if (!activeSession) {
      return NextResponse.json({ activeSession: null });
    }

    // Compute live stats for the active session
    const sessionOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.registerSessionId, activeSession.id),
        eq(orders.status, 'completed')
      ),
    });

    let cashCollectedCents = 0;
    let cardCollectedCents = 0;
    let tipsCollectedCents = 0;

    sessionOrders.forEach(ord => {
      tipsCollectedCents += ord.tipCents || 0;
      if (ord.paymentMethod === 'cash') {
        cashCollectedCents += ord.totalCents;
      } else {
        cardCollectedCents += ord.totalCents;
      }
    });

    return NextResponse.json({
      activeSession: {
        ...activeSession,
        cashCollectedCents,
        cardCollectedCents,
        tipsCollectedCents,
        totalTransactions: sessionOrders.length,
      },
    });
  } catch (error) {
    console.error('Failed to get register session:', error);
    return NextResponse.json({ error: 'Failed to retrieve register status' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, openingFloatCents = 20000, closingCashCents, notes } = body;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        action,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'open') {
      const [newSession] = await db.insert(registerSessions).values({
        openedBy: 'Cashier Station',
        openingFloatCents,
        status: 'open',
        notes: notes || 'Morning shift open',
      }).returning();

      return NextResponse.json({ success: true, session: newSession });
    } else if (action === 'close') {
      const activeSession = await db.query.registerSessions.findFirst({
        where: eq(registerSessions.status, 'open'),
        orderBy: [desc(registerSessions.openedAt)],
      });

      if (!activeSession) {
        return NextResponse.json({ error: 'No open register session found' }, { status: 400 });
      }

      // Calculate expected cash
      const cashOrders = await db.query.orders.findMany({
        where: and(
          eq(orders.registerSessionId, activeSession.id),
          eq(orders.paymentMethod, 'cash'),
          eq(orders.status, 'completed')
        ),
      });

      const totalCashRevenue = cashOrders.reduce((sum, o) => sum + o.totalCents, 0);
      const expectedCashCents = activeSession.openingFloatCents + totalCashRevenue;
      const discrepancyCents = (closingCashCents || expectedCashCents) - expectedCashCents;

      const [updatedSession] = await db.update(registerSessions)
        .set({
          status: 'closed',
          closingCashCents: closingCashCents || expectedCashCents,
          expectedCashCents,
          cashDifferenceCents: discrepancyCents,
          closedAt: new Date(),
          notes: notes || null,
        })
        .where(eq(registerSessions.id, activeSession.id))
        .returning();

      return NextResponse.json({ success: true, session: updatedSession });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Register session error:', error);
    return NextResponse.json({ error: 'Failed to process register action' }, { status: 500 });
  }
}
