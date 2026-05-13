/**
 * Pure helpers for MCQ mode. Kept side-effect-free so they can be unit-tested
 * without React or the DOM. The accepted `rng` argument (default `Math.random`)
 * lets tests inject a seeded sequence for deterministic shuffles.
 */

export type Rng = () => number;

const defaultRng: Rng = Math.random;

/**
 * Fisher–Yates shuffle on a copy of `arr`. Pure: original input is untouched.
 */
export function shuffle<T>(arr: readonly T[], rng: Rng = defaultRng): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/**
 * Pick up to `n` distractors from `pool`, excluding anything equal to
 * `correct` (case-insensitive) and dedupes (case-insensitive). Returns fewer
 * than `n` if the pool is too small — caller decides what to do (MCQCard pads
 * with placeholders only when desperate).
 */
export function pickDistractors(
  correct: string,
  pool: readonly string[],
  n: number,
  rng: Rng = defaultRng
): string[] {
  const correctKey = correct.trim().toLowerCase();
  const seen = new Set<string>([correctKey]);
  const filtered: string[] = [];
  for (const candidate of pool) {
    const key = candidate.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    filtered.push(candidate);
  }
  return shuffle(filtered, rng).slice(0, n);
}

export type McqChoice = { text: string; isCorrect: boolean };

/**
 * Build the final 4-choice list: the correct answer + up to 3 distractors,
 * shuffled into a random position. If fewer than 3 distractors are available,
 * the list is shorter — MCQCard renders whatever it gets. Returns both the
 * choices and `correctIndex` so the UI can score in O(1).
 */
export function assembleMcqChoices(
  correct: string,
  pool: readonly string[],
  rng: Rng = defaultRng
): { choices: McqChoice[]; correctIndex: number } {
  const distractors = pickDistractors(correct, pool, 3, rng);
  const unshuffled: McqChoice[] = [
    { text: correct, isCorrect: true },
    ...distractors.map((d) => ({ text: d, isCorrect: false })),
  ];
  const choices = shuffle(unshuffled, rng);
  const correctIndex = choices.findIndex((c) => c.isCorrect);
  return { choices, correctIndex };
}

/**
 * Tiny seeded RNG used by tests. Mulberry32 — small, fast, deterministic.
 * Not exported as part of the public API; kept here only because mcq-utils
 * test imports it. Do NOT use for anything security-sensitive.
 */
export function createSeededRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
