'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, NotebookPen, PauseCircle, Pencil } from 'lucide-react';
import type { Card } from '@/lib/db/schema';
import type { UserCardMeta } from '@/features/vocab/queries';
import { cn } from '@/lib/utils/cn';

// CardEditForm bundles Input + Textarea + Button + lucide icons + server-action
// stub (~25 kB). Only shown after user clicks "Sửa" → defer until then.
const CardEditForm = dynamic(() => import('./card-edit-form').then((m) => m.CardEditForm), {
  loading: () => (
    <div className="h-64 animate-pulse border-t border-zinc-200 dark:border-zinc-800" />
  ),
});

type Definition = {
  meaning_en: string;
  meaning_vi: string;
  examples: Array<{ en: string; vi: string }>;
};

export function CardPreview({
  card,
  userMeta,
  isEditable = false,
}: {
  card: Card;
  userMeta?: UserCardMeta;
  isEditable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const definitions = (card.definitions as Definition[]) ?? [];
  const firstDef = definitions[0];

  return (
    <article
      className={cn(
        'rounded-lg border bg-white dark:bg-zinc-950',
        userMeta?.suspended
          ? 'border-amber-200 dark:border-amber-900/60'
          : 'border-zinc-200 dark:border-zinc-800'
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-semibold">{card.word}</span>
            {card.ipa && <span className="font-mono text-sm text-zinc-500">{card.ipa}</span>}
            {card.pos && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {card.pos}
              </span>
            )}
            {card.cefrLevel && (
              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
                {card.cefrLevel}
              </span>
            )}
            {userMeta?.hasNote && (
              <span
                className="inline-flex items-center gap-1 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-900 dark:bg-sky-900/30 dark:text-sky-200"
                title="Bạn có ghi chú cho thẻ này"
              >
                <NotebookPen className="h-2.5 w-2.5" />
                Note
              </span>
            )}
            {userMeta?.suspended && (
              <span
                className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
                title="Thẻ đang tạm dừng — bị ẩn khỏi queue ôn tập"
              >
                <PauseCircle className="h-2.5 w-2.5" />
                Tạm dừng
              </span>
            )}
          </div>
          {firstDef && (
            <p className="mt-1 line-clamp-1 text-sm text-zinc-600 dark:text-zinc-400">
              {firstDef.meaning_vi}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-zinc-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && editing && isEditable && (
        <CardEditForm
          card={card}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      )}

      {open && !editing && (
        <div className="space-y-4 border-t border-zinc-200 px-4 pt-3 pb-4 text-sm dark:border-zinc-800">
          {isEditable && (
            <div className="-mt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                <Pencil className="h-3 w-3" />
                Sửa
              </button>
            </div>
          )}
          {definitions.map((def, i) => (
            <div key={i}>
              <div className="text-zinc-900 dark:text-zinc-100">{def.meaning_en}</div>
              <div className="mt-0.5 text-zinc-600 dark:text-zinc-400">{def.meaning_vi}</div>
              <ul className="mt-2 space-y-1.5 text-xs">
                {def.examples.map((ex, j) => (
                  <li key={j} className="border-l-2 border-zinc-200 pl-3 dark:border-zinc-800">
                    <div>{ex.en}</div>
                    <div className="text-zinc-500">{ex.vi}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {(card.synonyms?.length || card.antonyms?.length || card.collocations?.length) && (
            <div className="space-y-1 text-xs text-zinc-500">
              {card.synonyms && card.synonyms.length > 0 && (
                <div>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Đồng nghĩa:</span>{' '}
                  {card.synonyms.join(', ')}
                </div>
              )}
              {card.antonyms && card.antonyms.length > 0 && (
                <div>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Trái nghĩa:</span>{' '}
                  {card.antonyms.join(', ')}
                </div>
              )}
              {card.collocations && card.collocations.length > 0 && (
                <div>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Cụm thường gặp:
                  </span>{' '}
                  {card.collocations.join(', ')}
                </div>
              )}
            </div>
          )}

          {card.mnemonicVi && (
            <div className="rounded bg-amber-50/60 px-3 py-2 text-xs text-amber-950 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-900/50">
              <span className="font-medium">Mẹo nhớ:</span> {card.mnemonicVi}
            </div>
          )}

          {card.etymologyHint && (
            <div className="text-xs text-zinc-500 italic">{card.etymologyHint}</div>
          )}
        </div>
      )}
    </article>
  );
}
