import { startOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * How many new cards the user is still allowed today.
 * Pure helper extracted from queue.ts so it can be unit-tested without a DB.
 */
export function computeNewRemaining(dailyNewLimit: number, newLearnedToday: number): number {
  return Math.max(0, dailyNewLimit - newLearnedToday);
}

/** Start-of-day in the user's timezone, returned as a UTC `Date`. */
export function dayStartUtc(now: Date, timezone: string): Date {
  const nowInTz = toZonedTime(now, timezone);
  const dayStartInTz = startOfDay(nowInTz);
  return fromZonedTime(dayStartInTz, timezone);
}
