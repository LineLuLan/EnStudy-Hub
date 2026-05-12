import { Skeleton } from '@/components/ui/skeleton';

export default function StatsLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      {['Retention', 'Hoạt động hàng ngày', 'Phân bổ trạng thái thẻ'].map((title) => (
        <div key={title} className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <Skeleton className="h-44 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
