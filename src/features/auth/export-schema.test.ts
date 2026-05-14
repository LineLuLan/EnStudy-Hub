import { describe, expect, it } from 'vitest';
import { EXPORT_VERSION, exportFilename } from './export-schema';

const SAMPLE_USER_ID = '11111111-2222-3333-4444-555555555555';

describe('EXPORT_VERSION', () => {
  it('is a positive integer for future re-import compatibility', () => {
    expect(Number.isInteger(EXPORT_VERSION)).toBe(true);
    expect(EXPORT_VERSION).toBeGreaterThan(0);
  });
});

describe('exportFilename', () => {
  it('uses 8-char short id + ISO date + .json extension', () => {
    const filename = exportFilename(SAMPLE_USER_ID, new Date('2026-05-15T08:30:00Z'));
    expect(filename).toBe('enstudy-export-11111111-2026-05-15.json');
  });

  it('truncates user id at 8 chars even when longer', () => {
    const filename = exportFilename('abcdef1234567890', new Date('2026-01-01T00:00:00Z'));
    expect(filename).toBe('enstudy-export-abcdef12-2026-01-01.json');
  });

  it('works with current Date when omitted', () => {
    const filename = exportFilename(SAMPLE_USER_ID);
    expect(filename).toMatch(/^enstudy-export-\w{8}-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it('uses UTC date (not local) for deterministic naming', () => {
    // 2026-05-15T22:00:00Z is May 16 in Asia/Ho_Chi_Minh (UTC+7) — but UTC slice
    // gives May 15. We pin to UTC so exports done from VN morning vs VN late-night
    // on the same UTC day get the same date stamp.
    const filename = exportFilename(SAMPLE_USER_ID, new Date('2026-05-15T22:00:00Z'));
    expect(filename).toBe('enstudy-export-11111111-2026-05-15.json');
  });
});
