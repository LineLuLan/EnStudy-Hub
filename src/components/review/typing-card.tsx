'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eraser, Lightbulb, Volume2, X } from 'lucide-react';
import { Rating, type Grade } from 'ts-fsrs';
import { Button } from '@/components/ui/button';
import type { ReviewQueueItem } from '@/features/srs/queue';
import { gradeFromCloze, speakWord, type MaskSlot } from './cloze-utils';

type Definition = {
  meaning_en: string;
  meaning_vi: string;
  examples: Array<{ en: string; vi: string }>;
};

type Phase = 'typing' | 'unlocked';

const AUTO_SUBMIT_MS = 2000;

const RATING_META: Array<{
  grade: Grade;
  label: string;
  kbd: string;
  tone: string;
  activeTone: string;
}> = [
  {
    grade: Rating.Again,
    label: 'Again',
    kbd: '1',
    tone: 'border-red-200 text-red-700 dark:border-red-900/50 dark:text-red-300',
    activeTone: 'bg-red-50 ring-1 ring-red-300 dark:bg-red-950/40 dark:ring-red-700/60',
  },
  {
    grade: Rating.Hard,
    label: 'Hard',
    kbd: '2',
    tone: 'border-amber-200 text-amber-700 dark:border-amber-900/50 dark:text-amber-300',
    activeTone: 'bg-amber-50 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:ring-amber-700/60',
  },
  {
    grade: Rating.Good,
    label: 'Good',
    kbd: '3',
    tone: 'border-emerald-200 text-emerald-700 dark:border-emerald-900/50 dark:text-emerald-300',
    activeTone:
      'bg-emerald-50 ring-1 ring-emerald-300 dark:bg-emerald-950/40 dark:ring-emerald-700/60',
  },
  {
    grade: Rating.Easy,
    label: 'Easy',
    kbd: '4',
    tone: 'border-sky-200 text-sky-700 dark:border-sky-900/50 dark:text-sky-300',
    activeTone: 'bg-sky-50 ring-1 ring-sky-300 dark:bg-sky-950/40 dark:ring-sky-700/60',
  },
];

function isLetter(ch: string | undefined): boolean {
  return typeof ch === 'string' && /^[a-z]$/i.test(ch);
}

/**
 * Build a full-hidden mask for the word — every letter starts hidden because
 * the only cue is the definition (no sentence context to lean on like Cloze).
 * Non-letter characters (apostrophe, hyphen, space) remain visible so the user
 * can see the word's shape.
 */
function fullHiddenMask(word: string): MaskSlot[] {
  return Array.from(word.toLowerCase()).map((ch) => ({
    char: ch,
    hidden: /^[a-z]$/i.test(ch),
  }));
}

export function TypingCard({
  item,
  onGrade,
  pending,
}: {
  item: ReviewQueueItem;
  onGrade: (grade: Grade) => void;
  pending: boolean;
}) {
  const card = item.card;
  const word = card.word;
  const wordLower = useMemo(() => word.toLowerCase(), [word]);
  const mask = useMemo(() => fullHiddenMask(word), [word]);

  const definitions = (card.definitions as Definition[]) ?? [];
  const firstDef = definitions[0];
  const extraExamples = useMemo(() => (firstDef?.examples ?? []).slice(0, 2), [firstDef]);

  const [phase, setPhase] = useState<Phase>('typing');
  const [input, setInput] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const mountedAtRef = useRef(Date.now());
  const submittedRef = useRef(false);

  const derivedGrade = useMemo(
    () =>
      gradeFromCloze({
        hintsUsed,
        mistakes,
        durationMs: Date.now() - mountedAtRef.current,
        gaveUp,
      }),
    [hintsUsed, mistakes, gaveUp]
  );

  const submit = useCallback(
    (grade: Grade) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      onGrade(grade);
    },
    [onGrade]
  );

  const unlock = useCallback(
    (gave: boolean) => {
      if (phase === 'unlocked') return;
      setGaveUp(gave);
      setPhase('unlocked');
      speakWord(word);
    },
    [phase, word]
  );

  useEffect(() => {
    if (phase !== 'unlocked') return;
    const t = setTimeout(() => {
      const grade = gradeFromCloze({
        hintsUsed,
        mistakes,
        durationMs: Date.now() - mountedAtRef.current,
        gaveUp,
      });
      submit(grade);
    }, AUTO_SUBMIT_MS);
    return () => clearTimeout(t);
  }, [phase, hintsUsed, mistakes, gaveUp, submit]);

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

  const appendNextChar = useCallback(
    (nextInput: string) => {
      setInput(nextInput);
      if (nextInput === wordLower) {
        unlock(false);
      }
    },
    [wordLower, unlock]
  );

  const revealHint = useCallback(() => {
    if (phase !== 'typing') return;
    let next = input;
    let pos = input.length;
    while (pos < wordLower.length) {
      const ch = wordLower[pos];
      if (ch === undefined || isLetter(ch)) break;
      next += ch;
      pos += 1;
    }
    const hintCh = wordLower[pos];
    if (hintCh !== undefined) {
      next += hintCh;
      setHintsUsed((h) => h + 1);
    }
    appendNextChar(next);
  }, [phase, input, wordLower, appendNextChar]);

  const giveUp = useCallback(() => {
    if (phase !== 'typing') return;
    unlock(true);
  }, [phase, unlock]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (phase === 'typing') {
        if (e.key === 'Escape') {
          e.preventDefault();
          giveUp();
          return;
        }
        if (e.key === '?') {
          e.preventDefault();
          revealHint();
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          setInput((s) => s.slice(0, -1));
          return;
        }
        if (e.key.length === 1 && isLetter(e.key)) {
          e.preventDefault();
          let next = input;
          let pos = input.length;
          while (pos < wordLower.length) {
            const ch = wordLower[pos];
            if (ch === undefined || isLetter(ch)) break;
            next += ch;
            pos += 1;
          }
          const expected = wordLower[pos];
          if (expected === undefined) return;
          if (e.key.toLowerCase() === expected) {
            next += expected;
            appendNextChar(next);
          } else {
            setMistakes((m) => m + 1);
            setShakeKey((k) => k + 1);
          }
          return;
        }
        return;
      }

      // phase === 'unlocked'
      if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        submit(Number(e.key) as Grade);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        submit(derivedGrade);
        return;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, input, wordLower, derivedGrade, appendNextChar, submit, revealHint, giveUp]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        {/* Definition prompt */}
        <div className="text-center">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Nghĩa tiếng Việt
          </div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {firstDef?.meaning_vi ?? '(thiếu nghĩa)'}
          </div>
          {firstDef?.meaning_en && (
            <div className="mt-1 text-xs text-zinc-500 italic dark:text-zinc-400">
              {firstDef.meaning_en}
            </div>
          )}
          {card.pos && (
            <div className="mt-2 inline-flex items-center gap-2">
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {card.pos}
              </span>
              {card.cefrLevel && (
                <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
                  {card.cefrLevel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Input slots */}
        <div className="mt-6 flex justify-center">
          <motion.div
            key={shakeKey}
            animate={shakeKey ? { x: [-4, 4, -4, 4, 0] } : undefined}
            transition={{ duration: 0.3 }}
          >
            <TypingSlots
              mask={mask}
              input={input}
              phase={phase}
              hasMistake={shakeKey > 0 && phase === 'typing'}
            />
          </motion.div>
        </div>

        {/* Action row (typing phase) */}
        {phase === 'typing' && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={revealHint}
              disabled={pending}
              className="gap-1.5"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Hint
              <kbd className="ml-1 rounded border px-1 font-mono text-[10px] opacity-70">?</kbd>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={giveUp}
              disabled={pending}
              className="gap-1.5 text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
              Bỏ qua
              <kbd className="ml-1 rounded border px-1 font-mono text-[10px] opacity-70">Esc</kbd>
            </Button>
            {input.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setInput((s) => s.slice(0, -1))}
                disabled={pending}
                className="gap-1.5 text-zinc-500"
              >
                <Eraser className="h-3.5 w-3.5" />
                Xóa
                <kbd className="ml-1 rounded border px-1 font-mono text-[10px] opacity-70">⌫</kbd>
              </Button>
            )}
            <span className="ml-auto text-xs text-zinc-400 tabular-nums">
              {input.length}/{word.length}
              {(hintsUsed > 0 || mistakes > 0) && (
                <>
                  {' · '}
                  {hintsUsed > 0 && <span>hint {hintsUsed}</span>}
                  {hintsUsed > 0 && mistakes > 0 && ' · '}
                  {mistakes > 0 && <span className="text-red-500">sai {mistakes}</span>}
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Reveal panel */}
      <AnimatePresence>
        {phase === 'unlocked' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-xl border border-sky-200/60 bg-white/70 p-5 ring-1 ring-sky-100 backdrop-blur dark:border-sky-900/40 dark:bg-zinc-950/70 dark:ring-sky-900/40"
            style={{ boxShadow: '0 0 24px rgba(56, 189, 248, 0.18)' }}
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {word}
              </span>
              {card.ipa && <span className="font-mono text-sm text-zinc-500">{card.ipa}</span>}
              <button
                type="button"
                onClick={() => speakWord(word)}
                className="ml-auto rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                title="Phát âm"
                aria-label="Phát âm"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>

            {extraExamples.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-xs">
                {extraExamples.map((ex, i) => (
                  <li key={i} className="border-l-2 border-sky-200/60 pl-3 dark:border-sky-800/60">
                    <div className="text-zinc-700 dark:text-zinc-300">{ex.en}</div>
                    <div className="text-zinc-500">{ex.vi}</div>
                  </li>
                ))}
              </ul>
            )}

            {card.mnemonicVi && (
              <div className="mt-3 rounded bg-amber-50/60 px-3 py-2 text-xs text-amber-950 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-900/50">
                <span className="font-medium">Mẹo nhớ:</span> {card.mnemonicVi}
              </div>
            )}

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: AUTO_SUBMIT_MS / 1000, ease: 'linear' }}
                className="h-full bg-sky-400"
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
              <span>
                Tự chấm{' '}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {RATING_META.find((r) => r.grade === derivedGrade)?.label}
                </span>{' '}
                trong 2s · bấm 1-4 để override
              </span>
              {gaveUp && <span className="text-amber-600 dark:text-amber-400">đã bỏ qua</span>}
            </div>

            <div className="mt-2 grid grid-cols-4 gap-2">
              {RATING_META.map(({ grade, label, kbd, tone, activeTone }) => {
                const isDerived = grade === derivedGrade;
                return (
                  <button
                    key={grade}
                    type="button"
                    disabled={pending}
                    onClick={() => submit(grade)}
                    className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded-md border transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-900 ${tone} ${
                      isDerived ? activeTone : ''
                    }`}
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <kbd className="font-mono text-[10px] opacity-70">{kbd}</kbd>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TypingSlots({
  mask,
  input,
  phase,
  hasMistake,
}: {
  mask: MaskSlot[];
  input: string;
  phase: Phase;
  hasMistake: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-[3px] rounded-md bg-zinc-50 px-3 py-2 font-mono text-xl ring-1 ring-zinc-200 dark:bg-zinc-900/60 dark:ring-zinc-800">
      <span className="text-zinc-400">[</span>
      {mask.map((slot, i) => {
        const filled = i < input.length;
        const showChar = phase === 'unlocked' || filled || !slot.hidden;
        const display = showChar ? slot.char : '_';
        const isActive = phase === 'typing' && i === input.length;
        return (
          <span
            key={i}
            className={[
              'inline-block min-w-[0.7em] text-center transition-colors',
              filled
                ? 'text-zinc-900 dark:text-zinc-50'
                : phase === 'unlocked'
                  ? 'text-sky-700 dark:text-sky-300'
                  : 'text-zinc-400',
              isActive ? 'underline decoration-sky-400 underline-offset-4' : '',
              isActive && hasMistake ? 'text-red-500' : '',
            ].join(' ')}
          >
            {display}
          </span>
        );
      })}
      <span className="text-zinc-400">]</span>
    </span>
  );
}
