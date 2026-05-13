'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Rating, type Grade } from 'ts-fsrs';
import type { ReviewQueueItem } from '@/features/srs/queue';
import { assembleMcqChoices, type McqChoice } from './mcq-utils';
import { speakWord } from './cloze-utils';

type Definition = {
  meaning_en: string;
  meaning_vi: string;
  examples: Array<{ en: string; vi: string }>;
};

const FEEDBACK_MS = 900;

export function MCQCard({
  item,
  onGrade,
  pending,
}: {
  item: ReviewQueueItem;
  onGrade: (grade: Grade) => void;
  pending: boolean;
}) {
  const { card, distractorPool } = item;
  const definitions = (card.definitions as Definition[]) ?? [];
  const correct = definitions[0]?.meaning_vi?.trim() ?? '(thiếu nghĩa)';

  // Stable per-card: assemble choices once on mount; resets when card id changes.
  const { choices, correctIndex } = useMemo(
    () => assembleMcqChoices(correct, distractorPool),
    [card.id, correct, distractorPool] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const submittedRef = useRef(false);

  const handlePick = useCallback(
    (index: number) => {
      if (submittedRef.current) return;
      if (pending) return;
      if (selectedIndex !== null) return;
      setSelectedIndex(index);
      const isCorrect = index === correctIndex;
      // Give the user a beat to see the right answer flash before advancing.
      window.setTimeout(() => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        onGrade(isCorrect ? Rating.Good : Rating.Again);
      }, FEEDBACK_MS);
    },
    [pending, selectedIndex, correctIndex, onGrade]
  );

  // Keyboard: 1-4 picks; ignore when an input/textarea has focus.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!['1', '2', '3', '4'].includes(e.key)) return;
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < choices.length) {
        e.preventDefault();
        handlePick(idx);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choices.length, handlePick]);

  // Cleanup speechSynthesis on unmount (mirrors cloze-card).
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* silent */
        }
      }
    };
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {card.word}
          </span>
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
          <button
            type="button"
            onClick={() => speakWord(card.word)}
            className="ml-auto rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            title="Phát âm"
            aria-label="Phát âm"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Nghĩa nào đúng với từ này?</p>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {choices.map((choice, index) => (
            <ChoiceButton
              key={`${card.id}-${index}-${choice.text}`}
              choice={choice}
              index={index}
              selectedIndex={selectedIndex}
              correctIndex={correctIndex}
              disabled={pending || selectedIndex !== null}
              onPick={handlePick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChoiceButton({
  choice,
  index,
  selectedIndex,
  correctIndex,
  disabled,
  onPick,
}: {
  choice: McqChoice;
  index: number;
  selectedIndex: number | null;
  correctIndex: number;
  disabled: boolean;
  onPick: (index: number) => void;
}) {
  const isSelected = selectedIndex === index;
  const isCorrect = index === correctIndex;
  const revealed = selectedIndex !== null;

  let tone =
    'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900';
  if (revealed) {
    if (isCorrect) {
      tone =
        'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100';
    } else if (isSelected) {
      tone =
        'border-red-300 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-100';
    } else {
      tone =
        'border-zinc-200 bg-white text-zinc-400 opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500';
    }
  }

  return (
    <motion.button
      type="button"
      onClick={() => onPick(index)}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      className={`flex min-h-[3rem] items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed ${tone}`}
    >
      <span className="flex-1 pr-3 leading-snug">{choice.text}</span>
      <kbd className="ml-2 rounded border border-zinc-300 px-1 font-mono text-[10px] text-zinc-500 dark:border-zinc-700">
        {index + 1}
      </kbd>
    </motion.button>
  );
}
