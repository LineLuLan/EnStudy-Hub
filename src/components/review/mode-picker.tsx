'use client';

import { Headphones, Keyboard, ListChecks, Pencil } from 'lucide-react';
import type { ReviewMode } from '@/stores/review-session';

type ModeDef = {
  id: ReviewMode;
  label: string;
  Icon: typeof ListChecks;
  enabled: boolean;
  hint?: string;
};

const MODES: ModeDef[] = [
  { id: 'cloze', label: 'Cloze', Icon: Pencil, enabled: true },
  { id: 'mcq', label: 'Trắc nghiệm', Icon: ListChecks, enabled: true },
  { id: 'typing', label: 'Gõ nghĩa', Icon: Keyboard, enabled: false, hint: 'Sắp có' },
  { id: 'listening', label: 'Nghe', Icon: Headphones, enabled: false, hint: 'Sắp có' },
];

export function ModePicker({
  mode,
  onChange,
}: {
  mode: ReviewMode;
  onChange: (mode: ReviewMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Chọn chế độ ôn"
      className="flex flex-wrap gap-1.5 rounded-lg border border-zinc-200 bg-white/60 p-1 dark:border-zinc-800 dark:bg-zinc-950/60"
    >
      {MODES.map(({ id, label, Icon, enabled, hint }) => {
        const isActive = mode === id;
        const base =
          'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors';
        const tone = isActive
          ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50';
        const disabledTone =
          'cursor-not-allowed text-zinc-300 hover:bg-transparent hover:text-zinc-300 dark:text-zinc-700 dark:hover:bg-transparent dark:hover:text-zinc-700';

        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-disabled={!enabled}
            disabled={!enabled}
            title={enabled ? label : `${label} — ${hint ?? ''}`}
            onClick={() => enabled && onChange(id)}
            className={`${base} ${enabled ? tone : disabledTone}`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
            {!enabled && hint && (
              <span className="ml-0.5 rounded bg-zinc-100 px-1 py-0.5 text-[9px] font-normal text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500">
                {hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
