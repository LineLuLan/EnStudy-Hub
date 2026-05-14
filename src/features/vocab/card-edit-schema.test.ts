import { describe, expect, it } from 'vitest';
import { cardEditInputSchema, cardToFormState } from './card-edit-schema';
import type { Card } from '@/lib/db/schema';

const VALID_CARD_ID = '11111111-1111-1111-1111-111111111111';

const BASE_INPUT = {
  cardId: VALID_CARD_ID,
  word: 'breakfast',
  ipa: 'ˈbrek.fəst',
  pos: 'noun',
  cefr: 'A1',
  meaning_vi: 'bữa sáng',
  meaning_en: 'The first meal of the day',
  example_en: 'I eat breakfast at 7am.',
  example_vi: 'Tôi ăn sáng lúc 7 giờ.',
};

describe('cardEditInputSchema', () => {
  it('accepts a valid full input', () => {
    const r = cardEditInputSchema.safeParse(BASE_INPUT);
    expect(r.success).toBe(true);
  });

  it('requires cardId as UUID', () => {
    const r = cardEditInputSchema.safeParse({ ...BASE_INPUT, cardId: 'not-a-uuid' });
    expect(r.success).toBe(false);
  });

  it('inherits POS alias mapping from csvRowSchema', () => {
    const r = cardEditInputSchema.parse({ ...BASE_INPUT, pos: 'adj' });
    expect(r.pos).toBe('adjective');
  });

  it('inherits CEFR uppercase coercion', () => {
    const r = cardEditInputSchema.parse({ ...BASE_INPUT, cefr: 'b2' });
    expect(r.cefr).toBe('B2');
  });

  it('rejects empty required field', () => {
    const r = cardEditInputSchema.safeParse({ ...BASE_INPUT, meaning_vi: '' });
    expect(r.success).toBe(false);
  });

  it('accepts empty mnemonic_vi (optional)', () => {
    const r = cardEditInputSchema.safeParse({ ...BASE_INPUT, mnemonic_vi: '' });
    expect(r.success).toBe(true);
  });
});

describe('cardToFormState', () => {
  const baseCard: Card = {
    id: VALID_CARD_ID,
    lessonId: '22222222-2222-2222-2222-222222222222',
    word: 'food',
    lemma: null,
    ipa: 'fuːd',
    pos: 'noun',
    cefrLevel: 'A1',
    definitions: [
      {
        meaning_en: 'edible substance',
        meaning_vi: 'thức ăn',
        examples: [
          { en: 'I love food.', vi: 'Tôi yêu thức ăn.' },
          { en: 'Food is essential.', vi: 'Thức ăn là cần thiết.' },
        ],
      },
    ],
    synonyms: [],
    antonyms: [],
    collocations: [],
    etymologyHint: null,
    mnemonicVi: 'FOOD = phở ốc',
    audioUrl: null,
    imageUrl: null,
    source: 'manual',
    contentVersion: 1,
    createdAt: new Date(),
  };

  it('projects first definition + first example onto flat form state', () => {
    const state = cardToFormState(baseCard);
    expect(state.word).toBe('food');
    expect(state.ipa).toBe('fuːd');
    expect(state.pos).toBe('noun');
    expect(state.cefr).toBe('A1');
    expect(state.meaning_vi).toBe('thức ăn');
    expect(state.meaning_en).toBe('edible substance');
    expect(state.example_en).toBe('I love food.');
    expect(state.example_vi).toBe('Tôi yêu thức ăn.');
    expect(state.mnemonic_vi).toBe('FOOD = phở ốc');
  });

  it('returns empty strings for nullable fields', () => {
    const card: Card = {
      ...baseCard,
      ipa: null,
      pos: null,
      cefrLevel: null,
      mnemonicVi: null,
      definitions: [],
    };
    const state = cardToFormState(card);
    expect(state.ipa).toBe('');
    expect(state.pos).toBe('');
    expect(state.cefr).toBe('');
    expect(state.meaning_vi).toBe('');
    expect(state.mnemonic_vi).toBe('');
    expect(state.example_en).toBe('');
  });

  it('handles definition with empty examples array', () => {
    const card: Card = {
      ...baseCard,
      definitions: [{ meaning_en: 'x', meaning_vi: 'y', examples: [] }],
    };
    const state = cardToFormState(card);
    expect(state.meaning_en).toBe('x');
    expect(state.example_en).toBe('');
    expect(state.example_vi).toBe('');
  });
});
