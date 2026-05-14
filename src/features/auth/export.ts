'use server';

import { and, eq, isNotNull, ne } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  cards,
  collections,
  lessons,
  profiles,
  topics,
  userCards,
  userStats,
} from '@/lib/db/schema';
import { requireUserId } from '@/lib/auth/session';
import {
  EXPORT_VERSION,
  type ExportCustomCollection,
  type ExportData,
  type ExportNote,
  type ExportResult,
  type ExportSuspended,
} from './export-schema';

/**
 * Build a portable JSON dump of the user's personal data. Designed for:
 *  - data portability (GDPR-style "give me my data")
 *  - user-controlled local backup beyond the daily DB cron
 *  - future re-import (schema-versioned so v2 can detect older payloads)
 *
 * Includes:
 *  - profile settings (display name, timezone, daily limits)
 *  - stats summary (streak, totals — not full review log)
 *  - personal notes (only cards that actually have a note)
 *  - suspended cards list
 *  - custom collections + their topics + lessons + card content
 *
 * Excludes:
 *  - review_logs (huge, technical, not user-actionable)
 *  - user_cards FSRS state (not portable across systems)
 *  - official content (already in the seed, not user's data)
 */
export async function exportUserData(): Promise<ExportResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: 'Bạn cần đăng nhập trước.' };
  }

  const [profile, stats] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: {
        displayName: true,
        timezone: true,
        dailyNewCards: true,
        dailyReviewMax: true,
      },
    }),
    db.query.userStats.findFirst({
      where: eq(userStats.userId, userId),
      columns: {
        currentStreak: true,
        longestStreak: true,
        totalReviews: true,
        totalCardsMature: true,
        lastActiveDate: true,
      },
    }),
  ]);

  // Personal notes — join user_cards (with notes) → cards → lessons → collections
  // for slug context so the dump self-describes which card a note belongs to.
  const noteRows = await db
    .select({
      note: userCards.notes,
      word: cards.word,
      lessonSlug: lessons.slug,
      collectionSlug: collections.slug,
    })
    .from(userCards)
    .innerJoin(cards, eq(cards.id, userCards.cardId))
    .innerJoin(lessons, eq(lessons.id, cards.lessonId))
    .innerJoin(topics, eq(topics.id, lessons.topicId))
    .innerJoin(collections, eq(collections.id, topics.collectionId))
    .where(and(eq(userCards.userId, userId), isNotNull(userCards.notes), ne(userCards.notes, '')));

  const notes: ExportNote[] = noteRows.map((r) => ({
    word: r.word,
    lessonSlug: r.lessonSlug,
    collectionSlug: r.collectionSlug,
    note: r.note ?? '',
  }));

  // Suspended cards.
  const suspendedRows = await db
    .select({
      word: cards.word,
      lessonSlug: lessons.slug,
      collectionSlug: collections.slug,
    })
    .from(userCards)
    .innerJoin(cards, eq(cards.id, userCards.cardId))
    .innerJoin(lessons, eq(lessons.id, cards.lessonId))
    .innerJoin(topics, eq(topics.id, lessons.topicId))
    .innerJoin(collections, eq(collections.id, topics.collectionId))
    .where(and(eq(userCards.userId, userId), eq(userCards.suspended, true)));

  const suspended: ExportSuspended[] = suspendedRows.map((r) => ({
    word: r.word,
    lessonSlug: r.lessonSlug,
    collectionSlug: r.collectionSlug,
  }));

  // Custom collections — own collections only (isOfficial=false, ownerId=userId).
  // Fetch full chain in one query then group in JS. Volume is small per user.
  const customCollections = await db
    .select({
      colId: collections.id,
      colSlug: collections.slug,
      colName: collections.name,
      colDescription: collections.description,
    })
    .from(collections)
    .where(and(eq(collections.ownerId, userId), eq(collections.isOfficial, false)));

  const result: ExportCustomCollection[] = [];
  for (const col of customCollections) {
    const topicRows = await db
      .select({ id: topics.id, slug: topics.slug, name: topics.name })
      .from(topics)
      .where(eq(topics.collectionId, col.colId));

    const topicGroup: ExportCustomCollection['topics'] = [];
    for (const t of topicRows) {
      const lessonRows = await db
        .select({ id: lessons.id, slug: lessons.slug, name: lessons.name })
        .from(lessons)
        .where(eq(lessons.topicId, t.id));

      const lessonGroup = [] as ExportCustomCollection['topics'][number]['lessons'];
      for (const l of lessonRows) {
        const cardRows = await db
          .select({
            word: cards.word,
            ipa: cards.ipa,
            pos: cards.pos,
            cefr: cards.cefrLevel,
            definitions: cards.definitions,
            mnemonic_vi: cards.mnemonicVi,
          })
          .from(cards)
          .where(eq(cards.lessonId, l.id));

        lessonGroup.push({
          slug: l.slug,
          name: l.name,
          cards: cardRows.map((c) => ({
            word: c.word,
            ipa: c.ipa,
            pos: c.pos,
            cefr: c.cefr,
            definitions: c.definitions,
            mnemonic_vi: c.mnemonic_vi,
          })),
        });
      }

      topicGroup.push({ slug: t.slug, name: t.name, lessons: lessonGroup });
    }

    result.push({
      slug: col.colSlug,
      name: col.colName,
      description: col.colDescription,
      topics: topicGroup,
    });
  }

  const data: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: {
      displayName: profile?.displayName ?? null,
      timezone: profile?.timezone ?? 'Asia/Ho_Chi_Minh',
      dailyNewCards: profile?.dailyNewCards ?? 20,
      dailyReviewMax: profile?.dailyReviewMax ?? 200,
    },
    stats: {
      currentStreak: stats?.currentStreak ?? 0,
      longestStreak: stats?.longestStreak ?? 0,
      totalReviews: stats?.totalReviews ?? 0,
      totalCardsMature: stats?.totalCardsMature ?? 0,
      lastActiveDate: stats?.lastActiveDate ?? null,
    },
    notes,
    suspended,
    customCollections: result,
  };

  return { ok: true, data };
}
