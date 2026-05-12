import { and, asc, eq, gte, lte, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { cards, profiles, userCards, type Card, type UserCard } from '@/lib/db/schema';
import { computeNewRemaining, dayStartUtc } from './queue-utils';

export { computeNewRemaining, dayStartUtc };

export type ReviewQueueItem = {
  userCard: UserCard;
  card: Card;
};

export type ReviewQueue = {
  due: ReviewQueueItem[];
  newCards: ReviewQueueItem[];
  meta: {
    dueCount: number;
    newAvailable: number;
    newLearnedToday: number;
    dailyNewLimit: number;
    timezone: string;
  };
};

/**
 * Get review queue for `userId`:
 *  - `due`: cards where `state != 'new'` and `due <= now`, ordered by `due ASC` (most overdue first).
 *  - `newCards`: cards where `state = 'new'`, ordered by `createdAt ASC`, limited by `dailyNewCards - learnedToday`.
 *
 * `learnedToday` counts user_cards that left 'new' state today (reps = 1, lastReview within today's window).
 * The window is computed in the profile's timezone (default `Asia/Ho_Chi_Minh`).
 */
export async function getReviewQueue(userId: string, now: Date = new Date()): Promise<ReviewQueue> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { timezone: true, dailyNewCards: true },
  });
  const timezone = profile?.timezone ?? 'Asia/Ho_Chi_Minh';
  const dailyNewLimit = profile?.dailyNewCards ?? 20;

  const todayStart = dayStartUtc(now, timezone);

  const learnedTodayRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(userCards)
    .where(
      and(
        eq(userCards.userId, userId),
        ne(userCards.state, 'new'),
        eq(userCards.reps, 1),
        gte(userCards.lastReview, todayStart)
      )
    );
  const newLearnedToday = learnedTodayRows[0]?.n ?? 0;

  const newRemaining = computeNewRemaining(dailyNewLimit, newLearnedToday);

  const dueRows = await db
    .select({ userCard: userCards, card: cards })
    .from(userCards)
    .innerJoin(cards, eq(userCards.cardId, cards.id))
    .where(
      and(
        eq(userCards.userId, userId),
        eq(userCards.suspended, false),
        ne(userCards.state, 'new'),
        lte(userCards.due, now)
      )
    )
    .orderBy(asc(userCards.due));

  let newRows: ReviewQueueItem[] = [];
  if (newRemaining > 0) {
    newRows = await db
      .select({ userCard: userCards, card: cards })
      .from(userCards)
      .innerJoin(cards, eq(userCards.cardId, cards.id))
      .where(
        and(
          eq(userCards.userId, userId),
          eq(userCards.suspended, false),
          eq(userCards.state, 'new')
        )
      )
      .orderBy(asc(userCards.createdAt))
      .limit(newRemaining);
  }

  return {
    due: dueRows,
    newCards: newRows,
    meta: {
      dueCount: dueRows.length,
      newAvailable: newRows.length,
      newLearnedToday,
      dailyNewLimit,
      timezone,
    },
  };
}
