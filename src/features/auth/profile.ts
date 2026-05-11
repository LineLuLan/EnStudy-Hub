import { db } from '@/lib/db/client';
import { profiles, userStats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
