import { describe, expect, it } from 'vitest';
import { computeStreaks, dayKey, shiftDay, todayKey } from './dates';

describe('dayKey', () => {
  it('shifts UTC midnight forward into the next ICT day', () => {
    expect(dayKey(new Date('2026-05-12T17:00:00Z'), 'Asia/Ho_Chi_Minh')).toBe('2026-05-13');
  });

  it('returns same day for UTC time still before ICT midnight', () => {
    expect(dayKey(new Date('2026-05-12T16:59:59Z'), 'Asia/Ho_Chi_Minh')).toBe('2026-05-12');
  });

  it('returns UTC-aligned date when tz=UTC', () => {
    expect(dayKey(new Date('2026-05-12T12:00:00Z'), 'UTC')).toBe('2026-05-12');
  });

  it('todayKey is just an alias for dayKey(now, tz)', () => {
    const now = new Date('2026-05-12T05:00:00Z');
    expect(todayKey(now, 'UTC')).toBe(dayKey(now, 'UTC'));
  });
});

describe('shiftDay', () => {
  it('adds one day across a normal boundary', () => {
    expect(shiftDay('2026-05-12', 1)).toBe('2026-05-13');
  });

  it('rolls over month end correctly', () => {
    expect(shiftDay('2026-05-31', 1)).toBe('2026-06-01');
  });

  it('rolls over year end correctly', () => {
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('subtracts one day across year boundary', () => {
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('handles delta of 0', () => {
    expect(shiftDay('2026-05-12', 0)).toBe('2026-05-12');
  });

  it('handles larger deltas (84 day rollback for heatmap)', () => {
    // 2026-05-12 - 83 days = 2026-02-18 (since 2026 not leap; Feb=28, Mar=31, Apr=30, May 12)
    expect(shiftDay('2026-05-12', -83)).toBe('2026-02-18');
  });
});

describe('computeStreaks', () => {
  const TODAY = '2026-05-12';

  it('returns zeros for an empty list', () => {
    expect(computeStreaks([], TODAY)).toEqual({ current: 0, longest: 0 });
  });

  it('returns 1/1 for a single day matching today', () => {
    expect(computeStreaks([TODAY], TODAY)).toEqual({ current: 1, longest: 1 });
  });

  it('returns current=0 longest=1 when only yesterday active', () => {
    expect(computeStreaks(['2026-05-11'], TODAY)).toEqual({ current: 0, longest: 1 });
  });

  it('counts 3 consecutive days ending today', () => {
    expect(computeStreaks(['2026-05-10', '2026-05-11', '2026-05-12'], TODAY)).toEqual({
      current: 3,
      longest: 3,
    });
  });

  it('returns current=0 when streak ends at yesterday (today missed)', () => {
    expect(computeStreaks(['2026-05-10', '2026-05-11'], TODAY)).toEqual({
      current: 0,
      longest: 2,
    });
  });

  it('finds correct longest run when current is shorter', () => {
    // longest run: 4 days (May 1-4). Current ending today: 2 days (May 11-12).
    expect(
      computeStreaks(
        ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-11', '2026-05-12'],
        TODAY
      )
    ).toEqual({ current: 2, longest: 4 });
  });

  it('handles gaps within ongoing streak correctly', () => {
    // May 1-2 (run 2), gap, May 5 (run 1), gap, May 11-12 (run 2 = current)
    expect(
      computeStreaks(['2026-05-01', '2026-05-02', '2026-05-05', '2026-05-11', '2026-05-12'], TODAY)
    ).toEqual({ current: 2, longest: 2 });
  });
});
