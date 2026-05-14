import { Skeleton } from '@/components/ui/skeleton';

export default function ImportLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-7 w-72" />
      <Skeleton className="mt-2 h-4 w-full max-w-xl" />

      <div className="mt-6 space-y-6">
        <SectionSkeleton lines={3} />
        <SectionSkeleton lines={2} />
        <Skeleton className="h-9 w-40" />
      </div>
    </div>
  );
}

function SectionSkeleton({ lines }: { lines: number }) {
  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-3 w-72" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}
