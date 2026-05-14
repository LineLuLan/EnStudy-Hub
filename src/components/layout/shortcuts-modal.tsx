'use client';

import * as React from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Shortcut = {
  keys: readonly string[];
  description: string;
};

type Section = {
  title: string;
  description?: string;
  shortcuts: readonly Shortcut[];
};

const SECTIONS: readonly Section[] = [
  {
    title: 'Toàn cục',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Mở Command Palette (tìm kiếm/điều hướng)' },
      { keys: ['?'], description: 'Mở bảng phím tắt này' },
      { keys: ['Tab'], description: 'Di chuyển focus tới phần tử kế' },
      { keys: ['Shift', 'Tab'], description: 'Di chuyển focus ngược' },
      { keys: ['Esc'], description: 'Đóng modal / huỷ form' },
    ],
  },
  {
    title: 'Ôn tập (/review)',
    description: 'Hoạt động khi đang trong session ôn — không trùng với input đang focus.',
    shortcuts: [
      { keys: ['Space'], description: 'Lật flashcard (mode flashcard fallback)' },
      { keys: ['1'], description: 'Rate "Again" — chưa nhớ, học lại sớm' },
      { keys: ['2'], description: 'Rate "Hard" — nhớ chậm/khó' },
      { keys: ['3'], description: 'Rate "Good" — nhớ bình thường' },
      { keys: ['4'], description: 'Rate "Easy" — nhớ ngay, đẩy due xa hơn' },
      { keys: ['?'], description: 'Reveal 1 ký tự gợi ý (cloze / typing / listening)' },
      { keys: ['Backspace'], description: 'Xoá ký tự vừa gõ' },
      { keys: ['Enter'], description: 'Submit rating khi auto-grade đang đếm ngược' },
    ],
  },
  {
    title: 'Listening mode',
    description: 'Mode nghe (Web Speech API).',
    shortcuts: [{ keys: ['Space'], description: 'Phát lại audio từ' }],
  },
] as const;

/**
 * Renders a small Keyboard icon button in the topbar plus a globally-bound
 * `?` keypress that opens a native <dialog> listing all app shortcuts.
 *
 * Uses the HTML <dialog> element via showModal() — gets native focus trap,
 * backdrop, and Esc-to-close for free. No Radix Dialog primitive needed.
 *
 * The `?` listener is debounced against inputs: if the active element is an
 * input/textarea/contenteditable, we skip so users can type "?" naturally.
 */
export function ShortcutsTrigger() {
  const [open, setOpen] = React.useState(false);
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  // Global `?` keydown → toggle open (unless typing in an input).
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '?') return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }
      e.preventDefault();
      setOpen((v) => !v);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Sync open state → <dialog> show/close. Native dialog handles Esc closing.
  React.useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Backdrop click — native dialog event target is the dialog itself when
  // clicking outside the inner panel; we detect by comparing target ===
  // currentTarget. Inner panel has its own click handler stopping propagation.
  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Phím tắt"
        title="Phím tắt (?)"
        onClick={() => setOpen(true)}
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={handleDialogClick}
        className="max-h-[85vh] w-[min(92vw,640px)] rounded-xl border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/40 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] flex-col">
          <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold tracking-tight">
              <Keyboard className="h-4 w-4 text-sky-500" />
              Phím tắt
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="space-y-6 overflow-y-auto px-5 py-4 text-sm">
            {SECTIONS.map((section) => (
              <section key={section.title} className="space-y-2">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">{section.title}</h3>
                  {section.description && (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                      {section.description}
                    </p>
                  )}
                </div>
                <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200 dark:divide-zinc-900 dark:border-zinc-800">
                  {section.shortcuts.map((s, i) => (
                    <li key={i} className="flex items-center justify-between gap-4 px-3 py-2">
                      <span className="flex-1 text-xs text-zinc-700 dark:text-zinc-300">
                        {s.description}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        {s.keys.map((k, j) => (
                          <kbd
                            key={j}
                            className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                          >
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <footer className="border-t border-zinc-200 px-5 py-3 text-[11px] text-zinc-500 dark:border-zinc-800">
            Nhấn <kbd className="rounded border px-1 font-mono">?</kbd> ở bất kỳ trang nào để mở lại
            bảng này.
          </footer>
        </div>
      </dialog>
    </>
  );
}
