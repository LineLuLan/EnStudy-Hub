'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { cards, collections, lessons, topics, userCards, userLessons } from '@/lib/db/schema';
import { requireUserId } from '@/lib/auth/session';
import { ensureProfile } from '@/features/auth/profile';
import {
  importDataSchema,
  normalizeImportedCard,
  extractUserShortIdFromSlug,
  type ImportResult,
} from './import-schema';
import type { CardContent } from '@/features/vocab/content-schema';

const PERSONAL_TOPIC_SLUG = 'imported';
const PERSONAL_TOPIC_NAME = 'CSV import';
const PERSONAL_COLLECTION_NAME = 'Bộ cá nhân';

function personalCollectionSlug(userId: string): string {
  return `personal-${userId.slice(0, 8)}`;
}

/**
 * Restore a previously-exported JSON dump back into the user's personal
 * collection. Same-user only — JSON from another user is rejected by
 * comparing the 8-char prefix embedded in the customCollection slug.
 *
 * Flatten model: all imported lessons end up under the current user's
 * `personal-{shortId}` collection, topic `imported`. The original
 * collection/topic structure from the JSON is lost (acceptable — our app
 * always stores user content under this single per-user topic).
 *
 * Operations:
 *  1. Validate JSON schema (version + shape) via Zod.
 *  2. Verify slug prefix matches current user (reject cross-user).
 *  3. Upsert per-user collection + topic.
 *  4. For each lesson in JSON: upsert by (topicId, slug), delete-replace cards,
 *     auto-enroll user (insert user_lessons + user_cards with FSRS defaults).
 *  5. For each note: look up the user_card by (lessonSlug, word) → set note.
 *     Skip silently if no match (e.g. card was renamed after export).
 *  6. For each suspended: same lookup → set suspended=true.
 */
export async function importUserData(jsonText: string): Promise<ImportResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: 'Bạn cần đăng nhập trước.' };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: 'File không phải JSON hợp lệ.' };
  }

  const parsed = importDataSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join('.') ?? '(root)';
    return { ok: false, error: `Cấu trúc JSON không hợp lệ tại "${path}": ${first?.message}` };
  }

  const data = parsed.data;
  const currentShortId = userId.slice(0, 8);

  // Cross-user safety check
  for (const col of data.customCollections) {
    const sourceShortId = extractUserShortIdFromSlug(col.slug);
    if (sourceShortId && sourceShortId.toLowerCase() !== currentShortId.toLowerCase()) {
      return {
        ok: false,
        error: 'JSON từ tài khoản khác — chỉ hỗ trợ restore cùng tài khoản.',
      };
    }
  }

  await ensureProfile(userId);

  const colSlug = personalCollectionSlug(userId);
  let collectionsCreated = 0;
  let lessonsCreated = 0;
  let cardsCreated = 0;

  // Build a map of (lessonSlug, word) → userCardId after restore so notes /
  // suspended can be applied with a single batch lookup later.
  const restoredCardKeyToId = new Map<string, string>(); // "lessonSlug|word" → userCardId

  await db.transaction(async (tx) => {
    // Step 1: upsert per-user collection + topic
    const [colRow] = await tx
      .insert(collections)
      .values({
        slug: colSlug,
        name: PERSONAL_COLLECTION_NAME,
        description: 'Restored from JSON export',
        isOfficial: false,
        ownerId: userId,
      })
      .onConflictDoUpdate({
        target: collections.slug,
        set: { ownerId: userId },
      })
      .returning({ id: collections.id, isNew: collections.createdAt });
    if (!colRow) throw new Error('COLLECTION_FAIL');
    const collectionId = colRow.id;
    if (data.customCollections.length > 0) collectionsCreated = 1;

    const [topicRow] = await tx
      .insert(topics)
      .values({
        collectionId,
        slug: PERSONAL_TOPIC_SLUG,
        name: PERSONAL_TOPIC_NAME,
        description: 'Bài học khôi phục từ JSON',
        orderIndex: 0,
      })
      .onConflictDoUpdate({
        target: [topics.collectionId, topics.slug],
        set: { name: PERSONAL_TOPIC_NAME },
      })
      .returning({ id: topics.id });
    if (!topicRow) throw new Error('TOPIC_FAIL');
    const topicId = topicRow.id;

    // Step 2: walk every lesson in the JSON, upsert into our topic, replace cards
    for (const importedCol of data.customCollections) {
      for (const importedTopic of importedCol.topics) {
        for (const lesson of importedTopic.lessons) {
          const validCards: CardContent[] = [];
          for (const raw of lesson.cards) {
            const norm = normalizeImportedCard(raw);
            if (norm) validCards.push(norm as CardContent);
          }
          if (validCards.length === 0) continue;

          // Upsert lesson by (topicId, slug). cardCount kept in sync.
          const [lessonRow] = await tx
            .insert(lessons)
            .values({
              topicId,
              slug: lesson.slug,
              name: lesson.name,
              orderIndex: 0,
              cardCount: validCards.length,
            })
            .onConflictDoUpdate({
              target: [lessons.topicId, lessons.slug],
              set: { name: lesson.name, cardCount: validCards.length },
            })
            .returning({ id: lessons.id });
          if (!lessonRow) continue;
          const lessonId = lessonRow.id;
          lessonsCreated += 1;

          // Delete-replace cards. user_cards cascade via FK on cards.id; we
          // re-enroll below so the user keeps an entry per restored card.
          await tx.delete(cards).where(eq(cards.lessonId, lessonId));

          const insertedCards = await tx
            .insert(cards)
            .values(
              validCards.map((c) => ({
                lessonId,
                word: c.word,
                ipa: c.ipa,
                pos: c.pos,
                cefrLevel: c.cefr,
                definitions: c.definitions,
                synonyms: c.synonyms,
                antonyms: c.antonyms,
                collocations: c.collocations,
                mnemonicVi: c.mnemonic_vi ?? null,
                source: 'json-import',
              }))
            )
            .returning({ id: cards.id, word: cards.word });
          cardsCreated += insertedCards.length;

          // Auto-enroll
          await tx
            .insert(userLessons)
            .values({ userId, lessonId })
            .onConflictDoNothing({ target: [userLessons.userId, userLessons.lessonId] });

          if (insertedCards.length > 0) {
            const enrolled = await tx
              .insert(userCards)
              .values(
                insertedCards.map((c) => ({
                  userId,
                  cardId: c.id,
                  lessonId,
                }))
              )
              .onConflictDoNothing({ target: [userCards.userId, userCards.cardId] })
              .returning({ id: userCards.id, cardId: userCards.cardId });

            // Build word lookup from inserted cards: cardId → word
            const cardIdToWord = new Map(insertedCards.map((c) => [c.id, c.word]));
            for (const uc of enrolled) {
              const word = cardIdToWord.get(uc.cardId);
              if (word) {
                restoredCardKeyToId.set(`${lesson.slug}|${word}`, uc.id);
              }
            }
          }
        }
      }
    }
  });

  // Step 3: apply notes + suspended outside the main transaction. These are
  // small per-row updates and a single transaction with potentially thousands
  // of statements would hold locks longer than necessary.
  let notesRestored = 0;
  let notesSkipped = 0;
  let suspendedRestored = 0;
  let suspendedSkipped = 0;

  for (const note of data.notes) {
    const key = `${note.lessonSlug}|${note.word}`;
    let userCardId = restoredCardKeyToId.get(key);
    if (!userCardId) {
      // Fall back to DB lookup — note might apply to a card that wasn't in
      // the JSON's customCollections section (e.g. note on official content).
      userCardId = await lookupUserCardId(userId, note.lessonSlug, note.word);
    }
    if (!userCardId) {
      notesSkipped += 1;
      continue;
    }
    await db.update(userCards).set({ notes: note.note }).where(eq(userCards.id, userCardId));
    notesRestored += 1;
  }

  for (const sus of data.suspended) {
    const key = `${sus.lessonSlug}|${sus.word}`;
    let userCardId = restoredCardKeyToId.get(key);
    if (!userCardId) {
      userCardId = await lookupUserCardId(userId, sus.lessonSlug, sus.word);
    }
    if (!userCardId) {
      suspendedSkipped += 1;
      continue;
    }
    await db.update(userCards).set({ suspended: true }).where(eq(userCards.id, userCardId));
    suspendedRestored += 1;
  }

  revalidatePath('/decks', 'layout');
  revalidatePath('/dashboard');
  revalidatePath('/review');
  revalidatePath('/stats');
  revalidatePath('/settings');

  return {
    ok: true,
    summary: {
      collectionsCreated,
      lessonsCreated,
      cardsCreated,
      notesRestored,
      notesSkipped,
      suspendedRestored,
      suspendedSkipped,
    },
  };
}

/**
 * Find a user_card by (userId, lessonSlug, word). Returns null if no
 * matching enrolled card. Used when applying notes/suspended to cards that
 * weren't restored fresh from the JSON (e.g. notes on official content).
 *
 * Single-query join: cards.lessonId → lessons.slug, then filter user_cards
 * by userId + matching cardId. inArray with subquery would also work; this
 * version is explicit for clarity.
 */
async function lookupUserCardId(
  userId: string,
  lessonSlug: string,
  word: string
): Promise<string | undefined> {
  // Find cards matching (lesson slug, word) across all collections the user
  // could see (official or owned). Ownership check on collection happens
  // implicitly via user_cards filter — if user has a user_card, they were
  // enrolled, so the card was visible.
  const matchingCards = await db
    .select({ id: cards.id })
    .from(cards)
    .innerJoin(lessons, eq(lessons.id, cards.lessonId))
    .where(and(eq(lessons.slug, lessonSlug), eq(cards.word, word)));

  if (matchingCards.length === 0) return undefined;

  const [uc] = await db
    .select({ id: userCards.id })
    .from(userCards)
    .where(
      and(
        eq(userCards.userId, userId),
        inArray(
          userCards.cardId,
          matchingCards.map((c) => c.id)
        )
      )
    )
    .limit(1);

  return uc?.id;
}
