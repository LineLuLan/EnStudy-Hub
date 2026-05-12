'use client';

import { create } from 'zustand';
import { Rating, type Grade } from 'ts-fsrs';
import { submitReview } from '@/features/srs/actions';
import type { ReviewQueueItem } from '@/features/srs/queue';

export type RatingStatus = 'pending' | 'ok' | 'error';

export type ReviewResult = {
  userCardId: string;
  rating: Grade;
  clientReviewId: string;
  status: RatingStatus;
  durationMs: number;
  errorMessage?: string;
};

type ReviewSessionState = {
  queue: ReviewQueueItem[];
  currentIndex: number;
  flipped: boolean;
  cardStartedAt: number;
  results: ReviewResult[];
  init: (queue: ReviewQueueItem[]) => void;
  flip: () => void;
  rate: (rating: Grade) => Promise<{ ok: boolean; error?: string }>;
  reset: () => void;
};

const isClient = typeof window !== 'undefined' && typeof crypto !== 'undefined';

function newClientReviewId(): string {
  if (isClient && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Last-resort fallback for non-crypto envs (test runners, old browsers).
  // submitReview only uses this string for idempotency, not for security.
  return `crv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useReviewSession = create<ReviewSessionState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  flipped: false,
  cardStartedAt: 0,
  results: [],

  init: (queue) =>
    set({
      queue,
      currentIndex: 0,
      flipped: false,
      cardStartedAt: Date.now(),
      results: [],
    }),

  flip: () => set((s) => ({ flipped: !s.flipped })),

  rate: async (rating) => {
    const s = get();
    const card = s.queue[s.currentIndex];
    if (!card) return { ok: false, error: 'Không còn thẻ để chấm.' };

    const clientReviewId = newClientReviewId();
    const durationMs = Math.max(0, Date.now() - s.cardStartedAt);

    // Optimistic: advance to next card immediately.
    set((prev) => ({
      results: [
        ...prev.results,
        {
          userCardId: card.userCard.id,
          rating,
          clientReviewId,
          status: 'pending',
          durationMs,
        },
      ],
      currentIndex: prev.currentIndex + 1,
      flipped: false,
      cardStartedAt: Date.now(),
    }));

    try {
      const result = await submitReview({
        userCardId: card.userCard.id,
        rating,
        clientReviewId,
        durationMs,
        reviewType: 'typing',
      });

      set((prev) => ({
        results: prev.results.map((r) =>
          r.clientReviewId === clientReviewId
            ? {
                ...r,
                status: result.ok ? 'ok' : 'error',
                errorMessage: result.ok ? undefined : result.error,
              }
            : r
        ),
      }));

      return result.ok ? { ok: true } : { ok: false, error: result.error };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định.';
      set((prev) => ({
        results: prev.results.map((r) =>
          r.clientReviewId === clientReviewId ? { ...r, status: 'error', errorMessage: message } : r
        ),
      }));
      return { ok: false, error: message };
    }
  },

  reset: () =>
    set({
      queue: [],
      currentIndex: 0,
      flipped: false,
      cardStartedAt: 0,
      results: [],
    }),
}));

export { Rating };
export type { Grade };
