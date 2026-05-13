import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, Flame, GraduationCap, Inbox, Play, Sparkles } from 'lucide-react';
import { getCurrentUserId } from '@/lib/auth/session';
import { getStreak } from '@/features/stats/streak';
import { getHeatmap } from '@/features/stats/heatmap';
import { getMaturityCounts } from '@/features/stats/maturity';
import { getReviewQueue } from '@/features/srs/queue';
import { getEnrolledLessonsWithProgress } from '@/features/vocab/queries';
import { Button } from '@/components/ui/button';
import { HeatmapGrid } from '@/components/dashboard/heatmap';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login?next=/dashboard');

  const [streak, heatmap, maturity, queue, enrolled] = await Promise.all([
    getStreak(userId),
    getHeatmap(userId),
    getMaturityCounts(userId),
    getReviewQueue(userId),
    getEnrolledLessonsWithProgress(userId),
  ]);

  const dueTotal = queue.due.length + queue.newCards.length;
  const hasAnyActivity = streak.daysActive > 0 || enrolled.length > 0 || maturity.total > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Tổng quan tiến độ học từ vựng của bạn.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Flame className="h-4 w-4 text-amber-500" />}
          label="Streak"
          value={streak.current}
          suffix="ngày"
          subtitle={
            streak.longest > 0
              ? `Kỷ lục: ${streak.longest} ngày · ${streak.daysActive} ngày học`
              : 'Chưa có chuỗi học liên tục'
          }
          tone="amber"
        />
        <StatCard
          icon={<Inbox className="h-4 w-4 text-sky-500" />}
          label="Cần ôn"
          value={dueTotal}
          suffix="thẻ"
          subtitle={
            dueTotal === 0
              ? 'Đã ôn xong hôm nay'
              : `${queue.due.length} ôn lại · ${queue.newCards.length} thẻ mới · ${queue.meta.newLearnedToday}/${queue.meta.dailyNewLimit} hôm nay`
          }
          tone="sky"
        />
        <StatCard
          icon={<GraduationCap className="h-4 w-4 text-emerald-500" />}
          label="Từ thuộc"
          value={maturity.mature}
          suffix={`/ ${maturity.total}`}
          subtitle={
            maturity.total === 0
              ? 'Chưa có thẻ nào'
              : `${maturity.review} đang ôn · ${maturity.learning + maturity.relearning} đang học`
          }
          tone="emerald"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild disabled={dueTotal === 0}>
          <Link
            href={dueTotal === 0 ? '/decks' : '/review'}
            aria-disabled={dueTotal === 0 ? undefined : undefined}
          >
            <Play className="mr-2 h-4 w-4" />
            {dueTotal === 0 ? 'Thêm bài học mới' : `Bắt đầu ôn tập (${dueTotal})`}
          </Link>
        </Button>
        <Link
          href="/decks"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          Khám phá decks →
        </Link>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-tight">Bài đang học</h2>
          <Link
            href="/decks"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            Tất cả decks →
          </Link>
        </div>
        {enrolled.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <BookOpen className="mx-auto h-6 w-6 text-zinc-400" />
            <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Chưa enroll bài nào
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Vào{' '}
              <Link href="/decks" className="underline underline-offset-2">
                /decks
              </Link>{' '}
              chọn bài đầu tiên để bắt đầu.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-900 dark:border-zinc-800">
            {enrolled.slice(0, 5).map((l) => {
              const pct = l.total > 0 ? Math.round((l.learned / l.total) * 100) : 0;
              return (
                <li key={l.lessonId}>
                  <Link
                    href={`/decks/${l.colSlug}/${l.topicSlug}/${l.lessonSlug}`}
                    className="flex items-center gap-4 p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-medium">{l.lessonName}</span>
                        <span className="shrink-0 text-[11px] text-zinc-500">
                          {l.colName} · {l.topicName}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-full bg-emerald-500 transition-[width]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-zinc-500 tabular-nums">
                          {l.learned}/{l.total || l.cardCount}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-tight">Hoạt động 12 tuần qua</h2>
          {heatmap.total > 0 && (
            <span className="text-xs text-zinc-500">{heatmap.total} thẻ chấm</span>
          )}
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <HeatmapGrid data={heatmap} />
        </div>
      </section>

      {!hasAnyActivity && (
        <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50/60 p-6 text-sm dark:border-sky-900/50 dark:bg-sky-950/30">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
            <div>
              <p className="font-medium text-sky-900 dark:text-sky-200">
                Bắt đầu hành trình của bạn
              </p>
              <p className="mt-1 text-sky-800 dark:text-sky-300">
                Vào{' '}
                <Link href="/decks" className="underline underline-offset-2">
                  /decks
                </Link>{' '}
                để enroll bài đầu tiên, sau đó quay lại{' '}
                <Link href="/review" className="underline underline-offset-2">
                  /review
                </Link>{' '}
                để bắt đầu ôn.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  subtitle,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  subtitle: string;
  tone: 'amber' | 'sky' | 'emerald';
}) {
  const toneRing =
    tone === 'amber'
      ? 'ring-amber-100 dark:ring-amber-900/40'
      : tone === 'sky'
        ? 'ring-sky-100 dark:ring-sky-900/40'
        : 'ring-emerald-100 dark:ring-emerald-900/40';
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white p-4 ring-1 ${toneRing} dark:border-zinc-800 dark:bg-zinc-950`}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
          {value}
        </span>
        {suffix && <span className="text-sm text-zinc-500">{suffix}</span>}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
        {subtitle}
      </p>
    </div>
  );
}
