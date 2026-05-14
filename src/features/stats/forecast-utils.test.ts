import { describe, expect, it } from 'vitest';
import { bucketizeDueByDay, labelForDay } from './forecast-utils';

const TZ = 'Asia/Ho_Chi_Minh'; // UTC+7
const UTC = 'UTC';

// Reference "now" for the tests: 2026-05-16 12:00 UTC = 19:00 ICT
const NOW = new Date('2026-05-16T12:00:00Z');

describe('bucketizeDueByDay', () => {
  it('seeds N empty buckets when due list is empty', () => {
    const r = bucketizeDueByDay([], NOW, TZ, 7);
    expect(r.days).toHaveLength(7);
    expect(r.total).toBe(0);
    expect(r.overdue).toBe(0);
    expect(r.maxCount).toBe(0);
    expect(r.days[0]!.label).toBe('Hôm nay');
  });

  it('clamps days to ≥ 1', () => {
    const r = bucketizeDueByDay([], NOW, TZ, 0);
    expect(r.days).toHaveLength(1);
  });

  it('buckets a future due date correctly in user timezone', () => {
    // 2026-05-17 03:00 UTC = 10:00 ICT next day → bucket "2026-05-17"
    const due = [new Date('2026-05-17T03:00:00Z')];
    const r = bucketizeDueByDay(due, NOW, TZ, 7);
    const tomorrow = r.days[1]!;
    expect(tomorrow.key).toBe('2026-05-17');
    expect(tomorrow.count).toBe(1);
    expect(r.total).toBe(1);
    expect(r.overdue).toBe(0);
  });

  it('collapses overdue (yesterday) onto today and counts as overdue', () => {
    // 2026-05-15 06:00 UTC = 13:00 ICT yesterday → overdue
    const due = [new Date('2026-05-15T06:00:00Z')];
    const r = bucketizeDueByDay(due, NOW, TZ, 7);
    const today = r.days[0]!;
    expect(today.count).toBe(1);
    expect(r.overdue).toBe(1);
    expect(r.total).toBe(1);
  });

  it('keeps due-today (not overdue) on today bucket but does not count as overdue', () => {
    // 2026-05-16 03:00 UTC = 10:00 ICT today
    const due = [new Date('2026-05-16T03:00:00Z')];
    const r = bucketizeDueByDay(due, NOW, TZ, 7);
    expect(r.days[0]!.count).toBe(1);
    expect(r.overdue).toBe(0);
  });

  it('drops cards due past the N-day window', () => {
    // 2026-05-30 ICT = far beyond 7-day window from 2026-05-16
    const due = [new Date('2026-05-30T03:00:00Z')];
    const r = bucketizeDueByDay(due, NOW, TZ, 7);
    expect(r.total).toBe(0);
  });

  it('mixes overdue + today + future correctly', () => {
    const due = [
      new Date('2026-05-15T06:00:00Z'), // overdue → today
      new Date('2026-05-16T03:00:00Z'), // today
      new Date('2026-05-17T03:00:00Z'), // tomorrow
      new Date('2026-05-19T03:00:00Z'), // day +3
    ];
    const r = bucketizeDueByDay(due, NOW, TZ, 7);
    expect(r.days[0]!.count).toBe(2); // overdue + today
    expect(r.days[1]!.count).toBe(1); // tomorrow
    expect(r.days[3]!.count).toBe(1); // day +3
    expect(r.total).toBe(4);
    expect(r.overdue).toBe(1);
    expect(r.maxCount).toBe(2);
  });

  it('respects UTC timezone for users on UTC', () => {
    const due = [new Date('2026-05-16T23:30:00Z')];
    const r = bucketizeDueByDay(due, NOW, UTC, 7);
    expect(r.days[0]!.count).toBe(1);
    expect(r.days[0]!.key).toBe('2026-05-16');
  });

  it('returns day keys in chronological order', () => {
    const r = bucketizeDueByDay([], NOW, TZ, 7);
    for (let i = 1; i < r.days.length; i += 1) {
      expect(r.days[i]!.key > r.days[i - 1]!.key).toBe(true);
    }
  });

  it('marks isToday on first bucket only', () => {
    const r = bucketizeDueByDay([], NOW, TZ, 7);
    expect(r.days[0]!.isToday).toBe(true);
    expect(r.days[1]!.isToday).toBe(false);
    expect(r.days[6]!.isToday).toBe(false);
  });
});

describe('labelForDay', () => {
  it('uses "Hôm nay" when key matches today', () => {
    expect(labelForDay('2026-05-16', '2026-05-16')).toBe('Hôm nay');
  });

  it('maps weekday correctly (2026-05-17 is Sunday)', () => {
    expect(labelForDay('2026-05-17', '2026-05-16')).toBe('CN');
  });

  it('maps weekday correctly (2026-05-18 is Monday)', () => {
    expect(labelForDay('2026-05-18', '2026-05-16')).toBe('T2');
  });

  it('maps weekday correctly (2026-05-23 is Saturday)', () => {
    expect(labelForDay('2026-05-23', '2026-05-16')).toBe('T7');
  });
});
