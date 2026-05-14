'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { collections, topics, lessons, cards, userLessons, userCards } from '@/lib/db/schema';
import { requireUserId } from '@/lib/auth/session';
import { ensureProfile } from '@/features/auth/profile';
import { parseCsvRows } from './csv-parse';
import { csvImportInputSchema, MAX_CSV_BYTES, type RowError } from './csv-schema';
import type { CardContent } from './content-schema';

const PERSONAL_COLLECTION_NAME = 'Bộ cá nhân';
const PERSONAL_COLLECTION_DESC = 'Các bài học bạn tự thêm qua CSV';
const PERSONAL_TOPIC_SLUG = 'imported';
const PERSONAL_TOPIC_NAME = 'CSV import';
const PERSONAL_TOPIC_DESC = 'Bài học nhập từ CSV';

function personalCollectionSlug(userId: string): string {
  return `personal-${userId.slice(0, 8)}`;
}

export type PreviewResult =
  | { ok: true; rows: CardContent[]; totalRows: number }
  | { ok: false; error: string; rowErrors: RowError[] };

export async function previewCsv(formData: FormData): Promise<PreviewResult> {
  const csvText = String(formData.get('csvText') ?? '');
  if (!csvText.trim()) {
    return { ok: false, error: 'Thiếu nội dung CSV', rowErrors: [] };
  }
  if (Buffer.byteLength(csvText, 'utf8') > MAX_CSV_BYTES) {
    return {
      ok: false,
      error: `CSV vượt giới hạn ${Math.round(MAX_CSV_BYTES / 1024)} KB`,
      rowErrors: [],
    };
  }

  const result = parseCsvRows(csvText);
  if (result.rowErrors.length > 0) {
    return { ok: false, error: `${result.rowErrors.length} lỗi`, rowErrors: result.rowErrors };
  }
  if (result.rows.length === 0) {
    return { ok: false, error: 'Không có thẻ hợp lệ', rowErrors: [] };
  }
  return { ok: true, rows: result.rows, totalRows: result.totalRows };
}

export type ImportResult =
  | {
      ok: true;
      collectionSlug: string;
      topicSlug: string;
      lessonSlug: string;
      cardCount: number;
    }
  | { ok: false; error: string; rowErrors?: RowError[] };

export async function importCsvAsLesson(formData: FormData): Promise<ImportResult> {
  const input = csvImportInputSchema.safeParse({
    lessonName: formData.get('lessonName'),
    lessonSlug: formData.get('lessonSlug'),
    csvText: formData.get('csvText'),
    overwrite: formData.get('overwrite') ?? false,
  });
  if (!input.success) {
    return { ok: false, error: input.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  }

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: 'Bạn cần đăng nhập trước.' };
  }
  await ensureProfile(userId);

  const parseResult = parseCsvRows(input.data.csvText);
  if (parseResult.rowErrors.length > 0) {
    return {
      ok: false,
      error: `${parseResult.rowErrors.length} lỗi trong CSV`,
      rowErrors: parseResult.rowErrors,
    };
  }
  if (parseResult.rows.length === 0) {
    return { ok: false, error: 'Không có thẻ hợp lệ trong CSV' };
  }

  const collectionSlug = personalCollectionSlug(userId);
  const { lessonName, lessonSlug, overwrite } = input.data;
  const cardContents = parseResult.rows;

  try {
    await db.transaction(async (tx) => {
      const [colRow] = await tx
        .insert(collections)
        .values({
          slug: collectionSlug,
          name: PERSONAL_COLLECTION_NAME,
          description: PERSONAL_COLLECTION_DESC,
          isOfficial: false,
          ownerId: userId,
        })
        .onConflictDoUpdate({
          target: collections.slug,
          set: { ownerId: userId },
        })
        .returning({ id: collections.id });
      if (!colRow) throw new Error('COLLECTION_FAIL');
      const collectionId = colRow.id;

      const [topicRow] = await tx
        .insert(topics)
        .values({
          collectionId,
          slug: PERSONAL_TOPIC_SLUG,
          name: PERSONAL_TOPIC_NAME,
          description: PERSONAL_TOPIC_DESC,
          orderIndex: 0,
        })
        .onConflictDoUpdate({
          target: [topics.collectionId, topics.slug],
          set: { name: PERSONAL_TOPIC_NAME },
        })
        .returning({ id: topics.id });
      if (!topicRow) throw new Error('TOPIC_FAIL');
      const topicId = topicRow.id;

      // With overwrite=true: upsert lesson (update name + cardCount on
      // conflict) and delete existing cards so the bulk insert below replaces
      // them. Cascade wipes user_cards on those cards — FSRS state is lost
      // for this lesson but user explicitly opted in via the checkbox.
      // With overwrite=false (default): keep the original chunk-3 behavior of
      // rejecting via SLUG_TAKEN.
      const [lessonRow] = overwrite
        ? await tx
            .insert(lessons)
            .values({
              topicId,
              slug: lessonSlug,
              name: lessonName,
              orderIndex: 0,
              cardCount: cardContents.length,
            })
            .onConflictDoUpdate({
              target: [lessons.topicId, lessons.slug],
              set: { name: lessonName, cardCount: cardContents.length },
            })
            .returning({ id: lessons.id })
        : await tx
            .insert(lessons)
            .values({
              topicId,
              slug: lessonSlug,
              name: lessonName,
              orderIndex: 0,
              cardCount: cardContents.length,
            })
            .onConflictDoNothing({ target: [lessons.topicId, lessons.slug] })
            .returning({ id: lessons.id });
      if (!lessonRow) throw new Error('SLUG_TAKEN');
      const lessonId = lessonRow.id;

      if (overwrite) {
        await tx.delete(cards).where(eq(cards.lessonId, lessonId));
      }

      const insertedCards = await tx
        .insert(cards)
        .values(
          cardContents.map((c) => ({
            lessonId,
            word: c.word,
            ipa: c.ipa,
            pos: c.pos,
            cefrLevel: c.cefr,
            definitions: c.definitions,
            synonyms: c.synonyms,
            antonyms: c.antonyms,
            collocations: c.collocations,
            mnemonicVi: c.mnemonic_vi ?? null,
            source: 'csv-import',
          }))
        )
        .returning({ id: cards.id });

      await tx
        .insert(userLessons)
        .values({ userId, lessonId })
        .onConflictDoNothing({ target: [userLessons.userId, userLessons.lessonId] });

      await tx
        .insert(userCards)
        .values(
          insertedCards.map((c) => ({
            userId,
            cardId: c.id,
            lessonId,
          }))
        )
        .onConflictDoNothing({ target: [userCards.userId, userCards.cardId] });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'SLUG_TAKEN') {
      return {
        ok: false,
        error: `Slug "${lessonSlug}" đã tồn tại trong bộ cá nhân — đổi tên khác.`,
      };
    }
    const message = err instanceof Error ? err.message : 'Lỗi khi import';
    return { ok: false, error: message };
  }

  revalidatePath('/decks', 'layout');
  revalidatePath('/dashboard');
  revalidatePath('/review');

  return {
    ok: true,
    collectionSlug,
    topicSlug: PERSONAL_TOPIC_SLUG,
    lessonSlug,
    cardCount: cardContents.length,
  };
}
