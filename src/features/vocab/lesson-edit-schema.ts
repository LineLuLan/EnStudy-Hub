import { z } from 'zod';

export const MAX_LESSON_NAME = 80;

export const renameLessonSchema = z.object({
  lessonId: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(3, 'Tên bài học tối thiểu 3 ký tự')
    .max(MAX_LESSON_NAME, `Tên bài học tối đa ${MAX_LESSON_NAME} ký tự`),
});

export const deleteLessonSchema = z.object({
  lessonId: z.string().uuid(),
});

export const deleteCardSchema = z.object({
  cardId: z.string().uuid(),
});

export type RenameLessonInput = z.infer<typeof renameLessonSchema>;
export type DeleteLessonInput = z.infer<typeof deleteLessonSchema>;
export type DeleteCardInput = z.infer<typeof deleteCardSchema>;

export type RenameLessonResult = { ok: true; name: string } | { ok: false; error: string };
export type DeleteLessonResult =
  | { ok: true; collectionSlug: string }
  | { ok: false; error: string };
export type DeleteCardResult =
  | { ok: true; collectionSlug: string; topicSlug: string; lessonSlug: string }
  | { ok: false; error: string };
