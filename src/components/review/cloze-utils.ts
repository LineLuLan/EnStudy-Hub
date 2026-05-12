import { Rating, type Grade } from 'ts-fsrs';
import type { Card } from '@/lib/db/schema';

export type MaskSlot = { char: string; hidden: boolean };

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * Mask one letter of `word` per CEFR difficulty:
 *  - A1: first + last letter visible, rest hidden
 *  - A2: first + all vowels visible, rest hidden
 *  - B1, B2, C1, C2, null: every letter hidden
 *
 * Non-letter characters (apostrophe, hyphen, space) are always visible.
 */
export function getClozeMask(word: string, cefr: Card['cefrLevel']): MaskSlot[] {
  const lower = word.toLowerCase();
  return Array.from(lower).map((ch, i) => {
    const isLetter = /^[a-z]$/.test(ch);
    if (!isLetter) return { char: ch, hidden: false };
    if (cefr === 'A1') return { char: ch, hidden: !(i === 0 || i === lower.length - 1) };
    if (cefr === 'A2') return { char: ch, hidden: !(i === 0 || VOWELS.has(ch)) };
    return { char: ch, hidden: true };
  });
}

export type ClozeOutcome = {
  hintsUsed: number;
  mistakes: number;
  durationMs: number;
  gaveUp: boolean;
};

/**
 * Derive an FSRS rating from the user's typing behaviour on a Cloze card.
 *  - gave up / 3+ mistakes / 2+ hints  → Again
 *  - 1 hint OR 1-2 mistakes           → Hard
 *  - 0 mistakes & 0 hints & <5s       → Easy
 *  - otherwise (0/0/≥5s)              → Good
 */
export function gradeFromCloze(o: ClozeOutcome): Grade {
  if (o.gaveUp || o.mistakes >= 3 || o.hintsUsed >= 2) return Rating.Again as Grade;
  if (o.hintsUsed === 1 || o.mistakes >= 1) return Rating.Hard as Grade;
  if (o.mistakes === 0 && o.hintsUsed === 0 && o.durationMs < 5000) return Rating.Easy as Grade;
  return Rating.Good as Grade;
}

/**
 * Pronounce `word` via the Web Speech API. Silent no-op when the runtime
 * lacks `speechSynthesis` (SSR, Firefox with TTS disabled, etc.).
 */
export function speakWord(word: string) {
  if (typeof window === 'undefined') return;
  if (!('speechSynthesis' in window)) return;
  try {
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'en-US';
    utter.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch {
    /* silent */
  }
}
