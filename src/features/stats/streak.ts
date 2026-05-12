import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { profiles, reviewLogs } from '@/lib/db/schema';
import { computeStreaks, dayKey, todayKey } from './dates';

export type Streak = {
  current: number;
  longest: number;
  daysActive: number;
  timezone: string;
  lastActiveDate: string | null;
};

/**
 * Compute current + longest streak from `review_logs.reviewed_at`, bucketed by
 * day in the user's timezone (from `profiles.timezone`, default Asia/Ho_Chi_Minh).
 *
 * Streak is "strict today": if the user hasn't reviewed today (in their local tz),
 * `current` is 0 even if yesterday had reviews. This is intentional MVP behaviour
 * to encourage daily engagement; can be softened later with a 1-day grace.
 */
export async function getStreak(userId: string, now: Date = new Date()): Promise<Streak> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { timezone: true },
  });
  const tz = profile?.timezone ?? 'Asia/Ho_Chi_Minh';

  const rows = await db
    .select({ reviewedAt: reviewLogs.reviewedAt })
    .from(reviewLogs)
    .where(eq(reviewLogs.userId, userId))
    .orderBy(desc(reviewLogs.reviewedAt));

  const daysSet = new Set<string>();
  for (const r of rows) {
    daysSet.add(dayKey(r.reviewedAt, tz));
  }
  const daysAsc = Array.from(daysSet).sort();
  const today = todayKey(now, tz);

  const { current, longest } = computeStreaks(daysAsc, today);
  const lastActiveDate = daysAsc.length > 0 ? (daysAsc[daysAsc.length - 1] ?? null) : null;

  return {
    current,
    longest,
    daysActive: daysAsc.length,
    timezone: tz,
    lastActiveDate,
  };
}
