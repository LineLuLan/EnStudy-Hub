import { z } from 'zod';
import { cefrSchema, posSchema, type CardContent } from './content-schema';

export const REQUIRED_CSV_HEADERS = [
  'word',
  'ipa',
  'pos',
  'cefr',
  'meaning_vi',
  'meaning_en',
  'example_en',
  'example_vi',
] as const;

export const OPTIONAL_CSV_HEADERS = ['mnemonic_vi'] as const;

export const MAX_CSV_BYTES = 256 * 1024;
export const MAX_CSV_ROWS = 200;
export const MAX_LESSON_NAME = 80;
export const MAX_LESSON_SLUG = 40;

const POS_ALIASES: Record<string, string> = {
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  prep: 'preposition',
  conj: 'conjunction',
  pron: 'pronoun',
  interj: 'interjection',
  det: 'determiner',
  aux: 'auxiliary',
};

function normalizePos(input: unknown): string {
  const raw = String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '');
  return POS_ALIASES[raw] ?? raw;
}

export const csvRowSchema = z.object({
  word: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z][a-z\s'-]{0,79}$/, 'word phải bắt đầu chữ cái, tối đa 80 ký tự'),
  ipa: z.string().trim().min(1, 'ipa bắt buộc'),
  pos: z.preprocess(normalizePos, posSchema),
  cefr: z.preprocess(
    (v) =>
      String(v ?? '')
        .trim()
        .toUpperCase(),
    cefrSchema
  ),
  meaning_vi: z.string().trim().min(1, 'meaning_vi bắt buộc').max(200),
  meaning_en: z.string().trim().min(1, 'meaning_en bắt buộc').max(200),
  example_en: z.string().trim().min(1, 'example_en bắt buộc').max(300),
  example_vi: z.string().trim().min(1, 'example_vi bắt buộc').max(300),
  mnemonic_vi: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type CsvRowInput = z.input<typeof csvRowSchema>;
export type CsvRow = z.output<typeof csvRowSchema>;

export const csvImportInputSchema = z.object({
  lessonName: z
    .string()
    .trim()
    .min(3, 'Tên bài học tối thiểu 3 ký tự')
    .max(MAX_LESSON_NAME, `Tên bài học tối đa ${MAX_LESSON_NAME} ký tự`),
  lessonSlug: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/,
      'Slug 3-40 ký tự, chỉ chứa a-z 0-9 -, không bắt đầu/kết thúc bằng -'
    ),
  csvText: z
    .string()
    .min(1, 'CSV trống')
    .refine((s) => Buffer.byteLength(s, 'utf8') <= MAX_CSV_BYTES, {
      message: `CSV vượt giới hạn ${Math.round(MAX_CSV_BYTES / 1024)} KB`,
    }),
  /**
   * When true, re-uploading the same lesson slug overwrites the existing
   * lesson: delete-replace cards (FSRS state on user_cards is wiped via
   * cascade — user accepts the trade-off by ticking this). Default false
   * preserves the original chunk-3 reject-on-conflict behavior.
   */
  overwrite: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),
});

export type CsvImportInput = z.infer<typeof csvImportInputSchema>;

export function csvRowToCardContent(row: CsvRow): CardContent {
  return {
    word: row.word,
    ipa: row.ipa,
    pos: row.pos,
    cefr: row.cefr,
    definitions: [
      {
        meaning_en: row.meaning_en,
        meaning_vi: row.meaning_vi,
        examples: [{ en: row.example_en, vi: row.example_vi }],
      },
    ],
    synonyms: [],
    antonyms: [],
    collocations: [],
    mnemonic_vi: row.mnemonic_vi,
  };
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LESSON_SLUG);
}

export type RowError = { row: number; field: string; message: string };
