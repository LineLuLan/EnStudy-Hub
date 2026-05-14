import { describe, expect, it } from 'vitest';
import { parseCsvRows } from './csv-parse';
import { csvRowSchema, csvImportInputSchema, csvRowToCardContent, slugify } from './csv-schema';

const HEADER = 'word,ipa,pos,cefr,meaning_vi,meaning_en,example_en,example_vi,mnemonic_vi';
const VALID_ROW =
  'breakfast,ˈbrek.fəst,noun,A1,bữa sáng,The first meal of the day,I eat breakfast at 7am.,Tôi ăn sáng lúc 7 giờ.,';

describe('csvRowSchema', () => {
  it('parses a valid row and maps short POS aliases', () => {
    const parsed = csvRowSchema.parse({
      word: 'happy',
      ipa: 'ˈhæp.i',
      pos: 'adj',
      cefr: 'a2',
      meaning_vi: 'vui vẻ',
      meaning_en: 'feeling pleasure',
      example_en: 'She looks happy.',
      example_vi: 'Cô ấy trông vui vẻ.',
    });
    expect(parsed.pos).toBe('adjective');
    expect(parsed.cefr).toBe('A2');
    expect(parsed.word).toBe('happy');
    expect(parsed.mnemonic_vi).toBeUndefined();
  });

  it('rejects invalid pos', () => {
    const result = csvRowSchema.safeParse({
      word: 'x',
      ipa: 'x',
      pos: 'nonsense',
      cefr: 'A1',
      meaning_vi: 'x',
      meaning_en: 'x',
      example_en: 'x',
      example_vi: 'x',
    });
    expect(result.success).toBe(false);
  });

  it('rejects word with digits', () => {
    const result = csvRowSchema.safeParse({
      word: '123abc',
      ipa: 'x',
      pos: 'noun',
      cefr: 'A1',
      meaning_vi: 'x',
      meaning_en: 'x',
      example_en: 'x',
      example_vi: 'x',
    });
    expect(result.success).toBe(false);
  });
});

describe('csvRowToCardContent', () => {
  it('wraps row data into one definition + one example pair', () => {
    const row = csvRowSchema.parse({
      word: 'food',
      ipa: 'fuːd',
      pos: 'noun',
      cefr: 'A1',
      meaning_vi: 'thức ăn',
      meaning_en: 'edible substance',
      example_en: 'I love food.',
      example_vi: 'Tôi yêu thức ăn.',
      mnemonic_vi: 'FOOD = phở ốc',
    });
    const card = csvRowToCardContent(row);
    expect(card.definitions).toHaveLength(1);
    const def = card.definitions[0]!;
    expect(def.examples).toHaveLength(1);
    expect(def.examples[0]).toEqual({
      en: 'I love food.',
      vi: 'Tôi yêu thức ăn.',
    });
    expect(card.mnemonic_vi).toBe('FOOD = phở ốc');
    expect(card.synonyms).toEqual([]);
  });
});

describe('parseCsvRows', () => {
  it('parses a clean 2-row CSV', () => {
    const csv = `${HEADER}\n${VALID_ROW}\nlunch,lʌnʧ,noun,A1,bữa trưa,The midday meal,We had lunch.,Chúng tôi ăn trưa.,`;
    const result = parseCsvRows(csv);
    expect(result.rowErrors).toEqual([]);
    expect(result.rows).toHaveLength(2);
    expect(result.totalRows).toBe(2);
  });

  it('handles UTF-8 BOM at start', () => {
    const csv = `﻿${HEADER}\n${VALID_ROW}`;
    const result = parseCsvRows(csv);
    expect(result.rowErrors).toEqual([]);
    expect(result.rows).toHaveLength(1);
  });

  it('handles quoted cells containing commas', () => {
    const csv = `${HEADER}\nplus,plʌs,prep,A2,"cộng, thêm","added to","2 plus 2, equals 4.","2 cộng 2, bằng 4.",`;
    const result = parseCsvRows(csv);
    expect(result.rowErrors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]!.definitions[0]!.meaning_vi).toBe('cộng, thêm');
  });

  it('flags missing required header', () => {
    const csv = `word,ipa,pos,cefr,meaning_vi,meaning_en,example_en,mnemonic_vi\nx,x,noun,A1,x,x,x,x`;
    const result = parseCsvRows(csv);
    expect(result.rowErrors.some((e) => e.field === 'example_vi')).toBe(true);
  });

  it('detects duplicate words within file', () => {
    const csv = `${HEADER}\n${VALID_ROW}\nbreakfast,ˈbrek.fəst,noun,A1,bữa sáng,first meal,I eat.,Tôi ăn.,`;
    const result = parseCsvRows(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.rowErrors.some((e) => e.message.includes('trùng'))).toBe(true);
  });

  it('rejects an empty CSV', () => {
    const result = parseCsvRows(HEADER);
    expect(result.rows).toEqual([]);
    expect(result.rowErrors.length).toBeGreaterThan(0);
  });

  it('rejects oversize CSV (>200 rows)', () => {
    const rows = Array.from(
      { length: 201 },
      (_, i) => `word${i.toString().padStart(3, 'a')},ipa,noun,A1,vi,en,example en,example vi,`
    );
    const csv = `${HEADER}\n${rows.join('\n')}`;
    const result = parseCsvRows(csv);
    expect(result.rowErrors.some((e) => e.message.includes('Tối đa 200'))).toBe(true);
  });

  it('aggregates per-row errors with correct line numbers', () => {
    const csv = `${HEADER}\n${VALID_ROW}\nbad,xx,nonsense,XX,x,x,x,x,`;
    const result = parseCsvRows(csv);
    const row3Errors = result.rowErrors.filter((e) => e.row === 3);
    expect(row3Errors.length).toBeGreaterThan(0);
    expect(result.rows).toHaveLength(1);
  });
});

describe('csvImportInputSchema', () => {
  it('rejects slug with leading hyphen', () => {
    const result = csvImportInputSchema.safeParse({
      lessonName: 'Test',
      lessonSlug: '-bad',
      csvText: 'x',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase', () => {
    const result = csvImportInputSchema.safeParse({
      lessonName: 'Test',
      lessonSlug: 'Bad-Slug',
      csvText: 'x',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a clean slug', () => {
    const result = csvImportInputSchema.safeParse({
      lessonName: 'Daily Words',
      lessonSlug: 'daily-words',
      csvText: 'x',
    });
    expect(result.success).toBe(true);
  });
});

describe('slugify', () => {
  it('strips diacritics + spaces + lowercases', () => {
    expect(slugify('Bài học Tiếng Anh')).toBe('bai-hoc-tieng-anh');
  });

  it('collapses non-alphanumeric runs', () => {
    expect(slugify('Hello! World @ 2026')).toBe('hello-world-2026');
  });

  it('trims trailing hyphens', () => {
    expect(slugify('---trim---')).toBe('trim');
  });

  it('caps length at 40 chars', () => {
    expect(slugify('a'.repeat(80)).length).toBeLessThanOrEqual(40);
  });
});
