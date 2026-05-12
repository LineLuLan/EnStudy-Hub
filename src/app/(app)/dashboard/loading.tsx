import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      <Skeleton className="h-10 w-48" />

      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-900"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-1.5 w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-5 w-44" />
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </div>
  );
}
