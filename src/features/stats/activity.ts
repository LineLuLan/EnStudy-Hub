import { and, eq, gte } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { profiles, reviewLogs } from '@/lib/db/schema';
import { dayKey, shiftDay, todayKey } from './dates';

export type ActivityCell = {
  date: string;
  again: number;
  hard: number;
  good: number;
  easy: number;
  total: number;
};

export type Activity = {
  cells: ActivityCell[];
  timezone: string;
  max: number;
  total: number;
  totalByRating: { again: number; hard: number; good: number; easy: number };
  start: string;
  end: string;
};

const DEFAULT_DAYS = 30;

/**
 * Daily review counts broken down by rating (Again / Hard / Good / Easy) for the
 * last N days. Powers the stacked bar chart on `/stats` — differentiates from the
 * dashboard heatmap by showing rating composition per day, not just volume.
 */
export async function getActivity(
  userId: string,
  days: number = DEFAULT_DAYS,
  now: Date = new Date()
): Promise<Activity> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { timezone: true },
  });
  const tz = profile?.timezone ?? 'Asia/Ho_Chi_Minh';
  const end = todayKey(now, tz);
  const start = shiftDay(end, -(days - 1));

  const sinceUtc = new Date(now.getTime() - (days + 1) * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({ reviewedAt: reviewLogs.reviewedAt, rating: reviewLogs.rating })
    .from(reviewLogs)
    .where(and(eq(reviewLogs.userId, userId), gte(reviewLogs.reviewedAt, sinceUtc)));

  const buckets = new Map<string, ActivityCell>();
  const totalByRating = { again: 0, hard: 0, good: 0, easy: 0 };

  for (const r of rows) {
    const k = dayKey(r.reviewedAt, tz);
    if (k < start || k > end) continue;
    const cell = buckets.get(k) ?? {
      date: k,
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
      total: 0,
    };
    if (r.rating === 1) {
      cell.again += 1;
      totalByRating.again += 1;
    } else if (r.rating === 2) {
      cell.hard += 1;
      totalByRating.hard += 1;
    } else if (r.rating === 3) {
      cell.good += 1;
      totalByRating.good += 1;
    } else if (r.rating === 4) {
      cell.easy += 1;
      totalByRating.easy += 1;
    }
    cell.total += 1;
    buckets.set(k, cell);
  }

  const cells: ActivityCell[] = [];
  let cursor = start;
  let max = 0;
  let total = 0;
  for (let i = 0; i < days; i += 1) {
    const cell =
      buckets.get(cursor) ??
      ({ date: cursor, again: 0, hard: 0, good: 0, easy: 0, total: 0 } as ActivityCell);
    cells.push(cell);
    if (cell.total > max) max = cell.total;
    total += cell.total;
    cursor = shiftDay(cursor, 1);
  }

  return { cells, timezone: tz, max, total, totalByRating, start, end };
}
