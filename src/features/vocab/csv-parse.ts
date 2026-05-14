import Papa from 'papaparse';
import {
  csvRowSchema,
  csvRowToCardContent,
  REQUIRED_CSV_HEADERS,
  MAX_CSV_ROWS,
  type CsvRow,
  type RowError,
} from './csv-schema';
import type { CardContent } from './content-schema';

export type ParseResult = {
  rows: CardContent[];
  rowErrors: RowError[];
  totalRows: number;
};

export function parseCsvRows(text: string): ParseResult {
  const cleaned = text.replace(/^﻿/, '');
  const parsed = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const rowErrors: RowError[] = [];
  const headers = (parsed.meta?.fields ?? []).map((h) => h.trim().toLowerCase());
  for (const req of REQUIRED_CSV_HEADERS) {
    if (!headers.includes(req)) {
      rowErrors.push({ row: 0, field: req, message: `Thiếu cột bắt buộc "${req}"` });
    }
  }
  for (const err of parsed.errors ?? []) {
    rowErrors.push({
      row: (err.row ?? 0) + 2,
      field: '__row__',
      message: err.message,
    });
  }

  if (rowErrors.length > 0) {
    return { rows: [], rowErrors, totalRows: 0 };
  }

  const dataRows = parsed.data ?? [];
  if (dataRows.length === 0) {
    return {
      rows: [],
      rowErrors: [{ row: 0, field: '__file__', message: 'CSV không có dữ liệu' }],
      totalRows: 0,
    };
  }
  if (dataRows.length > MAX_CSV_ROWS) {
    return {
      rows: [],
      rowErrors: [
        {
          row: 0,
          field: '__file__',
          message: `Tối đa ${MAX_CSV_ROWS} thẻ, file có ${dataRows.length}`,
        },
      ],
      totalRows: dataRows.length,
    };
  }

  const validRows: CsvRow[] = [];
  const seenWords = new Set<string>();

  for (let i = 0; i < dataRows.length; i++) {
    const raw = dataRows[i];
    const lineNo = i + 2;
    const parsedRow = csvRowSchema.safeParse(raw);
    if (!parsedRow.success) {
      for (const issue of parsedRow.error.issues) {
        rowErrors.push({
          row: lineNo,
          field: String(issue.path[0] ?? '__row__'),
          message: issue.message,
        });
      }
      continue;
    }
    const word = parsedRow.data.word;
    if (seenWords.has(word)) {
      rowErrors.push({
        row: lineNo,
        field: 'word',
        message: `Từ trùng lặp trong file: "${word}"`,
      });
      continue;
    }
    seenWords.add(word);
    validRows.push(parsedRow.data);
  }

  return {
    rows: validRows.map(csvRowToCardContent),
    rowErrors,
    totalRows: dataRows.length,
  };
}
