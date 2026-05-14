import { z } from 'zod';
import { EXPORT_VERSION } from './export-schema';
import { cardContentSchema } from '@/features/vocab/content-schema';

/**
 * Runtime validation for ExportData v1 (matches `ExportData` type from
 * export-schema.ts). Used by `importUserData` to reject malformed or
 * future-versioned JSON before touching the database.
 *
 * Each card is parsed through `cardContentSchema` so that imported content
 * stays consistent with the canonical content shape (same enum constraints
 * as official seed + CSV import). If the export had cards with non-enum POS
 * or missing required fields somehow, import rejects rather than silently
 * inserting bad data.
 */
const importCardSchema = z.object({
  word: z.string().min(1),
  ipa: z.string().nullable(),
  pos: z.string().nullable(),
  cefr: z.string().nullable(),
  definitions: z.unknown(),
  mnemonic_vi: z.string().nullable(),
});

export const importDataSchema = z.object({
  version: z.literal(EXPORT_VERSION),
  exportedAt: z.string().datetime({ offset: true }),
  profile: z.object({
    displayName: z.string().nullable(),
    timezone: z.string(),
    dailyNewCards: z.number().int(),
    dailyReviewMax: z.number().int(),
  }),
  stats: z.object({
    currentStreak: z.number().int(),
    longestStreak: z.number().int(),
    totalReviews: z.number().int(),
    totalCardsMature: z.number().int(),
    lastActiveDate: z.string().nullable(),
  }),
  notes: z.array(
    z.object({
      word: z.string().min(1),
      lessonSlug: z.string().min(1),
      collectionSlug: z.string().min(1),
      note: z.string().min(1),
    })
  ),
  suspended: z.array(
    z.object({
      word: z.string().min(1),
      lessonSlug: z.string().min(1),
      collectionSlug: z.string().min(1),
    })
  ),
  customCollections: z.array(
    z.object({
      slug: z.string().min(1),
      name: z.string().min(1),
      description: z.string().nullable(),
      topics: z.array(
        z.object({
          slug: z.string().min(1),
          name: z.string().min(1),
          lessons: z.array(
            z.object({
              slug: z.string().min(1),
              name: z.string().min(1),
              cards: z.array(importCardSchema),
            })
          ),
        })
      ),
    })
  ),
});

export type ImportData = z.infer<typeof importDataSchema>;

export type ImportResult =
  | {
      ok: true;
      summary: {
        collectionsCreated: number;
        lessonsCreated: number;
        cardsCreated: number;
        notesRestored: number;
        notesSkipped: number;
        suspendedRestored: number;
        suspendedSkipped: number;
      };
    }
  | { ok: false; error: string };

/**
 * Re-validate one imported card through `cardContentSchema` to ensure POS is
 * a canonical enum value, cefr is uppercase A1..C2, and definitions have the
 * expected nested shape. Returns null on failure so the caller can skip
 * malformed cards rather than aborting the whole import.
 */
export function normalizeImportedCard(raw: z.infer<typeof importCardSchema>): unknown | null {
  const candidate = {
    word: raw.word,
    ipa: raw.ipa ?? '',
    pos: raw.pos ?? '',
    cefr: raw.cefr ?? '',
    definitions: raw.definitions,
    synonyms: [],
    antonyms: [],
    collocations: [],
    mnemonic_vi: raw.mnemonic_vi ?? undefined,
  };
  const parsed = cardContentSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/**
 * Extract the 8-char userId prefix from a `personal-{prefix}` slug. Returns
 * null for non-personal collections (shouldn't appear in export since we
 * only export `isOfficial=false + ownerId=userId`, but defensive).
 */
export function extractUserShortIdFromSlug(slug: string): string | null {
  const m = slug.match(/^personal-([a-f0-9]{8})$/i);
  return m ? m[1]! : null;
}
