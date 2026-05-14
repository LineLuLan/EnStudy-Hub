import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Layers, Upload, UserCircle2 } from 'lucide-react';
import {
  listOfficialCollections,
  listUserOwnedCollections,
  type CollectionWithCounts,
} from '@/features/vocab/queries';
import { getCurrentUserId } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Decks' };

export default async function DecksPage() {
  const userId = await getCurrentUserId();
  const [official, owned] = await Promise.all([
    listOfficialCollections(),
    userId ? listUserOwnedCollections(userId) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Decks
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Chọn một bộ sưu tập để bắt đầu học.
          </p>
        </div>
        <Link
          href="/decks/import"
          className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          <Upload className="h-4 w-4" />
          Nhập CSV
        </Link>
      </div>

      {owned.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <UserCircle2 className="h-5 w-5 text-zinc-500" />
            <h2 className="text-xl font-semibold tracking-tight">Bộ của bạn</h2>
          </div>
          <CollectionGrid collections={owned} variant="owned" />
        </section>
      )}

      <section className="mt-8">
        {owned.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-zinc-500" />
            <h2 className="text-xl font-semibold tracking-tight">Bộ chính thức</h2>
          </div>
        )}
        {official.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            <BookOpen className="mx-auto h-6 w-6 text-zinc-400" />
            <p className="mt-3 font-medium text-zinc-700 dark:text-zinc-300">
              Chưa có bộ sưu tập nào
            </p>
            <p className="mt-1 text-xs">
              Chạy <code className="font-mono">pnpm seed</code> để nạp content, hoặc{' '}
              <Link href="/decks/import" className="text-sky-600 hover:underline">
                nhập từ CSV
              </Link>
              .
            </p>
          </div>
        ) : (
          <CollectionGrid collections={official} variant="official" />
        )}
      </section>
    </div>
  );
}

function CollectionGrid({
  collections,
  variant,
}: {
  collections: CollectionWithCounts[];
  variant: 'official' | 'owned';
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {collections.map((c) => (
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
              {variant === 'official' && c.isOfficial && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Official
                </span>
              )}
              {variant === 'owned' && (
                <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-900 dark:bg-sky-900/30 dark:text-sky-200">
                  Cá nhân
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
