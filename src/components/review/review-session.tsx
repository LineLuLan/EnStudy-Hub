'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Rating, type Grade } from 'ts-fsrs';
import { Button } from '@/components/ui/button';
import { useReviewSession } from '@/stores/review-session';
import type { ReviewQueueItem } from '@/features/srs/queue';
import { FlashcardFlip } from './flashcard-flip';

const RATING_BUTTONS: Array<{ grade: Grade; label: string; kbd: string; tone: string }> = [
  {
    grade: Rating.Again,
    label: 'Again',
    kbd: '1',
    tone: 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30',
  },
  {
    grade: Rating.Hard,
    label: 'Hard',
    kbd: '2',
    tone: 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-950/30',
  },
  {
    grade: Rating.Good,
    label: 'Good',
    kbd: '3',
    tone: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-950/30',
  },
  {
    grade: Rating.Easy,
    label: 'Easy',
    kbd: '4',
    tone: 'border-sky-200 text-sky-700 hover:bg-sky-50 dark:border-sky-900/50 dark:text-sky-300 dark:hover:bg-sky-950/30',
  },
];

export function ReviewSession({ initialQueue }: { initialQueue: ReviewQueueItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const queue = useReviewSession((s) => s.queue);
  const currentIndex = useReviewSession((s) => s.currentIndex);
  const flipped = useReviewSession((s) => s.flipped);
  const init = useReviewSession((s) => s.init);
  const flip = useReviewSession((s) => s.flip);
  const rate = useReviewSession((s) => s.rate);

  // Bootstrap store from server-fetched queue exactly once per mount.
  useEffect(() => {
    init(initialQueue);
  }, [initialQueue, init]);

  // Navigate to summary when we run out of cards.
  useEffect(() => {
    if (queue.length > 0 && currentIndex >= queue.length) {
      router.push('/review/summary');
    }
  }, [currentIndex, queue.length, router]);

  // Keyboard: Space flips, 1-4 rate (only when flipped).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        flip();
        return;
      }
      if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const grade = Number(e.key) as Grade;
        startTransition(() => {
          void handleRate(grade);
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // handleRate is stable via store ref + toast
  }, [flip, flipped]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRate(grade: Grade) {
    const result = await rate(grade);
    if (!result.ok) {
      toast.error(`Không lưu được đánh giá: ${result.error ?? 'lỗi không xác định'}`);
    }
  }

  const current = queue[currentIndex];
  if (!current) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span className="font-medium tabular-nums">
          {currentIndex + 1} / {queue.length}
        </span>
        <span>
          <kbd className="rounded border px-1 font-mono text-[10px]">Space</kbd> lật ·{' '}
          <kbd className="rounded border px-1 font-mono text-[10px]">1-4</kbd> chấm
        </span>
      </div>

      <FlashcardFlip item={current} flipped={flipped} onFlip={flip} />

      <div className="grid grid-cols-4 gap-2">
        {RATING_BUTTONS.map(({ grade, label, kbd, tone }) => (
          <Button
            key={grade}
            type="button"
            variant="outline"
            disabled={!flipped || pending}
            onClick={() => startTransition(() => void handleRate(grade))}
            className={`flex h-12 flex-col gap-0.5 ${tone}`}
          >
            <span className="text-sm font-medium">{label}</span>
            <kbd className="font-mono text-[10px] opacity-70">{kbd}</kbd>
          </Button>
        ))}
      </div>
    </div>
  );
}
