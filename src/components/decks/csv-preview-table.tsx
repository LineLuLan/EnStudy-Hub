'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CardContent } from '@/features/vocab/content-schema';
import type { RowError } from '@/features/vocab/csv-schema';

const FILE_LEVEL_ROW = 0;

export function CsvPreviewTable({
  rows,
  rowErrors,
  maxRows = 50,
}: {
  rows: CardContent[];
  rowErrors: RowError[];
  maxRows?: number;
}) {
  const fileLevel = rowErrors.filter((e) => e.row === FILE_LEVEL_ROW);
  const rowLevel = rowErrors.filter((e) => e.row !== FILE_LEVEL_ROW);
  const errorRowSet = new Set(rowLevel.map((e) => e.row));
  const errorByRow = new Map<number, RowError[]>();
  for (const err of rowLevel) {
    const arr = errorByRow.get(err.row) ?? [];
    arr.push(err);
    errorByRow.set(err.row, arr);
  }

  const visibleRows = rows.slice(0, maxRows);
  const truncated = rows.length > maxRows;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {rows.length} thẻ hợp lệ
        </span>
        {rowErrors.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 font-medium text-red-900 dark:bg-red-950/40 dark:text-red-200">
            <AlertCircle className="h-3.5 w-3.5" />
            {rowErrors.length} lỗi
          </span>
        )}
      </div>

      {fileLevel.length > 0 && (
        <ul className="space-y-1 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {fileLevel.map((err, i) => (
            <li key={i}>
              <span className="font-mono font-semibold">{err.field}:</span> {err.message}
            </li>
          ))}
        </ul>
      )}

      {rowLevel.length > 0 && (
        <details className="rounded-md border border-red-200 bg-red-50/60 text-xs dark:border-red-900/60 dark:bg-red-950/30">
          <summary className="cursor-pointer px-3 py-2 font-medium text-red-900 dark:text-red-200">
            Chi tiết {rowLevel.length} lỗi theo dòng
          </summary>
          <ul className="max-h-48 space-y-1 overflow-auto border-t border-red-200 px-3 py-2 dark:border-red-900/60">
            {rowLevel.slice(0, 100).map((err, i) => (
              <li key={i} className="font-mono text-[11px] text-red-900 dark:text-red-200">
                Dòng {err.row} · {err.field}: {err.message}
              </li>
            ))}
            {rowLevel.length > 100 && (
              <li className="text-[11px] text-red-700 dark:text-red-300">
                … và {rowLevel.length - 100} lỗi khác
              </li>
            )}
          </ul>
        </details>
      )}

      {rows.length > 0 && (
        <div className="max-h-[420px] overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-zinc-50 text-left text-[11px] tracking-wide text-zinc-500 uppercase dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Word</th>
                <th className="px-3 py-2">POS</th>
                <th className="px-3 py-2">CEFR</th>
                <th className="px-3 py-2">Nghĩa VI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {visibleRows.map((row, idx) => {
                const lineNo = idx + 2;
                const hasErr = errorRowSet.has(lineNo);
                return (
                  <tr
                    key={idx}
                    className={
                      hasErr
                        ? 'bg-red-50/60 dark:bg-red-950/20'
                        : 'odd:bg-white even:bg-zinc-50/50 dark:odd:bg-zinc-950 dark:even:bg-zinc-900/40'
                    }
                  >
                    <td className="px-3 py-1.5 text-zinc-400">{lineNo}</td>
                    <td className="px-3 py-1.5 font-mono font-medium">{row.word}</td>
                    <td className="px-3 py-1.5 text-zinc-600 dark:text-zinc-400">{row.pos}</td>
                    <td className="px-3 py-1.5 text-zinc-600 dark:text-zinc-400">{row.cefr}</td>
                    <td className="px-3 py-1.5 text-zinc-700 dark:text-zinc-300">
                      {row.definitions[0]?.meaning_vi}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {truncated && (
            <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              Hiển thị {maxRows} / {rows.length} thẻ — còn {rows.length - maxRows} thẻ ẩn
            </div>
          )}
        </div>
      )}
    </div>
  );
}
