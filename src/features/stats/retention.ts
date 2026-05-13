import { and, eq, gte } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { profiles, reviewLogs } from '@/lib/db/schema';
import { dayKey, shiftDay, todayKey } from './dates';

export type RetentionPoint = {
  date: string;
  avgStability: number;
  sampleSize: number;
};

export type Retention = {
  points: RetentionPoint[];
  timezone: string;
  max: number;
  start: string;
  end: string;
};

const DEFAULT_WEEKS = 12;

/**
 * Average post-review FSRS stability per day for the last N weeks.
 *
 * `state_after.stability` is the FSRS-projected days-until-due after each rating.
 * Plotting its rolling average shows whether the user's cards are getting more or
 * less "sticky" over time — a flat or rising line means consistent retention,
 * falling means the user is being hammered by relapses.
 *
 * Days with zero reviews are emitted with `avgStability=0, sampleSize=0` so the
 * UI can render gaps without re-computing the date range itself.
 */
export async function getRetention(
  userId: string,
  weeks: number = DEFAULT_WEEKS,
  now: Date = new Date()
): Promise<Retention> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { timezone: true },
  });
  const tz = profile?.timezone ?? 'Asia/Ho_Chi_Minh';
  const days = weeks * 7;
  const end = todayKey(now, tz);
  const start = shiftDay(end, -(days - 1));

  const sinceUtc = new Date(now.getTime() - (days + 1) * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({ reviewedAt: reviewLogs.reviewedAt, stateAfter: reviewLogs.stateAfter })
    .from(reviewLogs)
    .where(and(eq(reviewLogs.userId, userId), gte(reviewLogs.reviewedAt, sinceUtc)));

  const buckets = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const stateAfter = r.stateAfter as { stability?: number } | null;
    const stability = typeof stateAfter?.stability === 'number' ? stateAfter.stability : 0;
    const k = dayKey(r.reviewedAt, tz);
    if (k < start || k > end) continue;
    const b = buckets.get(k) ?? { sum: 0, n: 0 };
    b.sum += stability;
    b.n += 1;
    buckets.set(k, b);
  }

  const points: RetentionPoint[] = [];
  let cursor = start;
  let max = 0;
  for (let i = 0; i < days; i += 1) {
    const b = buckets.get(cursor);
    const avg = b && b.n > 0 ? b.sum / b.n : 0;
    points.push({ date: cursor, avgStability: avg, sampleSize: b?.n ?? 0 });
    if (avg > max) max = avg;
    cursor = shiftDay(cursor, 1);
  }

  return { points, timezone: tz, max, start, end };
}
