import { z } from 'zod';

export const cefrSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export type CEFR = z.infer<typeof cefrSchema>;

export const posSchema = z.enum([
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'pronoun',
  'interjection',
  'determiner',
  'auxiliary',
]);
export type POS = z.infer<typeof posSchema>;

export const exampleSchema = z.object({
  en: z.string().min(1),
  vi: z.string().min(1),
});

export const definitionSchema = z.object({
  meaning_en: z.string().min(1),
  meaning_vi: z.string().min(1),
  examples: z.array(exampleSchema).min(1).max(5),
});

export const cardContentSchema = z.object({
  word: z.string().min(1),
  lemma: z.string().optional(),
  ipa: z.string().min(1),
  pos: posSchema,
  cefr: cefrSchema,
  definitions: z.array(definitionSchema).min(1),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  collocations: z.array(z.string()).default([]),
  etymology_hint: z.string().optional(),
  mnemonic_vi: z.string().optional(),
});
export type CardContent = z.infer<typeof cardContentSchema>;

export const lessonContentSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
  name: z.string().min(1),
  description: z.string().optional(),
  order_index: z.number().int().nonnegative().default(0),
  estimated_minutes: z.number().int().positive().optional(),
  cards: z.array(cardContentSchema).min(1),
});
export type LessonContent = z.infer<typeof lessonContentSchema>;

export const topicMetaSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().optional(),
  order_index: z.number().int().nonnegative().default(0),
  icon: z.string().optional(),
  color: z.string().optional(),
});
export type TopicMeta = z.infer<typeof topicMetaSchema>;

export const collectionMetaSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().optional(),
  level_min: cefrSchema.optional(),
  level_max: cefrSchema.optional(),
  is_official: z.boolean().default(true),
  cover_image: z.string().nullable().optional(),
});
export type CollectionMeta = z.infer<typeof collectionMetaSchema>;
