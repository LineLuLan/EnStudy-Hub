import { and, eq, lte, ne } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { profiles, userCards } from '@/lib/db/schema';
import { bucketizeDueByDay, type ForecastResult } from './forecast-utils';

const DEFAULT_DAYS = 7;

/**
 * Fetch the user's due-cards forecast for the next N days. Reads `profiles.
 * timezone` so day boundaries align with the user's wall clock (same rule as
 * heatmap + streak).
 *
 * Filter: `state != 'new'` (FSRS not started → not part of due schedule),
 * `suspended = false` (consistent with `getReviewQueue` chunk 4). Limit query
 * to cards due within the N-day window plus all overdue cards.
 */
export async function getDueForecast(
  userId: string,
  days: number = DEFAULT_DAYS,
  now: Date = new Date()
): Promise<ForecastResult> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { timezone: true },
  });
  const timezone = profile?.timezone ?? 'Asia/Ho_Chi_Minh';

  // Upper bound: N full days from now, padded a bit to avoid edge cases at
  // midnight boundary. Anything beyond is dropped during bucketization.
  const windowEnd = new Date(now.getTime() + (days + 1) * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({ due: userCards.due })
    .from(userCards)
    .where(
      and(
        eq(userCards.userId, userId),
        ne(userCards.state, 'new'),
        eq(userCards.suspended, false),
        lte(userCards.due, windowEnd)
      )
    );

  return bucketizeDueByDay(
    rows.map((r) => r.due),
    now,
    timezone,
    days
  );
}
