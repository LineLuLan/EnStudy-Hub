import { and, asc, eq, gte, inArray, lte, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { cards, profiles, userCards, type Card, type UserCard } from '@/lib/db/schema';
import {
  buildDistractorPool,
  computeNewRemaining,
  dayStartUtc,
  extractMeaningVi,
  type SiblingMeaning,
} from './queue-utils';

export { computeNewRemaining, dayStartUtc };

export type ReviewQueueItem = {
  userCard: UserCard;
  card: Card;
  /**
   * Vietnamese meanings of OTHER cards in the same lesson, used by MCQ mode to
   * pick distractors. Always excludes this card's own correct meaning. May be
   * shorter than 3 if the lesson is small; MCQCard handles the fallback.
   */
  distractorPool: string[];
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

  let newRows: Array<{ userCard: UserCard; card: Card }> = [];
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

  const allRows = [...dueRows, ...newRows];
  const lessonIds = Array.from(new Set(allRows.map((r) => r.userCard.lessonId)));

  // One query for all sibling-card meanings across involved lessons. Cheap on
  // P0 content (~60 cards) and avoids N+1 over the queue.
  const siblingsByLesson = new Map<string, SiblingMeaning[]>();
  if (lessonIds.length > 0) {
    const siblingRows = await db
      .select({
        id: cards.id,
        lessonId: cards.lessonId,
        definitions: cards.definitions,
      })
      .from(cards)
      .where(inArray(cards.lessonId, lessonIds));
    for (const row of siblingRows) {
      const meaning = extractMeaningVi(row.definitions);
      if (!meaning) continue;
      const bucket = siblingsByLesson.get(row.lessonId);
      if (bucket) {
        bucket.push({ cardId: row.id, meaningVi: meaning });
      } else {
        siblingsByLesson.set(row.lessonId, [{ cardId: row.id, meaningVi: meaning }]);
      }
    }
  }

  // Fallback pool when the active lesson is too small (<4 cards): pool ALL
  // sibling meanings collected above.
  const globalPool = Array.from(
    new Set(
      Array.from(siblingsByLesson.values())
        .flat()
        .map((s) => s.meaningVi)
    )
  );

  function attach(row: { userCard: UserCard; card: Card }): ReviewQueueItem {
    const selfMeaning = extractMeaningVi(row.card.definitions);
    const siblings = siblingsByLesson.get(row.userCard.lessonId) ?? [];
    return {
      userCard: row.userCard,
      card: row.card,
      distractorPool: buildDistractorPool(siblings, row.card.id, selfMeaning, globalPool),
    };
  }

  const due = dueRows.map(attach);
  const newCardsResult = newRows.map(attach);

  return {
    due,
    newCards: newCardsResult,
    meta: {
      dueCount: due.length,
      newAvailable: newCardsResult.length,
      newLearnedToday,
      dailyNewLimit,
      timezone,
    },
  };
}
