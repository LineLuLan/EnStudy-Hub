import { describe, expect, it } from 'vitest';
import { computeNewRemaining, dayStartUtc } from './queue-utils';

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
