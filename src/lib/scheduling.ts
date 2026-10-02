// Pure booking-time maths, shared by the bookings page (client) and the Server Actions.
// Times of day are minutes after midnight in shop time (Malaysia, UTC+8, no daylight saving),
// so 10:30 am = 630. Stored timestamps are real instants (epoch ms).

const SHOP_UTC_OFFSET_MIN = 8 * 60;
export const SLOT_MINUTES = 15;

/** Opening hours for one weekday, or null for a day off. */
export type DayHours = { start: number; end: number } | null;
/** Index 0 = Sunday … 6 = Saturday (same as Date.getUTCDay()). */
export type WeeklyHours = DayHours[];

export const DEFAULT_WEEKLY_HOURS: WeeklyHours = Array.from({ length: 7 }, () => ({ start: 10 * 60, end: 21 * 60 }));
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** 0 = Sunday … 6 = Saturday for a 'YYYY-MM-DD' business date. */
export function weekdayOf(businessDate: string): number {
  return new Date(`${businessDate}T00:00:00Z`).getUTCDay();
}

/** The real instant for a shop-time minute on a business date. */
export function shopTimeToDate(businessDate: string, minutes: number): Date {
  const midnightUtc = Date.parse(`${businessDate}T00:00:00Z`);
  return new Date(midnightUtc + (minutes - SHOP_UTC_OFFSET_MIN) * 60_000);
}

/** Business date and shop-time minute of a real instant. */
export function dateToShopTime(at: Date): { businessDate: string; minutes: number } {
  const shifted = new Date(at.getTime() + SHOP_UTC_OFFSET_MIN * 60_000);
  return {
    businessDate: shifted.toISOString().slice(0, 10),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

/** Half-open ranges [start, end): back-to-back bookings (10:00–10:30 then 10:30–11:00) don't overlap. */
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Whether [start, end) on that date fits inside the barber's hours. */
export function withinWorkingHours(hours: WeeklyHours | null | undefined, businessDate: string, start: number, end: number) {
  const day = (hours ?? DEFAULT_WEEKLY_HOURS)[weekdayOf(businessDate)];
  return day !== null && day !== undefined && start >= day.start && end <= day.end;
}

/** "10:30" → 630. Returns null for anything that isn't a valid 24-hour time. */
export function parseTimeOfDay(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [hours, minutes] = [Number(match[1]), Number(match[2])];
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** 630 → "10:30" (for <input type="time">). */
export function toTimeInput(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** 630 → "10:30 am", 1290 → "9:30 pm" */
export function formatTimeOfDay(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h24 < 12 ? 'am' : 'pm';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Earliest opening and latest closing across a set of barbers on a date — the calendar's visible range. */
export function dayRange(allHours: (WeeklyHours | null | undefined)[], businessDate: string): { start: number; end: number } | null {
  const weekday = weekdayOf(businessDate);
  const days = allHours.map((h) => (h ?? DEFAULT_WEEKLY_HOURS)[weekday]).filter((d): d is { start: number; end: number } => !!d);
  if (days.length === 0) return null;
  return { start: Math.min(...days.map((d) => d.start)), end: Math.max(...days.map((d) => d.end)) };
}
