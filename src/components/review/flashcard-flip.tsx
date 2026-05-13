'use client';

import { motion } from 'framer-motion';
import type { ReviewQueueItem } from '@/features/srs/queue';

type Definition = {
  meaning_en: string;
  meaning_vi: string;
  examples: Array<{ en: string; vi: string }>;
};

export function FlashcardFlip({
  item,
  flipped,
  onFlip,
}: {
  item: ReviewQueueItem;
  flipped: boolean;
  onFlip: () => void;
}) {
  const card = item.card;
  const defs = (card.definitions as Definition[]) ?? [];
  const firstDef = defs[0];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onFlip();
      }}
      className="block w-full cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      style={{ perspective: '1200px' }}
    >
      <motion.div
        className="relative w-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ transformStyle: 'preserve-3d', minHeight: 320 }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {card.word}
          </span>
          {card.ipa && <span className="font-mono text-base text-zinc-500">{card.ipa}</span>}
          {card.pos && (
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {card.pos}
            </span>
          )}
          <p className="mt-6 text-xs text-zinc-500">Bấm Space hoặc click để lật</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 overflow-auto rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight">{card.word}</span>
            {card.ipa && <span className="font-mono text-sm text-zinc-500">{card.ipa}</span>}
            {card.cefrLevel && (
              <span className="ml-auto rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
                {card.cefrLevel}
              </span>
            )}
          </div>

          {firstDef && (
            <div className="mt-4 space-y-2 text-sm">
              <div className="text-zinc-900 dark:text-zinc-100">{firstDef.meaning_en}</div>
              <div className="text-zinc-600 dark:text-zinc-400">{firstDef.meaning_vi}</div>
              {firstDef.examples[0] && (
                <div className="mt-2 border-l-2 border-zinc-200 pl-3 text-xs dark:border-zinc-800">
                  <div className="text-zinc-700 dark:text-zinc-300">{firstDef.examples[0].en}</div>
                  <div className="text-zinc-500">{firstDef.examples[0].vi}</div>
                </div>
              )}
            </div>
          )}

          {card.mnemonicVi && (
            <div className="mt-4 rounded bg-amber-50/60 px-3 py-2 text-xs text-amber-950 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-900/50">
              <span className="font-medium">Mẹo nhớ:</span> {card.mnemonicVi}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
