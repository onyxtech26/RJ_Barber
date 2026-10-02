import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  dateToShopTime,
  dayRange,
  DEFAULT_WEEKLY_HOURS,
  formatTimeOfDay,
  parseTimeOfDay,
  rangesOverlap,
  shopTimeToDate,
  toTimeInput,
  weekdayOf,
  withinWorkingHours,
  type WeeklyHours,
} from './scheduling';

describe('shop time conversion (UTC+8)', () => {
  test('10:30 am in Malaysia is 02:30 UTC the same day', () => {
    assert.equal(shopTimeToDate('2026-10-02', 630).toISOString(), '2026-10-02T02:30:00.000Z');
  });

  test('just after midnight in Malaysia is still the previous day in UTC', () => {
    assert.equal(shopTimeToDate('2026-10-02', 30).toISOString(), '2026-10-01T16:30:00.000Z');
  });

  test('round trip', () => {
    const at = shopTimeToDate('2026-10-02', 1290);
    assert.deepEqual(dateToShopTime(at), { businessDate: '2026-10-02', minutes: 1290 });
  });
});

describe('rangesOverlap (half-open)', () => {
  test('back-to-back bookings do not overlap', () => {
    assert.equal(rangesOverlap(600, 630, 630, 660), false);
    assert.equal(rangesOverlap(630, 660, 600, 630), false);
  });
  test('any shared minute overlaps', () => {
    assert.equal(rangesOverlap(600, 645, 630, 660), true);
    assert.equal(rangesOverlap(600, 720, 630, 660), true); // one inside the other
  });
});

describe('working hours', () => {
  const hours: WeeklyHours = [null, { start: 600, end: 1260 }, { start: 600, end: 1260 }, { start: 600, end: 1260 }, { start: 600, end: 1260 }, { start: 600, end: 1260 }, { start: 540, end: 1080 }];

  test('weekday of a business date', () => {
    assert.equal(weekdayOf('2026-10-02'), 5); // Friday
    assert.equal(weekdayOf('2026-10-04'), 0); // Sunday
  });

  test('inside, edge and outside', () => {
    assert.equal(withinWorkingHours(hours, '2026-10-02', 600, 630), true);
    assert.equal(withinWorkingHours(hours, '2026-10-02', 1230, 1260), true); // ends exactly at closing
    assert.equal(withinWorkingHours(hours, '2026-10-02', 1245, 1275), false); // runs past closing
    assert.equal(withinWorkingHours(hours, '2026-10-02', 570, 600), false); // before opening
  });

  test('day off', () => {
    assert.equal(withinWorkingHours(hours, '2026-10-04', 700, 730), false);
  });

  test('no hours saved yet falls back to the default (10am–9pm daily)', () => {
    assert.equal(withinWorkingHours(null, '2026-10-04', 600, 630), true);
  });

  test('calendar range spans the earliest opening and latest closing', () => {
    assert.deepEqual(dayRange([hours, DEFAULT_WEEKLY_HOURS], '2026-10-03'), { start: 540, end: 1260 });
    assert.equal(dayRange([[null, null, null, null, null, null, null]], '2026-10-03'), null);
  });
});

describe('time formatting', () => {
  test('parseTimeOfDay', () => {
    assert.equal(parseTimeOfDay('10:30'), 630);
    assert.equal(parseTimeOfDay('9:05'), 545);
    assert.equal(parseTimeOfDay('24:00'), null);
    assert.equal(parseTimeOfDay('10:60'), null);
    assert.equal(parseTimeOfDay('abc'), null);
  });
  test('toTimeInput / formatTimeOfDay', () => {
    assert.equal(toTimeInput(545), '09:05');
    assert.equal(formatTimeOfDay(630), '10:30 am');
    assert.equal(formatTimeOfDay(720), '12:00 pm');
    assert.equal(formatTimeOfDay(1290), '9:30 pm');
    assert.equal(formatTimeOfDay(0), '12:00 am');
  });
});
