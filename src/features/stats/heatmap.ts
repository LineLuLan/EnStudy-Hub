import { and, eq, gte } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { profiles, reviewLogs } from '@/lib/db/schema';
import { dayKey, shiftDay, todayKey } from './dates';

export type HeatmapCell = { date: string; count: number };

export type Heatmap = {
  cells: HeatmapCell[];
  timezone: string;
  total: number;
  max: number;
  start: string;
  end: string;
};

const DEFAULT_DAYS = 84; // 12 weeks — matches GitHub-style heatmap proportions for a sidebar widget.

/**
 * Daily review counts for the last N days (default 84 = 12 weeks).
 *
 * Buckets `review_logs.reviewed_at` by date in the user's timezone. Returns
 * a cell for every day in the window, even if 0 reviews — UI can render
 * empty squares without gap-filling itself.
 */
export async function getHeatmap(
  userId: string,
  days: number = DEFAULT_DAYS,
  now: Date = new Date()
): Promise<Heatmap> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { timezone: true },
  });
  const tz = profile?.timezone ?? 'Asia/Ho_Chi_Minh';
  const end = todayKey(now, tz);
  const start = shiftDay(end, -(days - 1));

  // Buffer +1 day on the UTC query window to cover timezone offsets at the edges.
  const sinceUtc = new Date(now.getTime() - (days + 1) * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({ reviewedAt: reviewLogs.reviewedAt })
    .from(reviewLogs)
    .where(and(eq(reviewLogs.userId, userId), gte(reviewLogs.reviewedAt, sinceUtc)));

  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = dayKey(r.reviewedAt, tz);
    if (k >= start && k <= end) {
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }

  const cells: HeatmapCell[] = [];
  let cursor = start;
  let max = 0;
  let total = 0;
  for (let i = 0; i < days; i += 1) {
    const count = counts.get(cursor) ?? 0;
    cells.push({ date: cursor, count });
    if (count > max) max = count;
    total += count;
    cursor = shiftDay(cursor, 1);
  }

  return { cells, timezone: tz, total, max, start, end };
}
