import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointments } from '@/lib/db/schema';
import { sendTemplateMessage } from '@/lib/whatsapp/client';
import { buildReminderMessage } from '@/lib/whatsapp/templates';
import { and, eq, lte, gte, isNull } from 'drizzle-orm';
import { addHours, format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const in24Hours = addHours(now, 24);
    const in2Hours = addHours(now, 2);

    // Fetch appointments in next 24h that haven't had a 24h reminder
    const upcoming24h = await db.query.appointments.findMany({
      where: and(
        eq(appointments.status, 'confirmed'),
        gte(appointments.startTime, now),
        lte(appointments.startTime, in24Hours),
        isNull(appointments.reminder24hSentAt)
      ),
      with: {
        customer: true,
        service: true,
        barber: true
      }
    });

    let remindersSent = 0;

    for (const appt of upcoming24h) {
      if (!appt.customer?.phone) continue;
      
      const dateStr = format(appt.startTime, 'MMM dd, yyyy');
      const timeStr = format(appt.startTime, 'hh:mm a');

      try {
        if (process.env.WHATSAPP_ACCESS_TOKEN) {
          await sendTemplateMessage(
            appt.customer.phone,
            'appointment_reminder',
            'en',
            buildReminderMessage(
              appt.customer.fullName,
              appt.service?.title || 'Service',
              appt.barber?.fullName || 'RJ Barber',
              dateStr,
              timeStr
            )
          );
        }
        
        await db.update(appointments)
          .set({ reminder24hSentAt: new Date() })
          .where(eq(appointments.id, appt.id));
          
        remindersSent++;
      } catch (e) {
        console.error(`Failed to send 24h reminder for appt ${appt.id}`, e);
      }
    }

    // You would duplicate logic for the 2h reminders if tracked separately (e.g., reminder2hSentAt)

    return NextResponse.json({ success: true, remindersSent });
  } catch (error) {
    console.error('CRON Reminders Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
