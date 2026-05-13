#!/usr/bin/env tsx
/**
 * Seed content JSON → Supabase Postgres.
 *
 * Phase 0: dry-run scan only.
 * Tuần 2 : upsert collections / topics / lessons via Drizzle in a single tx.
 *          Cards use delete-then-insert per lesson for idempotent re-runs.
 *
 * Usage:
 *   pnpm seed            # LIVE run — requires DATABASE_URL in .env.local
 *   pnpm seed:dry        # dry-run, no DB writes
 *
 * Note: postgres-js connects as the `postgres` user (admin) which bypasses
 * RLS by design. No service-role key needed.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import {
  collectionMetaSchema,
  topicMetaSchema,
  lessonContentSchema,
  type CollectionMeta,
  type TopicMeta,
  type LessonContent,
} from '../src/features/vocab/content-schema';

// drizzle-kit and Next.js diverge on .env.local convention; load it
// explicitly so `pnpm seed` picks up DATABASE_URL.
loadDotenv({ path: '.env.local' });
loadDotenv({ path: '.env' });

const ROOT = join(process.cwd(), 'content', 'collections');
const DRY = process.argv.includes('--dry');

type Plan = {
  collections: Array<{ meta: CollectionMeta; path: string }>;
  topics: Array<{ collectionSlug: string; meta: TopicMeta; path: string }>;
  lessons: Array<{
    collectionSlug: string;
    topicSlug: string;
    lesson: LessonContent;
    path: string;
  }>;
};

async function walk() {
  const plan: Plan = { collections: [], topics: [], lessons: [] };

  let collectionDirs: string[];
  try {
    collectionDirs = (await readdir(ROOT, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    console.error(`[seed] No content found at ${ROOT}. Run from project root.`);
    process.exit(1);
  }

  for (const colDir of collectionDirs) {
    const colMetaPath = join(ROOT, colDir, 'meta.json');
    try {
      await stat(colMetaPath);
    } catch {
      console.warn(`[seed] Skip ${colDir} — missing meta.json`);
      continue;
    }
    const colMeta = collectionMetaSchema.parse(JSON.parse(await readFile(colMetaPath, 'utf8')));
    plan.collections.push({ meta: colMeta, path: colMetaPath });

    const topicsDir = join(ROOT, colDir, 'topics');
    let topicDirs: string[] = [];
    try {
      topicDirs = (await readdir(topicsDir, { withFileTypes: true }))
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      continue;
    }

    for (const topicDir of topicDirs) {
      const topicMetaPath = join(topicsDir, topicDir, 'meta.json');
      try {
        const topicMeta = topicMetaSchema.parse(JSON.parse(await readFile(topicMetaPath, 'utf8')));
        plan.topics.push({ collectionSlug: colMeta.slug, meta: topicMeta, path: topicMetaPath });
      } catch (err) {
        console.warn(`[seed] Skip topic ${topicDir} — ${(err as Error).message}`);
        continue;
      }

      const topicPath = join(topicsDir, topicDir);
      const files = (await readdir(topicPath)).filter(
        (f) => f.endsWith('.json') && f !== 'meta.json'
      );

      for (const f of files) {
        const lessonPath = join(topicPath, f);
        try {
          const lesson = lessonContentSchema.parse(JSON.parse(await readFile(lessonPath, 'utf8')));
          plan.lessons.push({
            collectionSlug: colMeta.slug,
            topicSlug: topicDir,
            lesson,
            path: lessonPath,
          });
        } catch (err) {
          console.error(`[seed] Lesson invalid ${lessonPath}: ${(err as Error).message}`);
        }
      }
    }
  }

  return plan;
}

function printPlan(plan: Plan) {
  console.log(`[seed] Plan:`);
  console.log(`  - ${plan.collections.length} collection(s)`);
  console.log(`  - ${plan.topics.length} topic(s)`);
  console.log(
    `  - ${plan.lessons.length} lesson(s) (${plan.lessons.reduce(
      (sum, l) => sum + l.lesson.cards.length,
      0
    )} cards)`
  );
  for (const c of plan.collections) {
    console.log(`    collection: ${c.meta.slug} (${c.meta.name})`);
  }
  for (const t of plan.topics) {
    console.log(`    topic: ${t.collectionSlug}/${t.meta.slug}`);
  }
  for (const l of plan.lessons) {
    console.log(
      `    lesson: ${l.collectionSlug}/${l.topicSlug}/${l.lesson.slug} — ${l.lesson.cards.length} cards (${relative(process.cwd(), l.path)})`
    );
  }
}

async function upsert(plan: Plan) {
  if (!process.env.DATABASE_URL) {
    console.error(
      '[seed] DATABASE_URL is not set. Add it to .env.local (see docs/API_KEYS.md), then re-run.'
    );
    process.exit(1);
  }

  // Lazy-import db client AFTER dotenv has populated process.env.
  const { db } = await import('../src/lib/db/client');
  const schema = await import('../src/lib/db/schema');
  const { eq } = await import('drizzle-orm');

  await db.transaction(async (tx) => {
    // 1. Collections — upsert by slug.
    const collectionIdBySlug = new Map<string, string>();
    for (const { meta } of plan.collections) {
      const [row] = await tx
        .insert(schema.collections)
        .values({
          slug: meta.slug,
          name: meta.name,
          description: meta.description ?? null,
          isOfficial: meta.is_official,
          levelMin: meta.level_min ?? null,
          levelMax: meta.level_max ?? null,
          coverImage: meta.cover_image ?? null,
        })
        .onConflictDoUpdate({
          target: schema.collections.slug,
          set: {
            name: meta.name,
            description: meta.description ?? null,
            isOfficial: meta.is_official,
            levelMin: meta.level_min ?? null,
            levelMax: meta.level_max ?? null,
            coverImage: meta.cover_image ?? null,
          },
        })
        .returning({ id: schema.collections.id, slug: schema.collections.slug });
      if (!row) throw new Error(`Failed to upsert collection ${meta.slug}`);
      collectionIdBySlug.set(row.slug, row.id);
      console.log(`  ✓ collection ${row.slug}`);
    }

    // 2. Topics — upsert by (collection_id, slug).
    const topicIdByKey = new Map<string, string>();
    for (const { collectionSlug, meta } of plan.topics) {
      const collectionId = collectionIdBySlug.get(collectionSlug);
      if (!collectionId) {
        throw new Error(`Topic ${meta.slug} refs unknown collection ${collectionSlug}`);
      }
      const [row] = await tx
        .insert(schema.topics)
        .values({
          collectionId,
          slug: meta.slug,
          name: meta.name,
          description: meta.description ?? null,
          orderIndex: meta.order_index,
          icon: meta.icon ?? null,
          color: meta.color ?? null,
        })
        .onConflictDoUpdate({
          target: [schema.topics.collectionId, schema.topics.slug],
          set: {
            name: meta.name,
            description: meta.description ?? null,
            orderIndex: meta.order_index,
            icon: meta.icon ?? null,
            color: meta.color ?? null,
          },
        })
        .returning({ id: schema.topics.id });
      if (!row) throw new Error(`Failed to upsert topic ${collectionSlug}/${meta.slug}`);
      topicIdByKey.set(`${collectionSlug}/${meta.slug}`, row.id);
      console.log(`  ✓ topic ${collectionSlug}/${meta.slug}`);
    }

    // 3. Lessons — upsert by (topic_id, slug). Cards: delete + insert per
    // lesson for content-edit idempotency. Cascade wipes user_cards/review_logs
    // referencing those card_ids — acceptable pre-MVP (no users yet); add a
    // (lesson_id, word) unique constraint + true upsert before going live.
    for (const { collectionSlug, topicSlug, lesson } of plan.lessons) {
      const topicId = topicIdByKey.get(`${collectionSlug}/${topicSlug}`);
      if (!topicId) {
        throw new Error(`Lesson ${lesson.slug} refs unknown topic ${collectionSlug}/${topicSlug}`);
      }
      const [lessonRow] = await tx
        .insert(schema.lessons)
        .values({
          topicId,
          slug: lesson.slug,
          name: lesson.name,
          description: lesson.description ?? null,
          orderIndex: lesson.order_index,
          cardCount: lesson.cards.length,
          estimatedMinutes: lesson.estimated_minutes ?? null,
        })
        .onConflictDoUpdate({
          target: [schema.lessons.topicId, schema.lessons.slug],
          set: {
            name: lesson.name,
            description: lesson.description ?? null,
            orderIndex: lesson.order_index,
            cardCount: lesson.cards.length,
            estimatedMinutes: lesson.estimated_minutes ?? null,
          },
        })
        .returning({ id: schema.lessons.id });
      if (!lessonRow)
        throw new Error(`Failed to upsert lesson ${collectionSlug}/${topicSlug}/${lesson.slug}`);

      const lessonId = lessonRow.id;
      await tx.delete(schema.cards).where(eq(schema.cards.lessonId, lessonId));

      await tx.insert(schema.cards).values(
        lesson.cards.map((card) => ({
          lessonId,
          word: card.word,
          lemma: card.lemma ?? null,
          ipa: card.ipa,
          pos: card.pos,
          cefrLevel: card.cefr,
          definitions: card.definitions,
          synonyms: card.synonyms,
          antonyms: card.antonyms,
          collocations: card.collocations,
          etymologyHint: card.etymology_hint ?? null,
          mnemonicVi: card.mnemonic_vi ?? null,
        }))
      );

      console.log(
        `  ✓ lesson ${collectionSlug}/${topicSlug}/${lesson.slug} — ${lesson.cards.length} cards`
      );
    }
  });
}

async function main() {
  console.log(`[seed] ${DRY ? 'DRY RUN' : 'LIVE'} — scanning ${ROOT}`);
  const plan = await walk();
  printPlan(plan);

  if (DRY) {
    console.log('[seed] DRY RUN — no DB writes. Done.');
    return;
  }

  console.log('[seed] Upserting to Supabase…');
  await upsert(plan);

  // Post-write verify: count rows so the operator sees actual DB state.
  const { db } = await import('../src/lib/db/client');
  const schema = await import('../src/lib/db/schema');
  const { sql } = await import('drizzle-orm');
  const [counts] = await db
    .select({
      collections: sql<number>`(SELECT COUNT(*) FROM ${schema.collections})::int`,
      topics: sql<number>`(SELECT COUNT(*) FROM ${schema.topics})::int`,
      lessons: sql<number>`(SELECT COUNT(*) FROM ${schema.lessons})::int`,
      cards: sql<number>`(SELECT COUNT(*) FROM ${schema.cards})::int`,
    })
    .from(sql`(SELECT 1) AS _`);
  console.log(
    `[seed] ✓ DB state: ${counts?.collections} collections / ${counts?.topics} topics / ${counts?.lessons} lessons / ${counts?.cards} cards.`
  );
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  })
  .finally(() => {
    // Force exit — postgres-js keeps the event loop alive otherwise.
    process.exit(0);
  });
