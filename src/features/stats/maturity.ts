import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { userCards } from '@/lib/db/schema';
import type { DbCardState } from '@/features/srs/fsrs';

export const MATURE_STABILITY_DAYS = 21;

export type MaturityCounts = {
  new: number;
  learning: number;
  review: number;
  relearning: number;
  mature: number;
  total: number;
};

/**
 * Aggregate user_cards by FSRS state for the dashboard "card maturity" widget.
 *
 *  - new/learning/review/relearning: counts per `cards.state` enum value.
 *  - mature: subset of `review` state where `stability >= 21 days` (matches
 *    Anki "mature" definition).
 *  - total: total enrolled cards.
 *
 * Done as a single SELECT + JS aggregation to keep the query trivial; row
 * counts for a single user typically stay under a few thousand.
 */
export async function getMaturityCounts(userId: string): Promise<MaturityCounts> {
  const rows = await db
    .select({ state: userCards.state, stability: userCards.stability })
    .from(userCards)
    .where(eq(userCards.userId, userId));

  const counts: MaturityCounts = {
    new: 0,
    learning: 0,
    review: 0,
    relearning: 0,
    mature: 0,
    total: rows.length,
  };

  for (const r of rows) {
    const state = r.state as DbCardState;
    counts[state] += 1;
    if (state === 'review' && r.stability >= MATURE_STABILITY_DAYS) {
      counts.mature += 1;
    }
  }

  return counts;
}
