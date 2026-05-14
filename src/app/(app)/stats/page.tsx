import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Activity, BarChart3, CalendarClock, PieChart, TrendingUp } from 'lucide-react';
import { getCurrentUserId } from '@/lib/auth/session';
import { getRetention } from '@/features/stats/retention';
import { getActivity } from '@/features/stats/activity';
import { getMaturityCounts } from '@/features/stats/maturity';
import { getStreak } from '@/features/stats/streak';
import { getDueForecast } from '@/features/stats/forecast';
import { RetentionLine } from '@/components/stats/retention-line';
import { ActivityBar } from '@/components/stats/activity-bar';
import { MaturityPie } from '@/components/stats/maturity-pie';
import { DueForecastBar } from '@/components/stats/due-forecast-bar';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Thống kê' };

export default async function StatsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login?next=/stats');

  const [retention, activity, maturity, streak, forecast] = await Promise.all([
    getRetention(userId),
    getActivity(userId),
    getMaturityCounts(userId),
    getStreak(userId),
    getDueForecast(userId),
  ]);

  const totalReviews = activity.total;
  const ratingTotal =
    activity.totalByRating.again +
    activity.totalByRating.hard +
    activity.totalByRating.good +
    activity.totalByRating.easy;
  const accuracy =
    ratingTotal > 0
      ? Math.round(
          ((activity.totalByRating.good + activity.totalByRating.easy) / ratingTotal) * 100
        )
      : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Thống kê
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Theo dõi xu hướng retention, hoạt động ôn tập hàng ngày và phân bổ thẻ.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          icon={<Activity className="h-4 w-4 text-sky-500" />}
          label="Tổng review (30d)"
          value={totalReviews}
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          label="Độ chính xác (30d)"
          value={`${accuracy}%`}
          subtitle={
            ratingTotal > 0
              ? `${activity.totalByRating.good + activity.totalByRating.easy}/${ratingTotal} đúng`
              : '—'
          }
        />
        <MetricCard
          icon={<BarChart3 className="h-4 w-4 text-amber-500" />}
          label="Ngày học"
          value={streak.daysActive}
          subtitle={streak.longest > 0 ? `Kỷ lục ${streak.longest} ngày` : 'Chưa có chuỗi'}
        />
        <MetricCard
          icon={<PieChart className="h-4 w-4 text-zinc-500" />}
          label="Thẻ thuộc"
          value={maturity.mature}
          subtitle={`/ ${maturity.total} tổng`}
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            Retention — độ ổn định trung bình
          </h2>
          <span className="text-xs text-zinc-500">12 tuần qua · đơn vị: ngày</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <RetentionLine data={retention} />
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Đường này thể hiện trung bình <span className="font-mono">state_after.stability</span>{' '}
          theo ngày — đường ổn định hoặc đi lên = thẻ học ngày càng "đậm" trong trí nhớ. Đường đi
          xuống gợi ý FSRS đang reset stability vì relapse nhiều.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            Hoạt động hàng ngày — phân bổ rating
          </h2>
          <span className="text-xs text-zinc-500">30 ngày qua</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <ActivityBar data={activity} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-tight">Phân bổ trạng thái thẻ</h2>
          <span className="text-xs text-zinc-500">snapshot hiện tại</span>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <MaturityPie data={maturity} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold tracking-tight">
            <CalendarClock className="h-4 w-4 text-amber-500" />
            Lịch ôn 7 ngày tới
          </h2>
          <span className="text-xs text-zinc-500">FSRS forecast</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <DueForecastBar data={forecast} />
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Số thẻ đến hạn ôn lại theo lịch FSRS. Thẻ quá hạn từ hôm trước được gộp vào "Hôm nay" để
          không bỏ sót. Thẻ tạm dừng không tính.
        </p>
      </section>

      <div className="text-xs text-zinc-500">
        <Link
          href="/dashboard"
          className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          ← Về dashboard
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
        {value}
      </div>
      {subtitle && <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-500">{subtitle}</p>}
    </div>
  );
}
