// The shop's trading day, in Malaysia time regardless of the PC's timezone setting.
export const SHOP_TIME_ZONE = 'Asia/Kuala_Lumpur';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SHOP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 'YYYY-MM-DD' for the given instant in shop time. */
export function toBusinessDate(at: Date = new Date()): string {
  return dateFormatter.format(at);
}
