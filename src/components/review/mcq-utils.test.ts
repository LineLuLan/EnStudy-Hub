import { describe, expect, it } from 'vitest';
import { assembleMcqChoices, createSeededRng, pickDistractors, shuffle } from './mcq-utils';

describe('shuffle', () => {
  it('does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input, createSeededRng(1));
    expect(input).toEqual(copy);
  });

  it('returns a permutation of the same elements', () => {
    const out = shuffle([1, 2, 3, 4, 5], createSeededRng(42));
    expect(out.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('is deterministic given the same seed', () => {
    const a = shuffle(['a', 'b', 'c', 'd'], createSeededRng(7));
    const b = shuffle(['a', 'b', 'c', 'd'], createSeededRng(7));
    expect(a).toEqual(b);
  });
});

describe('pickDistractors', () => {
  it('excludes the correct answer (case-insensitive)', () => {
    const pool = ['Con Mèo', 'con chó', 'con cá'];
    const result = pickDistractors('con mèo', pool, 3, createSeededRng(1));
    expect(result).not.toContain('Con Mèo');
    expect(result.length).toBe(2);
  });

  it('dedupes pool entries (case-insensitive)', () => {
    const pool = ['con chó', 'CON CHÓ', 'con cá', 'con chim'];
    const result = pickDistractors('con mèo', pool, 3, createSeededRng(1));
    // Only one "con chó" variant survives + cá + chim → 3
    expect(result.length).toBe(3);
    const lowered = result.map((r) => r.toLowerCase());
    expect(new Set(lowered).size).toBe(3);
  });

  it('returns at most n items even with a fat pool', () => {
    const pool = Array.from({ length: 20 }, (_, i) => `m${i}`);
    const result = pickDistractors('correct', pool, 3, createSeededRng(1));
    expect(result.length).toBe(3);
  });

  it('returns fewer than n when pool is too small', () => {
    const result = pickDistractors('correct', ['only-one'], 3, createSeededRng(1));
    expect(result).toEqual(['only-one']);
  });

  it('returns [] when pool is empty', () => {
    expect(pickDistractors('correct', [], 3, createSeededRng(1))).toEqual([]);
  });

  it('skips empty/whitespace pool entries', () => {
    const result = pickDistractors('correct', ['', '   ', 'real'], 3, createSeededRng(1));
    expect(result).toEqual(['real']);
  });
});

describe('assembleMcqChoices', () => {
  it('always includes the correct answer exactly once', () => {
    const { choices, correctIndex } = assembleMcqChoices(
      'con mèo',
      ['con chó', 'con cá', 'con chim'],
      createSeededRng(1)
    );
    expect(choices.length).toBe(4);
    expect(choices.filter((c) => c.isCorrect).length).toBe(1);
    const correctChoice = choices[correctIndex];
    expect(correctChoice?.text).toBe('con mèo');
    expect(correctChoice?.isCorrect).toBe(true);
  });

  it('produces 4 distinct choice texts when pool has ≥3 unique distractors', () => {
    const { choices } = assembleMcqChoices(
      'con mèo',
      ['con chó', 'con cá', 'con chim', 'con bò'],
      createSeededRng(2)
    );
    const texts = choices.map((c) => c.text.toLowerCase());
    expect(new Set(texts).size).toBe(4);
  });

  it('shuffles correct answer into different positions across seeds', () => {
    const indices = new Set<number>();
    for (let seed = 1; seed <= 30; seed += 1) {
      const { correctIndex } = assembleMcqChoices('A', ['B', 'C', 'D'], createSeededRng(seed));
      indices.add(correctIndex);
    }
    // With 30 seeds and 4 positions, we should hit at least 2 different
    // positions — this guards against accidentally locking correct to index 0.
    expect(indices.size).toBeGreaterThanOrEqual(2);
  });

  it('falls back gracefully when distractors are short', () => {
    const { choices, correctIndex } = assembleMcqChoices('A', ['B'], createSeededRng(1));
    expect(choices.length).toBe(2);
    expect(choices[correctIndex]?.text).toBe('A');
  });
});
