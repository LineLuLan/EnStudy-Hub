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

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    </div>
  );
}
