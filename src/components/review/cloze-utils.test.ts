import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { getClozeMask, gradeFromCloze } from './cloze-utils';

describe('getClozeMask — A1 (first + last visible)', () => {
  it('hides middle letters of "family"', () => {
    const mask = getClozeMask('family', 'A1');
    expect(mask.map((s) => s.hidden)).toEqual([false, true, true, true, true, false]);
    expect(mask.map((s) => s.char).join('')).toBe('family');
  });

  it('keeps a single-letter word fully visible', () => {
    const mask = getClozeMask('a', 'A1');
    expect(mask).toEqual([{ char: 'a', hidden: false }]);
  });

  it('treats apostrophes as always-visible separators', () => {
    const mask = getClozeMask("don't", 'A1');
    // d (visible — first letter), o (hidden), n (hidden), ' (always visible), t (visible — last letter)
    expect(mask.map((s) => s.hidden)).toEqual([false, true, true, false, false]);
    expect(mask.map((s) => s.char).join('')).toBe("don't");
  });
});

describe('getClozeMask — A2 (first + vowels visible)', () => {
  it('keeps first letter and vowels visible in "mother"', () => {
    const mask = getClozeMask('mother', 'A2');
    // m (first), o (vowel), t (hidden), h (hidden), e (vowel), r (hidden)
    expect(mask.map((s) => s.hidden)).toEqual([false, false, true, true, false, true]);
  });

  it('hides consonants in "family" except first', () => {
    const mask = getClozeMask('family', 'A2');
    // f (first), a (vowel), m (hidden), i (vowel), l (hidden), y (hidden — y is not in vowel set)
    expect(mask.map((s) => s.hidden)).toEqual([false, false, true, false, true, true]);
  });
});

describe('getClozeMask — B1+ and null (everything hidden)', () => {
  it('hides every letter in B2 word "ephemeral"', () => {
    const mask = getClozeMask('ephemeral', 'B2');
    expect(mask.every((s) => s.hidden)).toBe(true);
    expect(mask).toHaveLength(9);
  });

  it('hides everything when cefr is null (defaults to hardest)', () => {
    const mask = getClozeMask('hello', null);
    expect(mask.every((s) => s.hidden)).toBe(true);
  });

  it('returns an empty array for an empty word', () => {
    expect(getClozeMask('', 'A1')).toEqual([]);
  });
});

describe('gradeFromCloze', () => {
  const base = { hintsUsed: 0, mistakes: 0, durationMs: 8000, gaveUp: false };

  it('returns Easy for a fast, clean answer (<5s, 0 hints, 0 mistakes)', () => {
    expect(gradeFromCloze({ ...base, durationMs: 3000 })).toBe(Rating.Easy);
  });

  it('returns Good for a clean but slower answer (≥5s, 0 hints, 0 mistakes)', () => {
    expect(gradeFromCloze({ ...base, durationMs: 8000 })).toBe(Rating.Good);
  });

  it('returns Hard when one hint was used', () => {
    expect(gradeFromCloze({ ...base, hintsUsed: 1 })).toBe(Rating.Hard);
  });

  it('returns Hard when 1-2 mistakes occurred', () => {
    expect(gradeFromCloze({ ...base, mistakes: 1 })).toBe(Rating.Hard);
    expect(gradeFromCloze({ ...base, mistakes: 2 })).toBe(Rating.Hard);
  });

  it('returns Again when the user gave up', () => {
    expect(gradeFromCloze({ ...base, gaveUp: true })).toBe(Rating.Again);
  });

  it('returns Again on 3+ mistakes', () => {
    expect(gradeFromCloze({ ...base, mistakes: 3 })).toBe(Rating.Again);
  });

  it('returns Again on 2+ hints (too many crutches)', () => {
    expect(gradeFromCloze({ ...base, hintsUsed: 2 })).toBe(Rating.Again);
  });
});
