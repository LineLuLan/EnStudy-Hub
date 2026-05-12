import { formatInTimeZone } from 'date-fns-tz';

/**
 * Format a UTC `Date` as a `YYYY-MM-DD` day key in the given IANA timezone.
 * Examples:
 *   - dayKey(2026-05-12T17:00:00Z, 'Asia/Ho_Chi_Minh') → '2026-05-13' (ICT = UTC+7)
 *   - dayKey(2026-05-12T16:59:59Z, 'Asia/Ho_Chi_Minh') → '2026-05-12'
 */
export function dayKey(date: Date, tz: string): string {
  return formatInTimeZone(date, tz, 'yyyy-MM-dd');
}

/** Convenience: today's key in the user's timezone. */
export function todayKey(now: Date, tz: string): string {
  return dayKey(now, tz);
}

/**
 * Shift a `YYYY-MM-DD` key by ±N days, returning another `YYYY-MM-DD`.
 * Operates in UTC at noon to avoid any timezone edge cases around midnight.
 */
export function shiftDay(key: string, delta: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export type StreakResult = {
  current: number;
  longest: number;
};

/**
 * Compute current + longest streak from a sorted ascending list of distinct
 * `YYYY-MM-DD` keys (each = one day the user reviewed at least one card).
 *
 *  - `longest`: max consecutive run anywhere in the list.
 *  - `current`: consecutive run ending exactly at `today`. If the latest key
 *    is not `today`, current = 0 (strict — encourages logging in today).
 */
export function computeStreaks(dayKeysAsc: readonly string[], today: string): StreakResult {
  if (dayKeysAsc.length === 0) return { current: 0, longest: 0 };

  // Longest run: walk forward, increment when consecutive, reset otherwise.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < dayKeysAsc.length; i += 1) {
    const prev = dayKeysAsc[i - 1];
    const curr = dayKeysAsc[i];
    if (prev !== undefined && curr !== undefined && curr === shiftDay(prev, 1)) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Current: walk backward from today.
  const latest = dayKeysAsc[dayKeysAsc.length - 1];
  if (latest !== today) return { current: 0, longest };

  let current = 1;
  let expected = shiftDay(today, -1);
  for (let i = dayKeysAsc.length - 2; i >= 0; i -= 1) {
    if (dayKeysAsc[i] === expected) {
      current += 1;
      expected = shiftDay(expected, -1);
    } else {
      break;
    }
  }

  return { current, longest };
}
