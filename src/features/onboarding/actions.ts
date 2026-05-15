'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { requireUserId } from '@/lib/auth/session';
import { ensureProfile } from '@/features/auth/profile';

export type CompleteOnboardingResult = { ok: true } | { ok: false; error: string };

/**
 * Mark the first-login tour as seen. Sets `profiles.onboarded_at` to NOW().
 * Idempotent — subsequent calls overwrite the timestamp harmlessly.
 *
 * Called when user clicks "Bắt đầu học" trên step cuối, "Bỏ qua" trên bất kỳ
 * step nào, hoặc khi modal close via Esc / backdrop. Bất cứ tương tác nào với
 * tour đều count là dismissed — không re-trigger trên reload.
 */
export async function completeOnboardingTour(): Promise<CompleteOnboardingResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: 'Chưa đăng nhập.' };
  }

  await ensureProfile(userId);
  await db.update(profiles).set({ onboardedAt: new Date() }).where(eq(profiles.id, userId));
  revalidatePath('/dashboard');
  return { ok: true };
}
