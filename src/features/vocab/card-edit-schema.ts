import { z } from 'zod';
import { cardContentSchema, type CardContent } from './content-schema';
import type { Card } from '@/lib/db/schema';

/**
 * Editing a card supports the full canonical CardContent shape:
 *   - multi-definition (1..n per card)
 *   - multi-example per definition (1..5, mirror Zod constraint on
 *     definitionSchema in content-schema.ts)
 *   - synonyms / antonyms / collocations / etymology hint round-tripped
 *
 * Different from CSV import which is intentionally flat (1 def, 1 example)
 * for spreadsheet ergonomics. Single source of truth here is
 * `cardContentSchema`; we just tack on the cardId for routing the update.
 */
export const cardEditInputSchema = cardContentSchema.extend({
  cardId: z.string().uuid(),
});

export type CardEditInput = z.input<typeof cardEditInputSchema>;
export type CardEditResult = { ok: true } | { ok: false; error: string };

/** Form-state shape mirrors CardContent but with `cefr` allowed empty for
 *  "not set" while the user hasn't picked yet. Validation happens on submit. */
export type CardEditFormState = {
  word: string;
  ipa: string;
  pos: string;
  cefr: string;
  definitions: Array<{
    meaning_en: string;
    meaning_vi: string;
    examples: Array<{ en: string; vi: string }>;
  }>;
  mnemonic_vi: string;
};

export const MIN_DEFINITIONS = 1;
export const MAX_DEFINITIONS = 5;
export const MIN_EXAMPLES_PER_DEF = 1;
export const MAX_EXAMPLES_PER_DEF = 5;

type RawDefinition = {
  meaning_en?: string;
  meaning_vi?: string;
  examples?: Array<{ en?: string; vi?: string }>;
};

/**
 * Project a DB `Card` row onto editable form state.
 * Empty/missing fields become empty strings so inputs stay controlled.
 * If the card has no definitions at all, seed one empty def with one empty
 * example so the form is never "below min" on first render.
 */
export function cardToFormState(card: Card): CardEditFormState {
  const defs = (card.definitions as RawDefinition[]) ?? [];
  const projected = defs.map((def) => ({
    meaning_en: def.meaning_en ?? '',
    meaning_vi: def.meaning_vi ?? '',
    examples:
      def.examples && def.examples.length > 0
        ? def.examples.map((ex) => ({ en: ex.en ?? '', vi: ex.vi ?? '' }))
        : [{ en: '', vi: '' }],
  }));
  return {
    word: card.word,
    ipa: card.ipa ?? '',
    pos: card.pos ?? '',
    cefr: card.cefrLevel ?? '',
    definitions:
      projected.length > 0
        ? projected
        : [{ meaning_en: '', meaning_vi: '', examples: [{ en: '', vi: '' }] }],
    mnemonic_vi: card.mnemonicVi ?? '',
  };
}

/**
 * Convert form state back to the wire shape expected by `updateCard`.
 * Trims strings + drops empty optional fields. cefr/pos pass through; Zod
 * will reject invalid enum values at the server boundary.
 */
export function formStateToInput(form: CardEditFormState, cardId: string): unknown {
  const definitions = form.definitions.map((d) => ({
    meaning_en: d.meaning_en.trim(),
    meaning_vi: d.meaning_vi.trim(),
    examples: d.examples.map((ex) => ({ en: ex.en.trim(), vi: ex.vi.trim() })),
  }));
  const mnemonic = form.mnemonic_vi.trim();
  return {
    cardId,
    word: form.word.trim(),
    ipa: form.ipa.trim(),
    pos: form.pos.trim(),
    cefr: form.cefr.trim(),
    definitions,
    ...(mnemonic.length > 0 ? { mnemonic_vi: mnemonic } : {}),
  };
}

export type { CardContent };
