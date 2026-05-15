'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, BookOpen, PlayCircle, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { completeOnboardingTour } from './actions';

type Step = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  hint: string;
};

const STEPS: readonly Step[] = [
  {
    icon: BookOpen,
    title: 'Bộ thẻ — /decks',
    body: 'Bắt đầu với bộ Oxford 3000 đã seed sẵn theo chủ đề. Hoặc tạo bộ riêng bằng cách nhập CSV — mỗi dòng 1 từ, 9 cột (word, ipa, pos, cefr, nghĩa VI/EN, ví dụ, mnemonic).',
    hint: 'Mở bộ → chọn topic → enroll lesson đầu tiên.',
  },
  {
    icon: PlayCircle,
    title: 'Ôn tập — /review',
    body: 'Mỗi ngày app sẽ chọn thẻ due theo thuật toán FSRS. Bốn mini-game: Cloze (đục lỗ), MCQ (chọn nghĩa), Typing (gõ từ), Listening (nghe phát âm). Pick mode trên đầu trang review.',
    hint: 'Phím tắt: Space lật/replay · 1-4 chấm rating · ? gợi ý.',
  },
  {
    icon: BarChart3,
    title: 'Thống kê — /stats',
    body: 'Heatmap 12 tuần ghi nhận streak, retention chart cho thấy thẻ bám lâu, forecast 7 ngày tới giúp lên kế hoạch. Mọi chart là SVG, đọc được trên mọi thiết bị.',
    hint: 'Dashboard có "Tuần này" rollup nhanh — vào ngay sau khi xong tour.',
  },
  {
    icon: Settings,
    title: 'Cài đặt — /settings',
    body: 'Đổi timezone, giới hạn thẻ mới/ngày (mặc định 20), giới hạn ôn/ngày (mặc định 200). Xuất JSON cá nhân hoặc nhập restore. Sign-out trong dropdown topbar.',
    hint: 'Nhấn ? bất kỳ lúc nào để xem lại danh sách phím tắt.',
  },
] as const;

/**
 * First-login onboarding tour. Mounted by `(app)/layout.tsx` chỉ khi
 * `profiles.onboarded_at IS NULL`. Native <dialog> element — reuse pattern
 * từ shortcuts-modal.tsx (zero Radix dep, free Esc + focus trap + backdrop).
 *
 * Bất cứ dismiss path nào (Bắt đầu học / Bỏ qua / Esc / backdrop click) đều
 * call `completeOnboardingTour()` server action → set `onboarded_at = NOW()`
 * → revalidate `/dashboard`. Modal không re-trigger sau reload.
 */
export function TourModal() {
  const router = useRouter();
  const [open, setOpen] = React.useState(true);
  const [step, setStep] = React.useState(0);
  const [pending, startTransition] = React.useTransition();
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const dismissedRef = React.useRef(false);

  React.useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  function dismiss(redirectTo?: string) {
    if (dismissedRef.current) {
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      return;
    }
    dismissedRef.current = true;
    startTransition(async () => {
      await completeOnboardingTour();
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
    });
  }

  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) dismiss();
  }

  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const current = STEPS[step]!;
  const Icon = current.icon;

  return (
    <dialog
      ref={dialogRef}
      onClose={() => dismiss()}
      onClick={handleDialogClick}
      className="max-h-[85vh] w-[min(92vw,520px)] rounded-xl border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/40 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div onClick={(e) => e.stopPropagation()} className="flex flex-col">
        <header className="flex items-center gap-2 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h2 className="text-base font-semibold tracking-tight">Chào mừng tới EnStudy Hub</h2>
          <span className="ml-auto text-xs text-zinc-500">
            Bước {step + 1} / {STEPS.length}
          </span>
        </header>

        <div className="space-y-4 px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-semibold tracking-tight">{current.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {current.body}
              </p>
            </div>
          </div>
          <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <span className="font-medium text-zinc-900 dark:text-zinc-50">Tip:</span> {current.hint}
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 px-5 pb-3">
          {STEPS.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? 'w-6 bg-sky-500'
                  : i < step
                    ? 'w-1.5 bg-sky-300 dark:bg-sky-700'
                    : 'w-1.5 bg-zinc-200 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => dismiss()}
            disabled={pending}
            className="text-xs text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline disabled:opacity-50 dark:hover:text-zinc-50"
          >
            Bỏ qua
          </button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={isFirst || pending}
            >
              Trước
            </Button>
            {isLast ? (
              <Button type="button" size="sm" onClick={() => dismiss('/decks')} disabled={pending}>
                Bắt đầu học
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                disabled={pending}
              >
                Tiếp
              </Button>
            )}
          </div>
        </footer>
      </div>
    </dialog>
  );
}
