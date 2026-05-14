import { describe, expect, it } from 'vitest';
import {
  cardEditInputSchema,
  cardToFormState,
  formStateToInput,
  MAX_DEFINITIONS,
  MAX_EXAMPLES_PER_DEF,
} from './card-edit-schema';
import type { Card } from '@/lib/db/schema';

const VALID_CARD_ID = '11111111-1111-1111-1111-111111111111';

const ONE_DEF_INPUT = {
  cardId: VALID_CARD_ID,
  word: 'breakfast',
  ipa: 'ˈbrek.fəst',
  pos: 'noun' as const,
  cefr: 'A1' as const,
  definitions: [
    {
      meaning_en: 'The first meal of the day',
      meaning_vi: 'bữa sáng',
      examples: [{ en: 'I eat breakfast at 7am.', vi: 'Tôi ăn sáng lúc 7 giờ.' }],
    },
  ],
};

function makeDef(suffix: string) {
  return {
    meaning_en: `def en ${suffix}`,
    meaning_vi: `nghĩa vi ${suffix}`,
    examples: [{ en: `ex en ${suffix}`, vi: `ví dụ vi ${suffix}` }],
  };
}

describe('cardEditInputSchema', () => {
  it('accepts a valid 1-definition input', () => {
    const r = cardEditInputSchema.safeParse(ONE_DEF_INPUT);
    expect(r.success).toBe(true);
  });

  it('accepts 5 definitions (max)', () => {
    const r = cardEditInputSchema.safeParse({
      ...ONE_DEF_INPUT,
      definitions: Array.from({ length: MAX_DEFINITIONS }, (_, i) => makeDef(String(i))),
    });
    expect(r.success).toBe(true);
  });

  it('rejects 0 definitions', () => {
    const r = cardEditInputSchema.safeParse({ ...ONE_DEF_INPUT, definitions: [] });
    expect(r.success).toBe(false);
  });

  it('accepts a definition with 5 examples (max)', () => {
    const r = cardEditInputSchema.safeParse({
      ...ONE_DEF_INPUT,
      definitions: [
        {
          meaning_en: 'x',
          meaning_vi: 'y',
          examples: Array.from({ length: MAX_EXAMPLES_PER_DEF }, (_, i) => ({
            en: `e${i}`,
            vi: `v${i}`,
          })),
        },
      ],
    });
    expect(r.success).toBe(true);
  });

  it('rejects a definition with 0 examples', () => {
    const r = cardEditInputSchema.safeParse({
      ...ONE_DEF_INPUT,
      definitions: [{ meaning_en: 'x', meaning_vi: 'y', examples: [] }],
    });
    expect(r.success).toBe(false);
  });

  it('rejects a definition with 6 examples', () => {
    const r = cardEditInputSchema.safeParse({
      ...ONE_DEF_INPUT,
      definitions: [
        {
          meaning_en: 'x',
          meaning_vi: 'y',
          examples: Array.from({ length: MAX_EXAMPLES_PER_DEF + 1 }, (_, i) => ({
            en: `e${i}`,
            vi: `v${i}`,
          })),
        },
      ],
    });
    expect(r.success).toBe(false);
  });

  it('requires cardId as UUID', () => {
    const r = cardEditInputSchema.safeParse({ ...ONE_DEF_INPUT, cardId: 'not-a-uuid' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid pos enum (no CSV alias mapping here)', () => {
    // Unlike csvRowSchema, cardEditInputSchema uses canonical cardContentSchema —
    // POS short forms (adj/adv/etc.) are NOT auto-mapped. UI provides full names.
    const r = cardEditInputSchema.safeParse({ ...ONE_DEF_INPUT, pos: 'adj' });
    expect(r.success).toBe(false);
  });

  it('rejects empty meaning_vi inside a definition', () => {
    const r = cardEditInputSchema.safeParse({
      ...ONE_DEF_INPUT,
      definitions: [{ meaning_en: 'x', meaning_vi: '', examples: [{ en: 'e', vi: 'v' }] }],
    });
    expect(r.success).toBe(false);
  });
});

describe('cardToFormState', () => {
  const baseCard: Card = {
    id: VALID_CARD_ID,
    lessonId: '22222222-2222-2222-2222-222222222222',
    word: 'run',
    lemma: null,
    ipa: 'rʌn',
    pos: 'verb',
    cefrLevel: 'A2',
    definitions: [
      {
        meaning_en: 'move quickly on foot',
        meaning_vi: 'chạy',
        examples: [
          { en: 'I run every morning.', vi: 'Tôi chạy mỗi sáng.' },
          { en: 'She runs fast.', vi: 'Cô ấy chạy nhanh.' },
        ],
      },
      {
        meaning_en: 'operate / manage',
        meaning_vi: 'điều hành',
        examples: [{ en: 'He runs a shop.', vi: 'Anh ấy điều hành cửa hàng.' }],
      },
    ],
    synonyms: [],
    antonyms: [],
    collocations: [],
    etymologyHint: null,
    mnemonicVi: 'RUN = nhanh như chạy',
    audioUrl: null,
    imageUrl: null,
    source: 'manual',
    contentVersion: 1,
    createdAt: new Date(),
  };

  it('projects multi-definition + multi-example card', () => {
    const state = cardToFormState(baseCard);
    expect(state.definitions).toHaveLength(2);
    expect(state.definitions[0]!.examples).toHaveLength(2);
    expect(state.definitions[1]!.examples).toHaveLength(1);
    expect(state.definitions[0]!.meaning_vi).toBe('chạy');
    expect(state.definitions[1]!.meaning_en).toBe('operate / manage');
  });

  it('seeds 1 empty def + 1 empty example when card has no definitions', () => {
    const card: Card = { ...baseCard, definitions: [] };
    const state = cardToFormState(card);
    expect(state.definitions).toHaveLength(1);
    expect(state.definitions[0]!.meaning_en).toBe('');
    expect(state.definitions[0]!.examples).toHaveLength(1);
  });

  it('seeds 1 empty example when a definition has no examples', () => {
    const card: Card = {
      ...baseCard,
      definitions: [{ meaning_en: 'x', meaning_vi: 'y', examples: [] }],
    };
    const state = cardToFormState(card);
    expect(state.definitions[0]!.examples).toHaveLength(1);
    expect(state.definitions[0]!.examples[0]).toEqual({ en: '', vi: '' });
  });

  it('returns empty strings for nullable scalar fields', () => {
    const card: Card = {
      ...baseCard,
      ipa: null,
      pos: null,
      cefrLevel: null,
      mnemonicVi: null,
    };
    const state = cardToFormState(card);
    expect(state.ipa).toBe('');
    expect(state.pos).toBe('');
    expect(state.cefr).toBe('');
    expect(state.mnemonic_vi).toBe('');
  });
});

describe('formStateToInput', () => {
  it('trims all string fields and drops empty mnemonic', () => {
    const wire = formStateToInput(
      {
        word: '  hello  ',
        ipa: ' həˈloʊ ',
        pos: 'interjection',
        cefr: 'A1',
        definitions: [
          {
            meaning_en: '  used as a greeting ',
            meaning_vi: ' xin chào ',
            examples: [{ en: '  Hello! ', vi: ' Xin chào! ' }],
          },
        ],
        mnemonic_vi: '   ',
      },
      VALID_CARD_ID
    ) as Record<string, unknown>;
    expect(wire.word).toBe('hello');
    expect(wire.ipa).toBe('həˈloʊ');
    expect(wire.mnemonic_vi).toBeUndefined();
    const defs = wire.definitions as Array<{ meaning_vi: string; examples: Array<{ en: string }> }>;
    expect(defs[0]!.meaning_vi).toBe('xin chào');
    expect(defs[0]!.examples[0]!.en).toBe('Hello!');
  });

  it('keeps mnemonic when non-empty after trim', () => {
    const wire = formStateToInput(
      {
        word: 'x',
        ipa: 'x',
        pos: 'noun',
        cefr: 'A1',
        definitions: [{ meaning_en: 'x', meaning_vi: 'y', examples: [{ en: 'e', vi: 'v' }] }],
        mnemonic_vi: '  hint  ',
      },
      VALID_CARD_ID
    ) as Record<string, unknown>;
    expect(wire.mnemonic_vi).toBe('hint');
  });

  it('round-trips through cardEditInputSchema for valid form state', () => {
    const wire = formStateToInput(
      {
        word: 'food',
        ipa: 'fuːd',
        pos: 'noun',
        cefr: 'A1',
        definitions: [
          {
            meaning_en: 'edible substance',
            meaning_vi: 'thức ăn',
            examples: [{ en: 'I love food.', vi: 'Tôi yêu thức ăn.' }],
          },
        ],
        mnemonic_vi: '',
      },
      VALID_CARD_ID
    );
    const parsed = cardEditInputSchema.safeParse(wire);
    expect(parsed.success).toBe(true);
  });
});
