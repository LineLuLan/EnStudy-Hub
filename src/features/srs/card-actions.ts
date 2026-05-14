'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { userCards } from '@/lib/db/schema';
import { requireUserId } from '@/lib/auth/session';
import {
  updateUserCardSchema,
  type UpdateUserCardInput,
  type UpdateUserCardResult,
} from './card-actions-schema';

/**
 * Update per-user card state (personal note + suspend flag).
 *
 * Both fields optional — submit only the one(s) being changed. Ownership
 * enforced via `(userId, userCardId)` filter. Suspended cards are filtered out
 * of `getReviewQueue` so toggling on takes effect from next session.
 *
 * Notes trim + collapse empty to null so "clear note" works by passing ''.
 */
export async function updateUserCard(input: UpdateUserCardInput): Promise<UpdateUserCardResult> {
  const parsed = updateUserCardSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  }

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: 'Bạn cần đăng nhập trước.' };
  }

  const patch: { notes?: string | null; suspended?: boolean } = {};
  if (parsed.data.notes !== undefined) {
    const trimmed = parsed.data.notes.trim();
    patch.notes = trimmed.length > 0 ? trimmed : null;
  }
  if (parsed.data.suspended !== undefined) {
    patch.suspended = parsed.data.suspended;
  }

  const [updated] = await db
    .update(userCards)
    .set(patch)
    .where(and(eq(userCards.id, parsed.data.userCardId), eq(userCards.userId, userId)))
    .returning({ suspended: userCards.suspended, notes: userCards.notes });

  if (!updated) {
    return { ok: false, error: 'Thẻ không tồn tại hoặc không thuộc về bạn.' };
  }

  // Suspended toggle affects /review queue; note change doesn't but is cheap.
  if (parsed.data.suspended !== undefined) {
    revalidatePath('/review');
    revalidatePath('/dashboard');
  }

  return {
    ok: true,
    suspended: updated.suspended,
    hasNote: updated.notes !== null && updated.notes.length > 0,
  };
}
