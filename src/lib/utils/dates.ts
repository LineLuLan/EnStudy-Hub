import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** Format a UTC Date in user's timezone as YYYY-MM-DD (for streak lookup). */
export function toLocalDateString(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
}

/** Convert UTC Date to a Date object representing the wall-clock time in `timezone`. */
export function toUserZoned(date: Date, timezone: string = DEFAULT_TIMEZONE): Date {
  return toZonedTime(date, timezone);
}

/** Format relative interval like "1d", "6h", "<1m" for SRS rating buttons. */
export function formatInterval(ms: number): string {
  if (ms < 60_000) return '<1m';
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h`;
  return `${Math.round(ms / 86_400_000)}d`;
}

/** Human-friendly format for last review timestamp. */
export function formatReviewTime(date: Date): string {
  return format(date, 'PPpp');
}
