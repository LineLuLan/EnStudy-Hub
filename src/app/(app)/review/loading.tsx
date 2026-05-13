import { Skeleton } from '@/components/ui/skeleton';

export default function ReviewLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-3 w-56" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>

      <div className="mt-6 space-y-5">
        {/* Mode picker pill bar (4 buttons) */}
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-zinc-200 bg-white/60 p-1 dark:border-zinc-800 dark:bg-zinc-950/60">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-md" />
          ))}
        </div>

        {/* Counter + hint row */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Card area */}
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    </div>
  );
}
