'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { profiles, userStats } from '@/lib/db/schema';
import { requireUserId } from '@/lib/auth/session';

/**
 * Ensure a `profiles` + `user_stats` row exists for the given user.
 *
 * The blueprint SQL trigger (`handle_new_user`) does this automatically on
 * `auth.users` insert. This JS helper is a fallback for cases where the
 * trigger is not yet applied (e.g. local dev before running RLS SQL).
 *
 * Idempotent — safe to call on every authenticated server action.
 */
export async function ensureProfile(userId: string): Promise<void> {
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { id: true },
  });
  if (existing) return;

  await db.transaction(async (tx) => {
    await tx.insert(profiles).values({ id: userId }).onConflictDoNothing();
    await tx.insert(userStats).values({ userId }).onConflictDoNothing();
  });
}

const UpdateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(100, 'Tên hiển thị tối đa 100 ký tự')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  timezone: z.string().min(1).max(64),
  dailyNewCards: z.coerce
    .number()
    .int('Phải là số nguyên')
    .min(1, 'Tối thiểu 1')
    .max(50, 'Tối đa 50'),
  dailyReviewMax: z.coerce
    .number()
    .int('Phải là số nguyên')
    .min(50, 'Tối thiểu 50')
    .max(500, 'Tối đa 500'),
});

export type UpdateProfileInput = z.input<typeof UpdateProfileSchema>;
export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

/**
 * Persist user-editable profile fields from the `/settings` form.
 *
 * `dailyNewCards` directly throttles `getReviewQueue` (caps `newCards.length`).
 * `timezone` is read by every stats query (streak, heatmap, retention, activity).
 * Both need a revalidate of `/dashboard` so they take effect on next nav.
 */
export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.';
    return { ok: false, error: first };
  }

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: 'Bạn cần đăng nhập trước.' };
  }

  await ensureProfile(userId);
  await db
    .update(profiles)
    .set({
      displayName: parsed.data.displayName,
      timezone: parsed.data.timezone,
      dailyNewCards: parsed.data.dailyNewCards,
      dailyReviewMax: parsed.data.dailyReviewMax,
    })
    .where(eq(profiles.id, userId));

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  revalidatePath('/stats');
  revalidatePath('/review');

  return { ok: true };
}
