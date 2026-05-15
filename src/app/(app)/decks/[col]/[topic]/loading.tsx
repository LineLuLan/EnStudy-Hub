import { Skeleton } from '@/components/ui/skeleton';

export default function TopicLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <Skeleton className="h-4 w-56" />
      <div className="mt-3 flex items-start gap-4">
        <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <div className="mt-3 flex gap-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <ul className="mt-8 divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-200 dark:divide-zinc-900 dark:border-zinc-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex flex-1 items-baseline gap-3">
              <Skeleton className="h-3 w-6" />
              <div className="flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 shrink-0 rounded" />
          </li>
        ))}
      </ul>
    </div>
  );
}
