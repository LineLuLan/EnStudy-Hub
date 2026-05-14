'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { cards, lessons, topics, collections } from '@/lib/db/schema';
import { requireUserId } from '@/lib/auth/session';
import { cardEditInputSchema, type CardEditResult } from './card-edit-schema';

/**
 * Update a card in the user's personal collection (multi-definition,
 * multi-example).
 *
 * Ownership chain: card → lesson → topic → collection. Only the collection's
 * `ownerId` matters — if `isOfficial=true` OR `ownerId !== userId`, reject.
 *
 * Preserves user_cards FSRS state (stability/difficulty/reps/lapses/due/...)
 * by only patching the content `cards` row, not the per-user state.
 */
export async function updateCard(input: unknown): Promise<CardEditResult> {
  const parsed = cardEditInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  }

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: 'Bạn cần đăng nhập trước.' };
  }

  const { cardId, ...content } = parsed.data;

  // Walk the ownership chain in one query to avoid 3 round-trips.
  const [own] = await db
    .select({
      isOfficial: collections.isOfficial,
      ownerId: collections.ownerId,
      colSlug: collections.slug,
      topicSlug: topics.slug,
      lessonSlug: lessons.slug,
    })
    .from(cards)
    .innerJoin(lessons, eq(lessons.id, cards.lessonId))
    .innerJoin(topics, eq(topics.id, lessons.topicId))
    .innerJoin(collections, eq(collections.id, topics.collectionId))
    .where(eq(cards.id, cardId))
    .limit(1);

  if (!own) return { ok: false, error: 'Thẻ không tồn tại.' };
  if (own.isOfficial || own.ownerId !== userId) {
    return { ok: false, error: 'Bạn không có quyền sửa thẻ này.' };
  }

  await db
    .update(cards)
    .set({
      word: content.word,
      ipa: content.ipa,
      pos: content.pos,
      cefrLevel: content.cefr,
      definitions: content.definitions,
      mnemonicVi: content.mnemonic_vi ?? null,
    })
    .where(eq(cards.id, cardId));

  revalidatePath(`/decks/${own.colSlug}/${own.topicSlug}/${own.lessonSlug}`);
  revalidatePath('/review');

  return { ok: true };
}
