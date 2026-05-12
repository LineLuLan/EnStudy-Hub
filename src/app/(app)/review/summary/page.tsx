'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Rating } from 'ts-fsrs';
import { Button } from '@/components/ui/button';
import { useReviewSession, type ReviewResult } from '@/stores/review-session';

export default function ReviewSummaryPage() {
  const results = useReviewSession((s) => s.results);
  const reset = useReviewSession((s) => s.reset);
  const [snapshot, setSnapshot] = useState<ReviewResult[] | null>(null);

  // Snapshot results once on mount so a later `reset()` (when user clicks "Học tiếp")
  // doesn't blank the page mid-render.
  useEffect(() => {
    setSnapshot(results);
    // intentionally only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = snapshot ?? results;

  if (data.length === 0) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Chưa có phiên ôn nào
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Mở{' '}
            <Link href="/review" className="underline underline-offset-2">
              /review
            </Link>{' '}
            để bắt đầu.
          </p>
        </div>
      </div>
    );
  }

  const counts = {
    again: data.filter((r) => r.rating === Rating.Again).length,
    hard: data.filter((r) => r.rating === Rating.Hard).length,
    good: data.filter((r) => r.rating === Rating.Good).length,
    easy: data.filter((r) => r.rating === Rating.Easy).length,
  };
  const total = data.length;
  const accuracy = Math.round(((counts.good + counts.easy) / total) * 100);
  const errored = data.filter((r) => r.status === 'error').length;
  const totalDurationSec = Math.round(data.reduce((acc, r) => acc + r.durationMs, 0) / 1000);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Tổng kết phiên ôn
      </h1>
      <p className="mt-1 text-sm leading-relaxed text-zinc-500">
        {total} thẻ chấm · {totalDurationSec}s · độ chính xác{' '}
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">{accuracy}%</span>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Again', n: counts.again, tone: 'text-red-700 dark:text-red-300' },
          { label: 'Hard', n: counts.hard, tone: 'text-amber-700 dark:text-amber-300' },
          { label: 'Good', n: counts.good, tone: 'text-emerald-700 dark:text-emerald-300' },
          { label: 'Easy', n: counts.easy, tone: 'text-sky-700 dark:text-sky-300' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-zinc-200 p-4 text-center dark:border-zinc-800"
          >
            <div className={`text-3xl font-semibold tabular-nums ${s.tone}`}>{s.n}</div>
            <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {errored > 0 && (
        <p className="mt-4 rounded bg-amber-50/60 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-900/50">
          ⚠️ {errored} thẻ chưa lưu được lên server (lỗi mạng). Vào /review lại — idempotency key sẽ
          giúp retry không double-count.
        </p>
      )}

      <div className="mt-6 flex gap-2">
        <Button
          onClick={() => {
            reset();
          }}
          asChild
        >
          <Link href="/review">Học tiếp</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Về dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
