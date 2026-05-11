#!/usr/bin/env tsx
/**
 * Validate content JSON:
 *   1. Schema (Zod via content-schema.ts).
 *   2. Cross-check IPA + POS against dictionaryapi.dev (free, no key).
 *
 * Output: stdout report + writes docs/CONTENT_REPORT.md (gitignored).
 *
 * Usage:
 *   pnpm validate:content
 *   pnpm validate:content content/collections/oxford-3000/topics/daily-life/family.json
 */

import { readFile, readdir, writeFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { lessonContentSchema, type CardContent } from '../src/features/vocab/content-schema';

const ROOT = join(process.cwd(), 'content', 'collections');
const REPORT_PATH = join(process.cwd(), 'docs', 'CONTENT_REPORT.md');
const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';

type LessonIssue = { file: string; cards: CardIssue[] };
type CardIssue = {
  word: string;
  schema_ok: boolean;
  dict_found: boolean;
  ipa_mismatch?: { json: string; dict: string };
  pos_mismatch?: { json: string; dict: string[] };
};

async function findLessonFiles(arg?: string): Promise<string[]> {
  if (arg) return [arg];
  const out: string[] = [];

  async function walk(dir: string) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.isFile() && e.name.endsWith('.json') && e.name !== 'meta.json') {
        out.push(p);
      }
    }
  }
  await walk(ROOT);
  return out;
}

async function lookupDict(word: string) {
  try {
    const res = await fetch(`${DICT_API}/${encodeURIComponent(word.toLowerCase())}`);
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{
      phonetics?: Array<{ text?: string }>;
      meanings?: Array<{ partOfSpeech?: string }>;
    }>;
    const entry = json[0];
    if (!entry) return null;
    const ipa = entry.phonetics?.find((p) => p.text)?.text ?? null;
    const pos = (entry.meanings ?? [])
      .map((m) => m.partOfSpeech)
      .filter((p): p is string => !!p);
    return { ipa, pos };
  } catch {
    return null;
  }
}

function normalizeIpa(s: string): string {
  return s.replace(/[/\[\]]/g, '').trim().toLowerCase();
}

async function checkCard(card: CardContent): Promise<CardIssue> {
  const out: CardIssue = { word: card.word, schema_ok: true, dict_found: false };
  const ref = await lookupDict(card.word);
  if (!ref) return out;
  out.dict_found = true;
  if (ref.ipa && card.ipa) {
    const a = normalizeIpa(ref.ipa);
    const b = normalizeIpa(card.ipa);
    if (a !== b && !a.includes(b) && !b.includes(a)) {
      out.ipa_mismatch = { json: card.ipa, dict: ref.ipa };
    }
  }
  if (ref.pos.length && !ref.pos.includes(card.pos)) {
    out.pos_mismatch = { json: card.pos, dict: ref.pos };
  }
  return out;
}

async function main() {
  const arg = process.argv[2];
  const files = await findLessonFiles(arg);
  console.log(`[validate] Found ${files.length} lesson file(s).`);

  const issues: LessonIssue[] = [];
  let totalCards = 0;
  let totalFlagged = 0;

  for (const file of files) {
    let lesson;
    try {
      lesson = lessonContentSchema.parse(JSON.parse(await readFile(file, 'utf8')));
    } catch (err) {
      console.error(`  ✗ ${relative(process.cwd(), file)} — schema FAIL: ${(err as Error).message}`);
      issues.push({
        file,
        cards: [{ word: '<schema>', schema_ok: false, dict_found: false }],
      });
      continue;
    }
    const cardIssues: CardIssue[] = [];
    for (const card of lesson.cards) {
      totalCards += 1;
      const r = await checkCard(card);
      // throttle to ~1 req / 800ms to be polite
      await new Promise((res) => setTimeout(res, 800));
      if (r.ipa_mismatch || r.pos_mismatch || !r.dict_found) {
        cardIssues.push(r);
        totalFlagged += 1;
      }
    }
    if (cardIssues.length) issues.push({ file, cards: cardIssues });
    console.log(
      `  ${cardIssues.length === 0 ? '✓' : '⚠'} ${relative(process.cwd(), file)} — ${lesson.cards.length} cards, ${cardIssues.length} flagged`
    );
  }

  // Write report
  const lines: string[] = [
    '# Content Validation Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Files scanned: ${files.length}`,
    `Cards scanned: ${totalCards}`,
    `Cards flagged: ${totalFlagged}`,
    '',
  ];
  for (const issue of issues) {
    lines.push(`## ${relative(process.cwd(), issue.file)}`);
    lines.push('');
    for (const c of issue.cards) {
      lines.push(`### \`${c.word}\``);
      if (!c.schema_ok) lines.push('- ❌ Schema failed');
      if (!c.dict_found) lines.push('- ⚠ Not found in dictionaryapi.dev');
      if (c.ipa_mismatch)
        lines.push(`- ⚠ IPA differs: JSON \`${c.ipa_mismatch.json}\` vs dict \`${c.ipa_mismatch.dict}\``);
      if (c.pos_mismatch)
        lines.push(`- ⚠ POS differs: JSON \`${c.pos_mismatch.json}\` vs dict ${c.pos_mismatch.dict.map((p) => `\`${p}\``).join(', ')}`);
      lines.push('');
    }
  }

  try {
    await stat(join(process.cwd(), 'docs'));
    await writeFile(REPORT_PATH, lines.join('\n'), 'utf8');
    console.log(`[validate] Report written to ${relative(process.cwd(), REPORT_PATH)}`);
  } catch {
    console.warn('[validate] docs/ not found — skipping report write.');
  }

  if (totalFlagged > 0) {
    console.log(`[validate] ⚠ ${totalFlagged} card(s) need manual review. See report.`);
  } else {
    console.log('[validate] ✓ All cards passed.');
  }
}

main().catch((err) => {
  console.error('[validate] Failed:', err);
  process.exit(1);
});
