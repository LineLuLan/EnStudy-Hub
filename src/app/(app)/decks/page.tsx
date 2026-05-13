import Link from 'next/link';
import { listOfficialCollections } from '@/features/vocab/queries';
import { BookOpen, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DecksPage() {
  const cols = await listOfficialCollections();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Decks
      </h1>
      <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        Chọn một bộ sưu tập để bắt đầu học.
      </p>

      {cols.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          <BookOpen className="mx-auto h-6 w-6 text-zinc-400" />
          <p className="mt-3 font-medium text-zinc-700 dark:text-zinc-300">
            Chưa có bộ sưu tập nào
          </p>
          <p className="mt-1 text-xs">
            Chạy <code className="font-mono">pnpm seed</code> để nạp content.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {cols.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <Link href={`/decks/${c.slug}`} className="block">
                <div className="flex items-center gap-2 text-base font-semibold tracking-tight">
                  <BookOpen className="h-4 w-4 text-zinc-500" />
                  {c.name}
                </div>
                {c.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {c.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {c.topicCount} chủ đề · {c.lessonCount} bài
                  </span>
                  {c.levelMin && c.levelMax && (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium dark:bg-zinc-900">
                      {c.levelMin}–{c.levelMax}
                    </span>
                  )}
                  {c.isOfficial && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Official
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
