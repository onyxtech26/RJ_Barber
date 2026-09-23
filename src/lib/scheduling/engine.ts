import { db } from '@/lib/db';
import { barberShifts, barberTimeOff, appointments } from '@/lib/db/schema';
import { subtractIntervals, generateTimeSlots, TimeInterval } from './intervals';
import { redis } from '@/lib/redis';
import { and, eq, gte, lte, not, inArray } from 'drizzle-orm';
import { startOfDay, endOfDay, setHours, setMinutes, parseISO, getDay } from 'date-fns';

function parseTime(baseDate: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  let d = setHours(baseDate, hours);
  d = setMinutes(d, minutes);
  return d;
}

export async function getAvailableSlots(barberId: string, date: Date, serviceDurationMinutes: number, bufferMinutes: number): Promise<Date[]> {
  const startDate = startOfDay(date);
  const endDate = endOfDay(date);
  const dayOfWeek = getDay(date);

  // 1. Fetch barber's shift for that day of week
  const shiftRecord = await db.query.barberShifts.findFirst({
    where: and(
      eq(barberShifts.barberId, barberId),
      eq(barberShifts.dayOfWeek, dayOfWeek)
    )
  });

  if (!shiftRecord) return [];

  // 2. Create base interval from shift start/end
  const shiftStart = parseTime(date, shiftRecord.startTime);
  const shiftEnd = parseTime(date, shiftRecord.endTime);
  const baseIntervals: TimeInterval[] = [{ start: shiftStart, end: shiftEnd }];

  // 3. Subtract break interval (if exists)
  const busyBlocks: TimeInterval[] = [];

  if (shiftRecord.breakStart && shiftRecord.breakEnd) {
    busyBlocks.push({
      start: parseTime(date, shiftRecord.breakStart),
      end: parseTime(date, shiftRecord.breakEnd)
    });
  }

  // 4. Subtract existing appointments for that day (status NOT in cancelled, no_show)
  const existingAppts = await db.query.appointments.findMany({
    where: and(
      eq(appointments.barberId, barberId),
      gte(appointments.startTime, startDate),
      lte(appointments.endTime, endDate),
      not(inArray(appointments.status, ['cancelled', 'no_show']))
    )
  });

  for (const appt of existingAppts) {
    busyBlocks.push({ start: appt.startTime, end: appt.endTime });
  }

  // 5. Subtract barber time-off overlapping that day
  const timeOffs = await db.query.barberTimeOff.findMany({
    where: and(
      eq(barberTimeOff.barberId, barberId),
      lte(barberTimeOff.startDate, endDate),
      gte(barberTimeOff.endDate, startDate)
    )
  });

  for (const to of timeOffs) {
    busyBlocks.push({
      start: to.startDate > startDate ? to.startDate : startDate,
      end: to.endDate < endDate ? to.endDate : endDate
    });
  }

  // Generate available start times using generateTimeSlots
  const availableIntervals = subtractIntervals(baseIntervals, busyBlocks);
  const possibleSlots = generateTimeSlots(availableIntervals, serviceDurationMinutes, bufferMinutes, 15);

  // 6. Subtract Redis soft-lock holds (keys like lock:barber:{barberId}:{isoString})
  // 7. Generate available start times and return sorted array
  const availableSlots: Date[] = [];
  for (const slot of possibleSlots) {
    const lockKey = `lock:barber:${barberId}:${slot.toISOString()}`;
    const isLocked = await redis.get(lockKey);
    if (!isLocked) {
      availableSlots.push(slot);
    }
  }

  return availableSlots.sort((a, b) => a.getTime() - b.getTime());
}

export async function acquireSlotLock(barberId: string, startTime: Date, sessionId: string, ttlSeconds: number = 300): Promise<boolean> {
  const lockKey = `lock:barber:${barberId}:${startTime.toISOString()}`;
  const acquired = await redis.set(lockKey, sessionId, { nx: true, ex: ttlSeconds });
  return acquired === 'OK';
}

export async function releaseSlotLock(barberId: string, startTime: Date, sessionId: string): Promise<void> {
  const lockKey = `lock:barber:${barberId}:${startTime.toISOString()}`;
  const currentLock = await redis.get(lockKey);
  if (currentLock === sessionId) {
    await redis.del(lockKey);
  }
}

export async function getBarberScheduleForDay(barberId: string, date: Date) {
  const startDate = startOfDay(date);
  const endDate = endOfDay(date);
  const dayOfWeek = getDay(date);

  const shiftRecord = await db.query.barberShifts.findFirst({
    where: and(
      eq(barberShifts.barberId, barberId),
      eq(barberShifts.dayOfWeek, dayOfWeek)
    )
  });

  let shift: TimeInterval | null = null;
  const breaks: TimeInterval[] = [];

  if (shiftRecord) {
    shift = {
      start: parseTime(date, shiftRecord.startTime),
      end: parseTime(date, shiftRecord.endTime)
    };
    if (shiftRecord.breakStart && shiftRecord.breakEnd) {
      breaks.push({
        start: parseTime(date, shiftRecord.breakStart),
        end: parseTime(date, shiftRecord.breakEnd)
      });
    }
  }

  const existingAppts = await db.query.appointments.findMany({
    where: and(
      eq(appointments.barberId, barberId),
      gte(appointments.startTime, startDate),
      lte(appointments.endTime, endDate),
      not(inArray(appointments.status, ['cancelled', 'no_show']))
    ),
    with: {
      customer: true,
      service: true
    }
  });

  const apptList = existingAppts.map(appt => ({
    id: appt.id,
    start: appt.startTime,
    end: appt.endTime,
    status: appt.status,
    customerName: appt.customer?.fullName || 'Unknown',
    serviceName: appt.service?.title || 'Unknown'
  }));

  return {
    shift,
    breaks,
    appointments: apptList
  };
}
