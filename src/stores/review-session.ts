'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Rating, type Grade } from 'ts-fsrs';
import { submitReview } from '@/features/srs/actions';
import type { ReviewQueueItem } from '@/features/srs/queue';

export type RatingStatus = 'pending' | 'ok' | 'error';

export type ReviewMode = 'cloze' | 'mcq' | 'typing' | 'listening';

export type ReviewResult = {
  userCardId: string;
  rating: Grade;
  clientReviewId: string;
  status: RatingStatus;
  durationMs: number;
  // Optional: results persisted by older sessions (pre-Tuần 5 mode picker)
  // won't have this field after hydration. New writes always set it.
  mode?: ReviewMode;
  errorMessage?: string;
};

type ReviewSessionState = {
  queue: ReviewQueueItem[];
  currentIndex: number;
  flipped: boolean;
  cardStartedAt: number;
  mode: ReviewMode;
  results: ReviewResult[];
  init: (queue: ReviewQueueItem[]) => void;
  flip: () => void;
  setMode: (mode: ReviewMode) => void;
  rate: (rating: Grade) => Promise<{ ok: boolean; error?: string }>;
  reset: () => void;
};

/**
 * Map FE mode → `reviewType` enum value persisted in `review_logs`. The
 * existing Tuần 3 Cloze mode is logged as `'typing'` (sentence-blank typing);
 * the new Tuần 5 typing-from-definition mode also logs as `'typing'` for now.
 * Future migration may split into a separate enum if FSRS tuning per mode
 * proves valuable.
 */
function modeToReviewType(mode: ReviewMode): 'flashcard' | 'mcq' | 'typing' | 'listening' {
  if (mode === 'mcq') return 'mcq';
  if (mode === 'listening') return 'listening';
  // 'cloze' and 'typing' both persist as 'typing' for now.
  return 'typing';
}

const isClient = typeof window !== 'undefined' && typeof crypto !== 'undefined';

function newClientReviewId(): string {
  if (isClient && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Last-resort fallback for non-crypto envs (test runners, old browsers).
  // submitReview only uses this string for idempotency, not for security.
  return `crv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useReviewSession = create<ReviewSessionState>()(
  persist(
    (set, get) => ({
      queue: [],
      currentIndex: 0,
      flipped: false,
      cardStartedAt: 0,
      mode: 'cloze' as ReviewMode,
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

      setMode: (mode) =>
        set({
          mode,
          flipped: false,
          cardStartedAt: Date.now(),
        }),

      rate: async (rating) => {
        const s = get();
        const card = s.queue[s.currentIndex];
        if (!card) return { ok: false, error: 'Không còn thẻ để chấm.' };

        const clientReviewId = newClientReviewId();
        const durationMs = Math.max(0, Date.now() - s.cardStartedAt);

        const currentMode = s.mode;

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
              mode: currentMode,
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
            reviewType: modeToReviewType(currentMode),
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
              r.clientReviewId === clientReviewId
                ? { ...r, status: 'error', errorMessage: message }
                : r
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
    }),
    {
      // Persist `results` (so /review/summary survives F5) and `mode` (so the
      // user's mode pick survives F5 too). Queue and currentIndex are
      // intentionally not persisted — a fresh mount on /review bootstraps from
      // server-fetched queue via init(), which resets results, so partial
      // sessions naturally start over.
      name: 'review-session-results',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ results: state.results, mode: state.mode }),
    }
  )
);

export { Rating };
export type { Grade };
