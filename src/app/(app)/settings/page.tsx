import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { ensureProfile } from '@/features/auth/profile';
import { SettingsForm } from '@/components/settings/settings-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Cài đặt' };

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login?next=/settings');

  await ensureProfile(userId);

  const [profile, supabase] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: {
        displayName: true,
        timezone: true,
        dailyNewCards: true,
        dailyReviewMax: true,
      },
    }),
    createSupabaseServerClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Cài đặt
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Quản lý tài khoản, giới hạn ôn tập hằng ngày và giao diện.
        </p>
      </header>

      <SettingsForm
        initial={{
          email: user?.email ?? null,
          displayName: profile?.displayName ?? null,
          timezone: profile?.timezone ?? 'Asia/Ho_Chi_Minh',
          dailyNewCards: profile?.dailyNewCards ?? 20,
          dailyReviewMax: profile?.dailyReviewMax ?? 200,
        }}
      />
    </div>
  );
}
