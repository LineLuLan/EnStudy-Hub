import { describe, expect, it } from 'vitest';
import { mondayOfWeek, summarizeWeek } from './week-summary-utils';
import type { Activity, ActivityCell } from './activity';

const TZ = 'Asia/Ho_Chi_Minh';

function cell(date: string, ratings: Partial<Omit<ActivityCell, 'date' | 'total'>>): ActivityCell {
  const again = ratings.again ?? 0;
  const hard = ratings.hard ?? 0;
  const good = ratings.good ?? 0;
  const easy = ratings.easy ?? 0;
  return { date, again, hard, good, easy, total: again + hard + good + easy };
}

function buildActivity(cells: ActivityCell[]): Activity {
  let max = 0;
  let total = 0;
  const totalByRating = { again: 0, hard: 0, good: 0, easy: 0 };
  for (const c of cells) {
    if (c.total > max) max = c.total;
    total += c.total;
    totalByRating.again += c.again;
    totalByRating.hard += c.hard;
    totalByRating.good += c.good;
    totalByRating.easy += c.easy;
  }
  return {
    cells,
    timezone: TZ,
    max,
    total,
    totalByRating,
    start: cells[0]?.date ?? '',
    end: cells[cells.length - 1]?.date ?? '',
  };
}

describe('mondayOfWeek', () => {
  it('returns same day for Monday input', () => {
    // 2026-05-11 is a Monday
    expect(mondayOfWeek('2026-05-11')).toBe('2026-05-11');
  });

  it('walks back 1 day from Tuesday', () => {
    expect(mondayOfWeek('2026-05-12')).toBe('2026-05-11');
  });

  it('walks back 5 days from Saturday', () => {
    expect(mondayOfWeek('2026-05-16')).toBe('2026-05-11');
  });

  it('walks back 6 days from Sunday (ISO-style Mon-first week)', () => {
    expect(mondayOfWeek('2026-05-17')).toBe('2026-05-11');
  });

  it('handles month boundary correctly', () => {
    // 2026-04-02 is a Thursday → Monday is 2026-03-30
    expect(mondayOfWeek('2026-04-02')).toBe('2026-03-30');
  });
});

describe('summarizeWeek', () => {
  // Anchor: Saturday 2026-05-16 12:00 UTC = 19:00 ICT (still Saturday in tz)
  const NOW = new Date('2026-05-16T12:00:00Z');

  it('returns zero summary when activity is empty', () => {
    const r = summarizeWeek(buildActivity([]), NOW, TZ);
    expect(r.reviews).toBe(0);
    expect(r.accuracy).toBe(0);
    expect(r.daysActive).toBe(0);
    expect(r.weekStart).toBe('2026-05-11');
    expect(r.weekEnd).toBe('2026-05-16');
  });

  it('sums only days inside [weekStart, today] window', () => {
    const cells = [
      cell('2026-05-09', { good: 5 }), // outside (previous Saturday)
      cell('2026-05-10', { again: 2 }), // outside (Sunday before this week)
      cell('2026-05-11', { good: 3, easy: 2 }), // Mon — in
      cell('2026-05-13', { good: 4 }), // Wed — in
      cell('2026-05-16', { good: 5, again: 1 }), // Sat (today) — in
    ];
    const r = summarizeWeek(buildActivity(cells), NOW, TZ);
    expect(r.reviews).toBe(15); // 3+2 + 4 + 5+1 = 15
    expect(r.daysActive).toBe(3);
  });

  it('computes accuracy as (good + easy) / total rounded', () => {
    const cells = [
      cell('2026-05-11', { good: 7, easy: 1, again: 2 }), // 8/10 = 80%
    ];
    const r = summarizeWeek(buildActivity(cells), NOW, TZ);
    expect(r.reviews).toBe(10);
    expect(r.accuracy).toBe(80);
  });

  it('rounds accuracy correctly (66.66% → 67)', () => {
    const cells = [cell('2026-05-12', { good: 2, again: 1 })]; // 2/3 = 66.66...
    const r = summarizeWeek(buildActivity(cells), NOW, TZ);
    expect(r.accuracy).toBe(67);
  });

  it('treats Hard as incorrect (not in good+easy numerator)', () => {
    const cells = [cell('2026-05-11', { hard: 1, good: 1 })]; // 1/2 = 50%
    const r = summarizeWeek(buildActivity(cells), NOW, TZ);
    expect(r.accuracy).toBe(50);
  });

  it('treats Again as incorrect', () => {
    const cells = [cell('2026-05-11', { again: 3, good: 1 })]; // 1/4 = 25%
    const r = summarizeWeek(buildActivity(cells), NOW, TZ);
    expect(r.accuracy).toBe(25);
  });

  it('counts daysActive correctly (only cells with total > 0)', () => {
    const cells = [
      cell('2026-05-11', { good: 1 }),
      cell('2026-05-12', {}), // empty
      cell('2026-05-13', { again: 1 }),
      cell('2026-05-16', {}), // today empty
    ];
    const r = summarizeWeek(buildActivity(cells), NOW, TZ);
    expect(r.daysActive).toBe(2);
  });

  it('caps daysActive at 7 (full week)', () => {
    const cells = [
      cell('2026-05-11', { good: 1 }),
      cell('2026-05-12', { good: 1 }),
      cell('2026-05-13', { good: 1 }),
      cell('2026-05-14', { good: 1 }),
      cell('2026-05-15', { good: 1 }),
      cell('2026-05-16', { good: 1 }),
    ];
    // NOW = Saturday so today is Sat — only 6 days possible Mon..Sat
    const r = summarizeWeek(buildActivity(cells), NOW, TZ);
    expect(r.daysActive).toBe(6);
  });

  it('returns weekStart/weekEnd in YYYY-MM-DD format', () => {
    const r = summarizeWeek(buildActivity([]), NOW, TZ);
    expect(r.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.weekEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('handles Sunday today correctly (week is Mon-Sun, today is Sun)', () => {
    const sunday = new Date('2026-05-17T12:00:00Z'); // Sunday in ICT
    const cells = [
      cell('2026-05-11', { good: 1 }), // Mon (in)
      cell('2026-05-17', { good: 2 }), // Sun = today (in)
    ];
    const r = summarizeWeek(buildActivity(cells), sunday, TZ);
    expect(r.weekStart).toBe('2026-05-11');
    expect(r.weekEnd).toBe('2026-05-17');
    expect(r.reviews).toBe(3);
    expect(r.daysActive).toBe(2);
  });
});
