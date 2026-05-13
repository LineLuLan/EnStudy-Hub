import { Skeleton } from '@/components/ui/skeleton';

export default function DecksLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-4 w-64" />
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-4/5" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
