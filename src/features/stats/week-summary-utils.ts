import type { Activity } from './activity';
import { dayKey, shiftDay } from './dates';

export type WeekSummary = {
  /** Total reviews logged from Monday-of-this-week through today (inclusive). */
  reviews: number;
  /** Total reviews rated Good or Easy, divided by total. 0-100 integer. 0 if no reviews. */
  accuracy: number;
  /** Distinct day count (Mon..today) with at least 1 review. 0..7. */
  daysActive: number;
  /** YYYY-MM-DD of Monday-this-week in user tz. */
  weekStart: string;
  /** YYYY-MM-DD of today in user tz. */
  weekEnd: string;
};

/**
 * Resolve the Monday-of-this-week date key in the user's timezone.
 *
 * `dayKey` already gives us today in tz; from there walk back N days where N
 * is the offset to Monday. Sunday → 6 days back (per ISO 8601 week starts Mon).
 * Date constructor uses noon UTC to avoid tz boundary artefacts (same pattern
 * as `shiftDay` and `labelForDay`).
 */
export function mondayOfWeek(todayKeyValue: string): string {
  const date = new Date(`${todayKeyValue}T12:00:00Z`);
  const dow = date.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysBackToMonday = dow === 0 ? 6 : dow - 1;
  return shiftDay(todayKeyValue, -daysBackToMonday);
}

/**
 * Derive a "this week" summary from the daily Activity cells produced by
 * `getActivity`. Slices cells with date in [weekStart, weekEnd] (= Mon..today
 * in user tz), sums totals, counts distinct days with activity, and computes
 * accuracy as (good + easy) / total.
 *
 * Filters by date key string comparison, which is safe because dayKey() emits
 * `YYYY-MM-DD` and lexicographic ordering matches chronological ordering for
 * that format.
 */
export function summarizeWeek(activity: Activity, now: Date, tz: string): WeekSummary {
  const todayKeyValue = dayKey(now, tz);
  const weekStart = mondayOfWeek(todayKeyValue);
  const weekEnd = todayKeyValue;

  let reviews = 0;
  let correct = 0;
  let daysActive = 0;
  for (const cell of activity.cells) {
    if (cell.date < weekStart || cell.date > weekEnd) continue;
    if (cell.total > 0) daysActive += 1;
    reviews += cell.total;
    correct += cell.good + cell.easy;
  }

  const accuracy = reviews > 0 ? Math.round((correct / reviews) * 100) : 0;

  return { reviews, accuracy, daysActive, weekStart, weekEnd };
}
