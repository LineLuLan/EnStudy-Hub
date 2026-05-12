'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { reviewLogs, userCards } from '@/lib/db/schema';
import { requireUserId } from '@/lib/auth/session';
import { rate, type DbCardState } from './fsrs';
import { Rating, type Grade } from 'ts-fsrs';

const SubmitReviewSchema = z.object({
  userCardId: z.string().uuid(),
  rating: z.union([
    z.literal(Rating.Again),
    z.literal(Rating.Hard),
    z.literal(Rating.Good),
    z.literal(Rating.Easy),
  ]),
  clientReviewId: z.string().min(1).max(64),
  durationMs: z.number().int().nonnegative().optional(),
  reviewType: z.enum(['flashcard', 'mcq', 'typing', 'listening']).default('flashcard'),
});

export type SubmitReviewInput = z.infer<typeof SubmitReviewSchema>;

export type SubmitReviewResult =
  | {
      ok: true;
      idempotent: boolean;
      nextDue: string; // ISO
      nextState: DbCardState;
      reps: number;
      lapses: number;
    }
  | { ok: false; error: string };

/**
 * Apply an FSRS rating to one user_card and persist:
 *  - update `user_cards` with the new FSRS state (stability/difficulty/due/...)
 *  - insert one `review_logs` row with state_before / state_after for audit
 *
 * Idempotent on `(user_id, client_review_id)`: re-submitting the same review id
 * returns `idempotent: true` without re-applying the rating.
 *
 * Caller (review UI) MUST generate a stable `clientReviewId` per card-rating
 * pair (e.g. `crypto.randomUUID()`) so a network retry never double-counts.
 */
export async function submitReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  const parsed = SubmitReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Dữ liệu không hợp lệ.' };
  }
  const { userCardId, rating, clientReviewId, durationMs, reviewType } = parsed.data;

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: 'Bạn cần đăng nhập trước.' };
  }

  // Idempotency check first — outside the transaction so duplicates short-circuit fast.
  const existingLog = await db.query.reviewLogs.findFirst({
    where: and(eq(reviewLogs.userId, userId), eq(reviewLogs.clientReviewId, clientReviewId)),
    columns: { userCardId: true },
  });

  if (existingLog) {
    const existing = await db.query.userCards.findFirst({
      where: eq(userCards.id, existingLog.userCardId),
      columns: { state: true, due: true, reps: true, lapses: true },
    });
    if (existing) {
      return {
        ok: true,
        idempotent: true,
        nextDue: existing.due.toISOString(),
        nextState: existing.state as DbCardState,
        reps: existing.reps,
        lapses: existing.lapses,
      };
    }
  }

  const current = await db.query.userCards.findFirst({
    where: and(eq(userCards.id, userCardId), eq(userCards.userId, userId)),
  });
  if (!current) {
    return { ok: false, error: 'Thẻ không tồn tại hoặc không thuộc về bạn.' };
  }

  const now = new Date();
  const { next, fsrsLog } = rate(
    {
      stability: current.stability,
      difficulty: current.difficulty,
      elapsedDays: current.elapsedDays,
      scheduledDays: current.scheduledDays,
      reps: current.reps,
      lapses: current.lapses,
      state: current.state as DbCardState,
      due: current.due,
      lastReview: current.lastReview,
    },
    rating as Grade,
    now
  );

  await db.transaction(async (tx) => {
    await tx
      .update(userCards)
      .set({
        stability: next.stability,
        difficulty: next.difficulty,
        elapsedDays: next.elapsedDays,
        scheduledDays: next.scheduledDays,
        reps: next.reps,
        lapses: next.lapses,
        state: next.state,
        lastReview: next.lastReview,
        due: next.due,
      })
      .where(eq(userCards.id, userCardId));

    await tx.insert(reviewLogs).values({
      userCardId,
      userId,
      rating,
      reviewedAt: now,
      durationMs: durationMs ?? null,
      stateBefore: {
        state: fsrsLog.stateBefore,
        stability: current.stability,
        difficulty: current.difficulty,
        due: current.due.toISOString(),
        reps: current.reps,
        lapses: current.lapses,
      },
      stateAfter: {
        state: fsrsLog.stateAfter,
        stability: fsrsLog.stability,
        difficulty: fsrsLog.difficulty,
        due: next.due.toISOString(),
        scheduledDays: fsrsLog.scheduledDays,
        elapsedDays: fsrsLog.elapsedDays,
      },
      reviewType,
      clientReviewId,
    });
  });

  revalidatePath('/review');
  revalidatePath('/dashboard');

  return {
    ok: true,
    idempotent: false,
    nextDue: next.due.toISOString(),
    nextState: next.state,
    reps: next.reps,
    lapses: next.lapses,
  };
}
