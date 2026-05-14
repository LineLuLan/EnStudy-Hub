import { describe, expect, it } from 'vitest';
import {
  renameLessonSchema,
  deleteLessonSchema,
  deleteCardSchema,
  MAX_LESSON_NAME,
} from './lesson-edit-schema';

const VALID_UUID = '11111111-1111-1111-1111-111111111111';

describe('renameLessonSchema', () => {
  it('accepts a valid name', () => {
    const r = renameLessonSchema.safeParse({ lessonId: VALID_UUID, name: 'Daily Words' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe('Daily Words');
  });

  it('trims surrounding whitespace', () => {
    const r = renameLessonSchema.parse({ lessonId: VALID_UUID, name: '  My Lesson  ' });
    expect(r.name).toBe('My Lesson');
  });

  it('rejects name shorter than 3 chars', () => {
    const r = renameLessonSchema.safeParse({ lessonId: VALID_UUID, name: 'ab' });
    expect(r.success).toBe(false);
  });

  it('rejects name above max length', () => {
    const r = renameLessonSchema.safeParse({
      lessonId: VALID_UUID,
      name: 'a'.repeat(MAX_LESSON_NAME + 1),
    });
    expect(r.success).toBe(false);
  });

  it('rejects whitespace-only name (trims to too short)', () => {
    const r = renameLessonSchema.safeParse({ lessonId: VALID_UUID, name: '   ' });
    expect(r.success).toBe(false);
  });

  it('rejects non-UUID lessonId', () => {
    const r = renameLessonSchema.safeParse({ lessonId: 'not-a-uuid', name: 'Valid name' });
    expect(r.success).toBe(false);
  });
});

describe('deleteLessonSchema', () => {
  it('accepts a valid UUID', () => {
    const r = deleteLessonSchema.safeParse({ lessonId: VALID_UUID });
    expect(r.success).toBe(true);
  });

  it('rejects non-UUID', () => {
    const r = deleteLessonSchema.safeParse({ lessonId: 'abc' });
    expect(r.success).toBe(false);
  });

  it('rejects missing field', () => {
    const r = deleteLessonSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});

describe('deleteCardSchema', () => {
  it('accepts a valid UUID', () => {
    const r = deleteCardSchema.safeParse({ cardId: VALID_UUID });
    expect(r.success).toBe(true);
  });

  it('rejects non-UUID', () => {
    const r = deleteCardSchema.safeParse({ cardId: '123' });
    expect(r.success).toBe(false);
  });

  it('rejects extra unknown fields silently allowed by zod default', () => {
    // Zod object schemas allow unknown keys by default — we test that here for clarity.
    const r = deleteCardSchema.safeParse({ cardId: VALID_UUID, foo: 'bar' });
    expect(r.success).toBe(true);
  });
});
