'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { type Grade } from 'ts-fsrs';
import { useReviewSession } from '@/stores/review-session';
import type { ReviewQueueItem } from '@/features/srs/queue';
import { ClozeCard } from './cloze-card';
import { FlashcardFlip } from './flashcard-flip';

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

  const isMultiWord = current.card.word.includes(' ');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span className="font-medium tabular-nums">
          {currentIndex + 1} / {queue.length}
        </span>
        <span>
          {isMultiWord ? (
            <>
              <kbd className="rounded border px-1 font-mono text-[10px]">Space</kbd> lật ·{' '}
              <kbd className="rounded border px-1 font-mono text-[10px]">1-4</kbd> chấm
            </>
          ) : (
            <>
              gõ từ · <kbd className="rounded border px-1 font-mono text-[10px]">?</kbd> hint ·{' '}
              <kbd className="rounded border px-1 font-mono text-[10px]">Esc</kbd> bỏ qua
            </>
          )}
        </span>
      </div>

      {isMultiWord ? (
        <MultiWordFallback
          item={current}
          flipped={flipped}
          onFlip={flip}
          onRate={(g) => startTransition(() => void handleRate(g))}
          pending={pending}
        />
      ) : (
        <ClozeCard
          key={current.userCard.id}
          item={current}
          onGrade={(g) => startTransition(() => void handleRate(g))}
          pending={pending}
        />
      )}
    </div>
  );
}

/**
 * Fallback for cards where `card.word` is a multi-word phrase (collocation seeded
 * as a card). Typing the entire phrase is awkward, so we fall back to flashcard
 * flip + rating buttons. Multi-word entries are not in P0 content but defensive
 * coverage avoids a broken UI if they appear later.
 */
function MultiWordFallback({
  item,
  flipped,
  onFlip,
  onRate,
  pending,
}: {
  item: ReviewQueueItem;
  flipped: boolean;
  onFlip: () => void;
  onRate: (grade: Grade) => void;
  pending: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') {
        e.preventDefault();
        onFlip();
        return;
      }
      if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        onRate(Number(e.key) as Grade);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, onFlip, onRate]);

  return (
    <>
      <FlashcardFlip item={item} flipped={flipped} onFlip={onFlip} />
      <div className="grid grid-cols-4 gap-2">
        {(
          [
            { grade: 1 as Grade, label: 'Again', tone: 'border-red-200 text-red-700' },
            { grade: 2 as Grade, label: 'Hard', tone: 'border-amber-200 text-amber-700' },
            { grade: 3 as Grade, label: 'Good', tone: 'border-emerald-200 text-emerald-700' },
            { grade: 4 as Grade, label: 'Easy', tone: 'border-sky-200 text-sky-700' },
          ] as const
        ).map(({ grade, label, tone }) => (
          <button
            key={grade}
            type="button"
            disabled={!flipped || pending}
            onClick={() => onRate(grade)}
            className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded-md border transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-900 ${tone}`}
          >
            <span className="text-sm font-medium">{label}</span>
            <kbd className="font-mono text-[10px] opacity-70">{grade}</kbd>
          </button>
        ))}
      </div>
    </>
  );
}
