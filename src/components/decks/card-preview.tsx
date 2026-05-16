'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2, ChevronDown, NotebookPen, Pencil, Volume2 } from 'lucide-react';
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

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Highlight target word(s) in EN example sentences. Matches both card.word and
// card.lemma (incl. multi-word phrasal verbs like "lead to") with word
// boundaries, case-insensitive. Other tokens render as plain spans.
function highlightWord(text: string, word: string, lemma?: string | null) {
  const targets = Array.from(new Set([word, lemma].filter(Boolean) as string[]))
    .filter((t) => t.trim().length > 0)
    .map(escapeRegex);
  if (targets.length === 0) return <>{text}</>;
  // Capturing group → split() interleaves matches at odd indices,
  // non-matches at even indices.
  const pattern = new RegExp(`\\b(${targets.join('|')})\\b`, 'gi');
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-[var(--accent)]">
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    // Firefox / older browsers may throw if voices haven't loaded — silent fail.
  }
}

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
  const [ttsSupported, setTtsSupported] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  // Defer Web Speech API capability check to after hydration to avoid SSR mismatch.
  useEffect(() => {
    setTtsSupported('speechSynthesis' in window);
  }, []);

  // Smooth scroll + focus the article into view when it opens. Wait one frame so
  // the expanded content has rendered before scrolling, otherwise we scroll to
  // the closed (small) position.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const definitions = (card.definitions as Definition[]) ?? [];
  const firstDef = definitions[0];

  return (
    <article
      ref={articleRef}
      className={cn(
        'rounded-lg border bg-white transition-all duration-300 dark:bg-zinc-950',
        userMeta?.suspended
          ? 'border-[var(--accent)]/30 dark:border-[var(--accent)]/40'
          : 'border-zinc-200 dark:border-zinc-800',
        !open &&
          'hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm dark:hover:border-zinc-700',
        open &&
          'scale-[1.01] border-[var(--accent)]/40 shadow-[var(--accent)]/10 shadow-lg ring-2 ring-[var(--accent)]/30'
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
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {card.word}
            </span>
            {card.ipa && <span className="font-mono text-sm text-zinc-500">{card.ipa}</span>}
            {ttsSupported && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  speak(card.word);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    speak(card.word);
                  }
                }}
                className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-[var(--accent)] dark:hover:bg-zinc-900"
                aria-label={`Phát âm ${card.word}`}
                title="Phát âm"
              >
                <Volume2 className="h-3.5 w-3.5" />
              </span>
            )}
            {card.pos && (
              <span className="rounded-md bg-white/60 px-2 py-0.5 text-[10px] font-medium text-zinc-700 ring-1 ring-zinc-200/60 backdrop-blur-sm dark:bg-black/30 dark:text-zinc-300 dark:ring-zinc-800/60">
                {card.pos}
              </span>
            )}
            {card.cefrLevel && (
              <span className="rounded-md bg-[var(--accent-soft)]/60 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)] ring-1 ring-[var(--accent)]/30 backdrop-blur-sm">
                {card.cefrLevel}
              </span>
            )}
            {userMeta?.hasNote && (
              <span
                className="inline-flex items-center gap-1 rounded-md bg-white/60 px-2 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-sky-200/60 backdrop-blur-sm dark:bg-black/30 dark:text-sky-300 dark:ring-sky-900/40"
                title="Bạn có ghi chú cho thẻ này"
              >
                <NotebookPen className="h-2.5 w-2.5" />
                Ghi chú
              </span>
            )}
            {userMeta?.suspended && (
              <span
                className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)]/60 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)] ring-1 ring-[var(--accent)]/30 backdrop-blur-sm"
                title="Bạn đã đánh dấu thẻ này đã thuộc — ẩn khỏi queue ôn tập"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                Đã thuộc
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
        <div className="divide-y divide-zinc-100 border-t border-zinc-200 text-sm dark:divide-zinc-900 dark:border-zinc-800">
          {isEditable && (
            <div className="flex justify-end px-4 pt-3">
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

          <div className="space-y-3 px-4 py-3">
            {definitions.map((def, i) => (
              <div key={i}>
                <div className="text-zinc-900 dark:text-zinc-100">{def.meaning_en}</div>
                <div className="mt-0.5 text-zinc-600 dark:text-zinc-400">{def.meaning_vi}</div>
                {def.examples.length > 0 && (
                  <ul className="mt-2 space-y-1.5 text-xs">
                    {def.examples.map((ex, j) => (
                      <li
                        key={j}
                        className="border-l-2 border-[var(--accent)]/30 pl-3 dark:border-[var(--accent)]/40"
                      >
                        <div className="text-zinc-900 dark:text-zinc-50">
                          {highlightWord(ex.en, card.word, card.lemma)}
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-500 italic dark:text-zinc-400">
                          {ex.vi}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {(card.synonyms?.length || card.antonyms?.length || card.collocations?.length) && (
            <div className="space-y-1 px-4 py-3 text-xs text-zinc-500">
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
            <div className="px-4 py-3">
              <div className="relative rounded-lg border border-dashed border-[var(--highlight)]/60 bg-gradient-to-br from-[var(--highlight)]/10 to-[var(--accent-soft)]/30 px-3 py-2.5 text-xs">
                <div className="absolute -top-2 left-3 bg-white px-1.5 text-[10px] font-semibold text-[var(--accent)] dark:bg-zinc-950">
                  💡 Mẹo nhớ
                </div>
                <div className="mt-1 text-zinc-700 dark:text-zinc-200">{card.mnemonicVi}</div>
              </div>
            </div>
          )}

          {card.etymologyHint && (
            <div className="px-4 py-3 text-xs text-zinc-500 italic dark:text-zinc-400">
              {card.etymologyHint}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
