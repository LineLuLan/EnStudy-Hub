import { CalendarRange, CheckCheck, ListChecks } from 'lucide-react';
import type { WeekSummary } from '@/features/stats/week-summary-utils';

const VN_WEEKDAY_SHORT: Record<number, string> = {
  0: 'CN',
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
};

function formatWeekDay(key: string): string {
  const d = new Date(`${key}T12:00:00Z`);
  return VN_WEEKDAY_SHORT[d.getUTCDay()] ?? '?';
}

export function WeekSummaryCard({ data }: { data: WeekSummary }) {
  const { reviews, accuracy, daysActive, weekStart, weekEnd } = data;
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold tracking-tight">
          <CalendarRange className="h-4 w-4 text-sky-500" />
          Tuần này
        </h2>
        <span className="font-mono text-[11px] text-zinc-500">
          {formatWeekDay(weekStart)} {weekStart} → {formatWeekDay(weekEnd)} {weekEnd}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Metric
          icon={<ListChecks className="h-3.5 w-3.5 text-sky-500" />}
          label="Reviews"
          value={reviews}
          suffix="lượt"
        />
        <Metric
          icon={<CheckCheck className="h-3.5 w-3.5 text-emerald-500" />}
          label="Độ chính xác"
          value={accuracy}
          suffix="%"
          muted={reviews === 0}
        />
        <Metric
          icon={<CalendarRange className="h-3.5 w-3.5 text-amber-500" />}
          label="Ngày học"
          value={daysActive}
          suffix="/ 7"
        />
      </div>

      {reviews === 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
          Chưa có lượt ôn nào trong tuần này. Mở /review để bắt đầu — streak sẽ chạy ngay từ ngày
          đầu.
        </p>
      )}
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  suffix,
  muted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={`text-2xl font-semibold tabular-nums ${
            muted ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-zinc-50'
          }`}
        >
          {value}
        </span>
        {suffix && <span className="text-[11px] text-zinc-500">{suffix}</span>}
      </div>
    </div>
  );
}
