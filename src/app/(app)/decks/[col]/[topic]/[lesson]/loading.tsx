import { Skeleton } from '@/components/ui/skeleton';

export default function LessonLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <Skeleton className="h-4 w-56" />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <div className="mt-3 flex gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-8 w-32 shrink-0" />
      </div>

      <ul className="mt-6 grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="mt-2 h-3 w-3/4" />
          </li>
        ))}
      </ul>
    </div>
  );
}
