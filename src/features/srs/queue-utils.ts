import { startOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * How many new cards the user is still allowed today.
 * Pure helper extracted from queue.ts so it can be unit-tested without a DB.
 */
export function computeNewRemaining(dailyNewLimit: number, newLearnedToday: number): number {
  return Math.max(0, dailyNewLimit - newLearnedToday);
}

/** Start-of-day in the user's timezone, returned as a UTC `Date`. */
export function dayStartUtc(now: Date, timezone: string): Date {
  const nowInTz = toZonedTime(now, timezone);
  const dayStartInTz = startOfDay(nowInTz);
  return fromZonedTime(dayStartInTz, timezone);
}

type CardDefinitionLike = { meaning_en?: string; meaning_vi?: string };

/** Read `definitions[0].meaning_vi` from a card's jsonb definitions field. */
export function extractMeaningVi(defs: unknown): string | null {
  if (!Array.isArray(defs) || defs.length === 0) return null;
  const first = defs[0] as CardDefinitionLike | undefined;
  const vi = first?.meaning_vi;
  return typeof vi === 'string' && vi.trim().length > 0 ? vi.trim() : null;
}

export type SiblingMeaning = { cardId: string; meaningVi: string };

/**
 * Build a distractor pool for MCQ mode. Returns meanings of sibling cards in
 * the same lesson, excluding the card's own meaning. Falls back to the
 * `globalPool` (all meanings across involved lessons) when the lesson is too
 * small to provide 3 unique distractors, capped at 8 candidates so the FE
 * shuffle stays cheap.
 */
export function buildDistractorPool(
  siblings: SiblingMeaning[],
  selfCardId: string,
  selfMeaning: string | null,
  globalPool: string[]
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const s of siblings) {
    if (s.cardId === selfCardId) continue;
    if (selfMeaning && s.meaningVi === selfMeaning) continue;
    if (seen.has(s.meaningVi)) continue;
    seen.add(s.meaningVi);
    result.push(s.meaningVi);
  }
  if (result.length >= 3) return result;
  for (const m of globalPool) {
    if (result.length >= 8) break;
    if (selfMeaning && m === selfMeaning) continue;
    if (seen.has(m)) continue;
    seen.add(m);
    result.push(m);
  }
  return result;
}
