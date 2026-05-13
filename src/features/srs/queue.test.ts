import { describe, expect, it } from 'vitest';
import {
  buildDistractorPool,
  computeNewRemaining,
  dayStartUtc,
  extractMeaningVi,
  type SiblingMeaning,
} from './queue-utils';

describe('computeNewRemaining', () => {
  it('returns full limit when nothing learned today', () => {
    expect(computeNewRemaining(20, 0)).toBe(20);
  });

  it('subtracts learned-today count', () => {
    expect(computeNewRemaining(20, 7)).toBe(13);
  });

  it('clamps at 0 when over the limit', () => {
    expect(computeNewRemaining(20, 25)).toBe(0);
  });

  it('returns 0 for a zero-limit profile', () => {
    expect(computeNewRemaining(0, 5)).toBe(0);
  });
});

describe('dayStartUtc', () => {
  it('Asia/Ho_Chi_Minh at 14:30 local → 17:00 UTC previous calendar day', () => {
    // 2026-05-12 14:30 ICT == 2026-05-12 07:30 UTC
    const now = new Date('2026-05-12T07:30:00Z');
    const start = dayStartUtc(now, 'Asia/Ho_Chi_Minh');
    // Day start in ICT is 2026-05-12 00:00 ICT == 2026-05-11 17:00 UTC
    expect(start.toISOString()).toBe('2026-05-11T17:00:00.000Z');
  });

  it('UTC timezone at noon → same date 00:00 UTC', () => {
    const now = new Date('2026-05-12T12:00:00Z');
    const start = dayStartUtc(now, 'UTC');
    expect(start.toISOString()).toBe('2026-05-12T00:00:00.000Z');
  });

  it('Asia/Ho_Chi_Minh just after local midnight → same calendar day in ICT', () => {
    // 2026-05-12 00:30 ICT == 2026-05-11 17:30 UTC
    const now = new Date('2026-05-11T17:30:00Z');
    const start = dayStartUtc(now, 'Asia/Ho_Chi_Minh');
    // Day start in ICT is 2026-05-12 00:00 ICT == 2026-05-11 17:00 UTC
    expect(start.toISOString()).toBe('2026-05-11T17:00:00.000Z');
  });
});

describe('extractMeaningVi', () => {
  it('returns trimmed meaning_vi from first definition', () => {
    expect(extractMeaningVi([{ meaning_en: 'cat', meaning_vi: '  con mèo  ' }])).toBe('con mèo');
  });

  it('returns null when definitions is empty array', () => {
    expect(extractMeaningVi([])).toBeNull();
  });

  it('returns null when input is not an array', () => {
    expect(extractMeaningVi(null)).toBeNull();
    expect(extractMeaningVi(undefined)).toBeNull();
    expect(extractMeaningVi({ meaning_vi: 'x' })).toBeNull();
  });

  it('returns null when meaning_vi is missing or whitespace', () => {
    expect(extractMeaningVi([{ meaning_en: 'x' }])).toBeNull();
    expect(extractMeaningVi([{ meaning_vi: '   ' }])).toBeNull();
  });
});

describe('buildDistractorPool', () => {
  const siblings: SiblingMeaning[] = [
    { cardId: 'self', meaningVi: 'con mèo' },
    { cardId: 'b', meaningVi: 'con chó' },
    { cardId: 'c', meaningVi: 'con chim' },
    { cardId: 'd', meaningVi: 'con cá' },
    { cardId: 'e', meaningVi: 'con chó' }, // duplicate meaning
  ];

  it('excludes self card and self meaning, dedupes by meaning', () => {
    const pool = buildDistractorPool(siblings, 'self', 'con mèo', []);
    expect(pool).toEqual(['con chó', 'con chim', 'con cá']);
  });

  it('returns siblings-only when ≥3 unique distractors available', () => {
    const pool = buildDistractorPool(siblings, 'self', 'con mèo', ['extra']);
    // 3+ from siblings → globalPool not consulted
    expect(pool).not.toContain('extra');
    expect(pool.length).toBeGreaterThanOrEqual(3);
  });

  it('falls back to global pool when lesson is too small', () => {
    const tiny: SiblingMeaning[] = [
      { cardId: 'self', meaningVi: 'A' },
      { cardId: 'b', meaningVi: 'B' },
    ];
    const pool = buildDistractorPool(tiny, 'self', 'A', ['B', 'C', 'D', 'E']);
    expect(pool).toContain('B');
    expect(pool).toContain('C');
    expect(pool).toContain('D');
    expect(pool).not.toContain('A');
    expect(pool.length).toBeGreaterThanOrEqual(3);
  });

  it('caps at 8 entries when topping up from global pool', () => {
    const tiny: SiblingMeaning[] = [{ cardId: 'self', meaningVi: 'A' }];
    const fatPool = Array.from({ length: 50 }, (_, i) => `M${i}`);
    const pool = buildDistractorPool(tiny, 'self', 'A', fatPool);
    expect(pool.length).toBe(8);
    expect(pool).not.toContain('A');
  });

  it('returns whatever is available if pool exhausts (graceful, never throws)', () => {
    const pool = buildDistractorPool([], 'self', 'A', ['B']);
    expect(pool).toEqual(['B']);
  });

  it('handles a null self meaning (card with no meaning_vi)', () => {
    const pool = buildDistractorPool(siblings, 'self', null, []);
    // Still excludes selfCardId, dedupes
    expect(pool).toEqual(['con chó', 'con chim', 'con cá']);
  });
});
