import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { getCurrentUserId } from '@/lib/auth/session';
import { getReviewQueue } from '@/features/srs/queue';
import { ReviewSession } from '@/components/review/review-session';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login?next=/review');

  const queue = await getReviewQueue(userId);
  const all = [...queue.due, ...queue.newCards];

  if (all.length === 0) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <Sparkles className="mx-auto h-6 w-6 text-zinc-400" />
          <h1 className="mt-3 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Hôm nay không có thẻ cần ôn
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Quay lại sau khi có thẻ đến hạn, hoặc{' '}
            <Link href="/decks" className="underline underline-offset-2">
              thêm bài học mới
            </Link>{' '}
            để bắt đầu.
          </p>
          <p className="mt-3 text-xs text-zinc-400">
            Đã học hôm nay: {queue.meta.newLearnedToday} / {queue.meta.dailyNewLimit} thẻ mới
          </p>
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
        <ReviewSession initialQueue={all} />
      </div>
    </div>
  );
}
