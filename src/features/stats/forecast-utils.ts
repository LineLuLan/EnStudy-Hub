import { dayKey, shiftDay } from './dates';

export type ForecastDay = {
  /** `YYYY-MM-DD` in the user's timezone. */
  key: string;
  /** Vietnamese short label for the day (e.g. "Hôm nay", "T3", "T4"...). */
  label: string;
  /** Number of cards due on this day. Overdue cards collapse onto today. */
  count: number;
  /** True for the bucket whose key === todayKey(now, tz). */
  isToday: boolean;
};

export type ForecastResult = {
  days: ForecastDay[];
  /** Largest single-day count, useful for chart Y axis scaling. */
  maxCount: number;
  /** Sum across all `days`. */
  total: number;
  /** Of `total`, how many are overdue (due ≤ now) — collapsed into today. */
  overdue: number;
};

const VN_WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const;

/**
 * Compute the VN-style label for a given day key (in the user's tz). Today
 * gets "Hôm nay" instead of the weekday for quick scanning.
 *
 * `dayKey` is YYYY-MM-DD; parsing as `T12:00:00Z` is intentional (noon UTC
 * avoids tz boundary issues for getUTCDay()).
 */
export function labelForDay(key: string, todayKey: string): string {
  if (key === todayKey) return 'Hôm nay';
  const date = new Date(`${key}T12:00:00Z`);
  return VN_WEEKDAY[date.getUTCDay()] ?? '?';
}

/**
 * Bucketize a list of due-dates into a 7 (or N) day forecast in the user's
 * timezone. Overdue cards (due < now or due-day < today) are added to today's
 * bucket so they don't disappear from the chart.
 *
 * `nowDate` is the wall-clock anchor (typically `new Date()` in server time);
 * day boundaries are computed via `dayKey(date, tz)` so a user in UTC+7 at
 * 02:00 local sees today as today and not yesterday.
 */
export function bucketizeDueByDay(
  dueDates: readonly Date[],
  nowDate: Date,
  tz: string,
  days: number
): ForecastResult {
  if (days < 1) days = 1;
  const today = dayKey(nowDate, tz);

  // Seed all N day buckets so empty future days still appear in the chart.
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    buckets.set(shiftDay(today, i), 0);
  }

  let overdue = 0;
  for (const due of dueDates) {
    const k = dayKey(due, tz);
    if (k <= today) {
      // Overdue (or due today) — bucket as today
      buckets.set(today, (buckets.get(today) ?? 0) + 1);
      if (k < today) overdue += 1;
    } else if (buckets.has(k)) {
      buckets.set(k, (buckets.get(k) ?? 0) + 1);
    }
    // Else: due beyond the N-day window, drop silently.
  }

  const result: ForecastDay[] = [];
  let maxCount = 0;
  let total = 0;
  for (let i = 0; i < days; i += 1) {
    const key = shiftDay(today, i);
    const count = buckets.get(key) ?? 0;
    if (count > maxCount) maxCount = count;
    total += count;
    result.push({
      key,
      label: labelForDay(key, today),
      count,
      isToday: key === today,
    });
  }

  return { days: result, maxCount, total, overdue };
}
