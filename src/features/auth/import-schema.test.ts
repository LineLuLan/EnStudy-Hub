import { describe, expect, it } from 'vitest';
import {
  extractUserShortIdFromSlug,
  importDataSchema,
  normalizeImportedCard,
} from './import-schema';

const VALID_PAYLOAD = {
  version: 1,
  exportedAt: '2026-05-16T01:23:45.000Z',
  profile: {
    displayName: 'Test User',
    timezone: 'Asia/Ho_Chi_Minh',
    dailyNewCards: 20,
    dailyReviewMax: 200,
  },
  stats: {
    currentStreak: 3,
    longestStreak: 5,
    totalReviews: 42,
    totalCardsMature: 10,
    lastActiveDate: '2026-05-15',
  },
  notes: [{ word: 'food', lessonSlug: 'family', collectionSlug: 'daily-life', note: 'memo' }],
  suspended: [{ word: 'hello', lessonSlug: 'family', collectionSlug: 'daily-life' }],
  customCollections: [
    {
      slug: 'personal-11111111',
      name: 'Bộ cá nhân',
      description: 'My imports',
      topics: [
        {
          slug: 'imported',
          name: 'CSV import',
          lessons: [
            {
              slug: 'daily-words',
              name: 'Daily Words',
              cards: [
                {
                  word: 'breakfast',
                  ipa: 'ˈbrek.fəst',
                  pos: 'noun',
                  cefr: 'A1',
                  definitions: [
                    {
                      meaning_en: 'first meal',
                      meaning_vi: 'bữa sáng',
                      examples: [{ en: 'I eat breakfast.', vi: 'Tôi ăn sáng.' }],
                    },
                  ],
                  mnemonic_vi: null,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe('importDataSchema', () => {
  it('accepts a canonical v1 payload', () => {
    const r = importDataSchema.safeParse(VALID_PAYLOAD);
    expect(r.success).toBe(true);
  });

  it('rejects version != 1', () => {
    const r = importDataSchema.safeParse({ ...VALID_PAYLOAD, version: 2 });
    expect(r.success).toBe(false);
  });

  it('rejects missing exportedAt', () => {
    const { exportedAt, ...rest } = VALID_PAYLOAD;
    void exportedAt;
    const r = importDataSchema.safeParse(rest);
    expect(r.success).toBe(false);
  });

  it('rejects malformed exportedAt (not ISO datetime)', () => {
    const r = importDataSchema.safeParse({ ...VALID_PAYLOAD, exportedAt: '2026-05-16' });
    expect(r.success).toBe(false);
  });

  it('accepts empty notes / suspended / customCollections arrays', () => {
    const r = importDataSchema.safeParse({
      ...VALID_PAYLOAD,
      notes: [],
      suspended: [],
      customCollections: [],
    });
    expect(r.success).toBe(true);
  });

  it('rejects note with empty word', () => {
    const r = importDataSchema.safeParse({
      ...VALID_PAYLOAD,
      notes: [{ word: '', lessonSlug: 'x', collectionSlug: 'y', note: 'z' }],
    });
    expect(r.success).toBe(false);
  });

  it('rejects card with missing word', () => {
    const broken = JSON.parse(JSON.stringify(VALID_PAYLOAD));
    delete broken.customCollections[0].topics[0].lessons[0].cards[0].word;
    const r = importDataSchema.safeParse(broken);
    expect(r.success).toBe(false);
  });
});

describe('normalizeImportedCard', () => {
  it('returns canonical CardContent for valid input', () => {
    const result = normalizeImportedCard({
      word: 'happy',
      ipa: 'ˈhæp.i',
      pos: 'adjective',
      cefr: 'A2',
      definitions: [
        {
          meaning_en: 'feeling pleased',
          meaning_vi: 'vui vẻ',
          examples: [{ en: 'I am happy.', vi: 'Tôi vui.' }],
        },
      ],
      mnemonic_vi: null,
    });
    expect(result).not.toBeNull();
    expect((result as { word: string }).word).toBe('happy');
  });

  it('returns null for invalid pos (post-validation)', () => {
    const result = normalizeImportedCard({
      word: 'happy',
      ipa: 'ˈhæp.i',
      pos: 'adj',
      cefr: 'A2',
      definitions: [
        {
          meaning_en: 'feeling pleased',
          meaning_vi: 'vui vẻ',
          examples: [{ en: 'I am happy.', vi: 'Tôi vui.' }],
        },
      ],
      mnemonic_vi: null,
    });
    expect(result).toBeNull();
  });

  it('returns null when definitions are missing', () => {
    const result = normalizeImportedCard({
      word: 'happy',
      ipa: null,
      pos: null,
      cefr: null,
      definitions: [],
      mnemonic_vi: null,
    });
    expect(result).toBeNull();
  });
});

describe('extractUserShortIdFromSlug', () => {
  it('extracts hex prefix from personal-{8hex}', () => {
    expect(extractUserShortIdFromSlug('personal-abcd1234')).toBe('abcd1234');
  });

  it('case-insensitive on hex letters', () => {
    expect(extractUserShortIdFromSlug('personal-ABCD1234')).toBe('ABCD1234');
  });

  it('returns null for non-personal slug', () => {
    expect(extractUserShortIdFromSlug('daily-life')).toBeNull();
    expect(extractUserShortIdFromSlug('personal-')).toBeNull();
    expect(extractUserShortIdFromSlug('personal-tooshort')).toBeNull();
  });

  it('rejects slugs with trailing garbage', () => {
    expect(extractUserShortIdFromSlug('personal-abcd1234-extra')).toBeNull();
  });
});
