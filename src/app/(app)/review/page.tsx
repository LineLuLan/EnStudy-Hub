import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, Sparkles } from 'lucide-react';
import { getCurrentUserId } from '@/lib/auth/session';
import { getReviewQueue } from '@/features/srs/queue';
import { getStreak } from '@/features/stats/streak';
import { todayKey } from '@/features/stats/dates';
import { ReviewSession } from '@/components/review/review-session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Ôn tập' };

export default async function ReviewPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login?next=/review');

  const [queue, streak] = await Promise.all([getReviewQueue(userId), getStreak(userId)]);
  const all = [...queue.due, ...queue.newCards];

  // "First review of today" = user's last active day key is strictly before
  // today's key (in their tz). Drives the streak-start toast in ReviewSession.
  const today = todayKey(new Date(), streak.timezone);
  const isFirstReviewToday = streak.lastActiveDate === null || streak.lastActiveDate < today;

  if (all.length === 0) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <Sparkles className="mx-auto h-6 w-6 text-zinc-400" />
          <h1 className="mt-3 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Hôm nay không có thẻ cần ôn
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Quay lại sau khi có thẻ đến hạn, hoặc thêm bài học mới để bắt đầu.
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            Đã học hôm nay: {queue.meta.newLearnedToday} / {queue.meta.dailyNewLimit} thẻ mới
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link
              href="/decks"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Xem decks
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              Về dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Ôn tập
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            {queue.due.length} ôn lại · {queue.newCards.length} thẻ mới ·{' '}
            {queue.meta.newLearnedToday}/{queue.meta.dailyNewLimit} hôm nay
          </p>
        </div>
        <Link
          href="/decks"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          Decks →
        </Link>
      </div>

      <div className="mt-6">
        <ReviewSession
          initialQueue={all}
          newLearnedToday={queue.meta.newLearnedToday}
          dailyNewLimit={queue.meta.dailyNewLimit}
          isFirstReviewToday={isFirstReviewToday}
          currentStreak={streak.current}
        />
      </div>
    </div>
  );
}
