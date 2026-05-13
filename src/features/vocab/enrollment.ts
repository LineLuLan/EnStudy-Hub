'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { cards, userCards, userLessons, lessons } from '@/lib/db/schema';
import { requireUserId } from '@/lib/auth/session';
import { ensureProfile } from '@/features/auth/profile';

type EnrollResult = { ok: true; enrolled: number } | { ok: false; error: string };

/**
 * Enroll the current user into a lesson:
 *   1. Insert `user_lessons (user_id, lesson_id)` — idempotent.
 *   2. Bulk insert `user_cards` for every card in the lesson — idempotent
 *      via the (user_id, card_id) unique index.
 *
 * On re-enroll, no-ops: existing user_cards keep their FSRS state.
 *
 * Used by `EnrollButton` on `/decks/[col]/[topic]/[lesson]`.
 */
export async function enrollLesson(formData: FormData): Promise<EnrollResult> {
  const lessonId = String(formData.get('lessonId') ?? '');
  if (!lessonId) return { ok: false, error: 'Thiếu lessonId.' };

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: 'Bạn cần đăng nhập trước.' };
  }

  // Guarantee profiles + user_stats row exists. Trigger handle_new_user covers
  // most cases; this is the JS fallback for users created before the trigger.
  await ensureProfile(userId);

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    columns: { id: true },
  });
  if (!lesson) return { ok: false, error: 'Bài học không tồn tại.' };

  const lessonCards = await db
    .select({ id: cards.id })
    .from(cards)
    .where(eq(cards.lessonId, lessonId));

  await db.transaction(async (tx) => {
    await tx
      .insert(userLessons)
      .values({ userId, lessonId })
      .onConflictDoNothing({ target: [userLessons.userId, userLessons.lessonId] });

    if (lessonCards.length > 0) {
      await tx
        .insert(userCards)
        .values(
          lessonCards.map((c) => ({
            userId,
            cardId: c.id,
            lessonId,
            // FSRS state defaults: state=new, due=now, stability/difficulty=0
          }))
        )
        .onConflictDoNothing({ target: [userCards.userId, userCards.cardId] });
    }
  });

  revalidatePath('/decks', 'layout');
  revalidatePath('/dashboard');
  revalidatePath('/review');

  return { ok: true, enrolled: lessonCards.length };
}
