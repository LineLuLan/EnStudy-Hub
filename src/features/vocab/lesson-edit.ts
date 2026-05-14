'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { cards, lessons, topics, collections } from '@/lib/db/schema';
import { requireUserId } from '@/lib/auth/session';
import {
  renameLessonSchema,
  deleteLessonSchema,
  deleteCardSchema,
  type RenameLessonResult,
  type DeleteLessonResult,
  type DeleteCardResult,
} from './lesson-edit-schema';

type LessonOwnership = {
  isOfficial: boolean;
  ownerId: string | null;
  colSlug: string;
  topicSlug: string;
  lessonSlug: string;
};

async function getLessonOwnership(lessonId: string): Promise<LessonOwnership | null> {
  const [row] = await db
    .select({
      isOfficial: collections.isOfficial,
      ownerId: collections.ownerId,
      colSlug: collections.slug,
      topicSlug: topics.slug,
      lessonSlug: lessons.slug,
    })
    .from(lessons)
    .innerJoin(topics, eq(topics.id, lessons.topicId))
    .innerJoin(collections, eq(collections.id, topics.collectionId))
    .where(eq(lessons.id, lessonId))
    .limit(1);
  return row ?? null;
}

async function getCardOwnership(
  cardId: string
): Promise<(LessonOwnership & { lessonId: string }) | null> {
  const [row] = await db
    .select({
      isOfficial: collections.isOfficial,
      ownerId: collections.ownerId,
      colSlug: collections.slug,
      topicSlug: topics.slug,
      lessonSlug: lessons.slug,
      lessonId: lessons.id,
    })
    .from(cards)
    .innerJoin(lessons, eq(lessons.id, cards.lessonId))
    .innerJoin(topics, eq(topics.id, lessons.topicId))
    .innerJoin(collections, eq(collections.id, topics.collectionId))
    .where(eq(cards.id, cardId))
    .limit(1);
  return row ?? null;
}

/**
 * Rename a lesson in the user's personal collection.
 * Slug stays unchanged — URL doesn't break, only display name updates.
 * Bumping slug would require unique check + redirect old paths; defer.
 */
export async function renameLesson(input: unknown): Promise<RenameLessonResult> {
  const parsed = renameLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  }

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: 'Bạn cần đăng nhập trước.' };
  }

  const own = await getLessonOwnership(parsed.data.lessonId);
  if (!own) return { ok: false, error: 'Bài học không tồn tại.' };
  if (own.isOfficial || own.ownerId !== userId) {
    return { ok: false, error: 'Bạn không có quyền sửa bài học này.' };
  }

  await db
    .update(lessons)
    .set({ name: parsed.data.name })
    .where(eq(lessons.id, parsed.data.lessonId));

  revalidatePath(`/decks/${own.colSlug}`);
  revalidatePath(`/decks/${own.colSlug}/${own.topicSlug}/${own.lessonSlug}`);
  revalidatePath('/dashboard');

  return { ok: true, name: parsed.data.name };
}

/**
 * Delete a lesson from the user's personal collection.
 * Cascade via FK wipes cards → user_cards → user_lessons. Topic + collection
 * stay (other lessons may live under them; pre-MVP we don't garbage-collect
 * empty per-user collections — defer).
 */
export async function deleteLesson(input: unknown): Promise<DeleteLessonResult> {
  const parsed = deleteLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  }

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: 'Bạn cần đăng nhập trước.' };
  }

  const own = await getLessonOwnership(parsed.data.lessonId);
  if (!own) return { ok: false, error: 'Bài học không tồn tại.' };
  if (own.isOfficial || own.ownerId !== userId) {
    return { ok: false, error: 'Bạn không có quyền xoá bài học này.' };
  }

  await db.delete(lessons).where(eq(lessons.id, parsed.data.lessonId));

  revalidatePath('/decks', 'layout');
  revalidatePath('/dashboard');
  revalidatePath('/review');
  revalidatePath('/stats');

  return { ok: true, collectionSlug: own.colSlug };
}

/**
 * Delete a single card from the user's personal collection.
 * Cascade via FK wipes user_cards. Lesson + topic + collection stay.
 * Note: if this was the last card in the lesson, lesson.cardCount will be
 * stale; we don't recompute pre-MVP (only displayed in deck list as a hint).
 */
export async function deleteCard(input: unknown): Promise<DeleteCardResult> {
  const parsed = deleteCardSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  }

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: 'Bạn cần đăng nhập trước.' };
  }

  const own = await getCardOwnership(parsed.data.cardId);
  if (!own) return { ok: false, error: 'Thẻ không tồn tại.' };
  if (own.isOfficial || own.ownerId !== userId) {
    return { ok: false, error: 'Bạn không có quyền xoá thẻ này.' };
  }

  await db.delete(cards).where(eq(cards.id, parsed.data.cardId));

  revalidatePath(`/decks/${own.colSlug}/${own.topicSlug}/${own.lessonSlug}`);
  revalidatePath('/review');
  revalidatePath('/dashboard');

  return {
    ok: true,
    collectionSlug: own.colSlug,
    topicSlug: own.topicSlug,
    lessonSlug: own.lessonSlug,
  };
}
