import { SHOP_TIME_ZONE } from './business-date';

// Dates and times always shown in shop time (Malaysia), whatever the device's timezone.

const time = new Intl.DateTimeFormat('en-MY', { timeZone: SHOP_TIME_ZONE, hour: 'numeric', minute: '2-digit' });
const dateTime = new Intl.DateTimeFormat('en-MY', {
  timeZone: SHOP_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const longDay = new Intl.DateTimeFormat('en-MY', {
  timeZone: 'UTC', // business dates are plain calendar days; format them without shifting
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export const formatTime = (at: Date) => time.format(at);
export const formatDateTime = (at: Date) => dateTime.format(at);

/** '2026-10-01' → 'Thursday, 1 October 2026' */
export const formatBusinessDate = (businessDate: string) => longDay.format(new Date(`${businessDate}T00:00:00Z`));

/** Adds whole days to a 'YYYY-MM-DD' calendar date. */
export function shiftBusinessDate(businessDate: string, days: number): string {
  const d = new Date(`${businessDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
