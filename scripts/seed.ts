#!/usr/bin/env tsx
/**
 * Seed content JSON → Supabase Postgres.
 *
 * Phase 0: stub. Reads all content/collections/**\/*.json and prints a
 *           dry-run summary. No DB connection required.
 * Tuần 2 :  upsert via Drizzle once DATABASE_URL is set.
 *
 * Usage:
 *   pnpm seed            # real run (Tuần 2+)
 *   pnpm seed:dry        # dry-run, no DB writes
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import {
  collectionMetaSchema,
  topicMetaSchema,
  lessonContentSchema,
  type CollectionMeta,
  type TopicMeta,
  type LessonContent,
} from '../src/features/vocab/content-schema';

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
    const colMeta = collectionMetaSchema.parse(
      JSON.parse(await readFile(colMetaPath, 'utf8'))
    );
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
        const topicMeta = topicMetaSchema.parse(
          JSON.parse(await readFile(topicMetaPath, 'utf8'))
        );
        plan.topics.push({ collectionSlug: colMeta.slug, meta: topicMeta, path: topicMetaPath });
      } catch (err) {
        console.warn(`[seed] Skip topic ${topicDir} — ${(err as Error).message}`);
        continue;
      }

      const topicPath = join(topicsDir, topicDir);
      const files = (await readdir(topicPath))
        .filter((f) => f.endsWith('.json') && f !== 'meta.json');

      for (const f of files) {
        const lessonPath = join(topicPath, f);
        try {
          const lesson = lessonContentSchema.parse(
            JSON.parse(await readFile(lessonPath, 'utf8'))
          );
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

async function main() {
  console.log(`[seed] ${DRY ? 'DRY RUN' : 'LIVE'} — scanning ${ROOT}`);
  const plan = await walk();

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

  if (DRY) {
    console.log('[seed] DRY RUN — no DB writes. Done.');
    return;
  }

  console.log('[seed] TODO Tuần 2: upsert via Drizzle. Aborting LIVE run for now.');
  // Implementation outline (Tuần 2):
  //   const { db } = await import('../src/lib/db/client');
  //   await db.transaction(async (tx) => { ...upsert collections/topics/lessons/cards });
}

main().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
