import { z } from 'zod';
import { csvRowSchema } from './csv-schema';
import type { Card } from '@/lib/db/schema';

/**
 * Editing a single card uses the same flat shape as a CSV row, plus a UUID
 * to identify which card to update. We collapse multi-definition / multi-example
 * cards to first-only on read; if the user saves, additional definitions are
 * lost. Pre-MVP: acceptable since all current cards seeded with 1 definition
 * and ≤2 examples. Multi-definition editing UI defers post-v1.0.
 */
export const cardEditInputSchema = csvRowSchema.extend({
  cardId: z.string().uuid(),
});

export type CardEditInput = z.input<typeof cardEditInputSchema>;
export type CardEditResult = { ok: true } | { ok: false; error: string };

export type CardEditFormState = {
  word: string;
  ipa: string;
  pos: string;
  cefr: string;
  meaning_vi: string;
  meaning_en: string;
  example_en: string;
  example_vi: string;
  mnemonic_vi: string;
};

type Definition = {
  meaning_en: string;
  meaning_vi: string;
  examples: Array<{ en: string; vi: string }>;
};

/**
 * Project a DB `Card` row onto the flat form shape. Picks first definition +
 * first example only. Empty fields become empty strings so inputs stay
 * controlled.
 */
export function cardToFormState(card: Card): CardEditFormState {
  const defs = (card.definitions as Definition[]) ?? [];
  const firstDef = defs[0];
  const firstEx = firstDef?.examples?.[0];
  return {
    word: card.word,
    ipa: card.ipa ?? '',
    pos: card.pos ?? '',
    cefr: card.cefrLevel ?? '',
    meaning_vi: firstDef?.meaning_vi ?? '',
    meaning_en: firstDef?.meaning_en ?? '',
    example_en: firstEx?.en ?? '',
    example_vi: firstEx?.vi ?? '',
    mnemonic_vi: card.mnemonicVi ?? '',
  };
}
