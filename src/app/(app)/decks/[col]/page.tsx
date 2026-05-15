import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Layers, Sparkles } from 'lucide-react';
import { getCollectionBySlug, getEnrolledLessonIds } from '@/features/vocab/queries';
import { getCurrentUserId } from '@/lib/auth/session';
import { TopicIcon } from '@/components/decks/topic-icon';

export const dynamic = 'force-dynamic';

export default async function CollectionPage({ params }: { params: Promise<{ col: string }> }) {
  const { col } = await params;
  const userId = await getCurrentUserId();
  const collection = await getCollectionBySlug(col, userId);
  if (!collection) notFound();

  const enrolled = userId ? await getEnrolledLessonIds(userId) : new Set<string>();

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/decks"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Tất cả bộ sưu tập
      </Link>

      <div className="mt-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {collection.name}
        </h1>
        {collection.description && (
          <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {collection.description}
          </p>
        )}
      </div>

      {collection.topics.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          <Layers className="mx-auto h-6 w-6 text-zinc-400" />
          <p className="mt-3 font-medium text-zinc-700 dark:text-zinc-300">Bộ này chưa có chủ đề</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collection.topics.map((topic, idx) => {
            const totalCards = topic.lessons.reduce((sum, l) => sum + l.cardCount, 0);
            const enrolledCount = topic.lessons.filter((l) => enrolled.has(l.id)).length;
            const priority = idx + 1;
            const isRecommended = idx < 3;
            const color = topic.color ?? '#6366f1';

            return (
              <Link
                key={topic.id}
                href={`/decks/${collection.slug}/${topic.slug}`}
                className="group relative flex flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:focus-visible:ring-zinc-50"
              >
                {/* Priority number badge */}
                <span
                  className="absolute top-3 right-3 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-zinc-100 px-2 text-[11px] font-semibold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                  aria-label={`Mức ưu tiên ${priority}`}
                >
                  {priority}
                </span>

                {/* Icon */}
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${color}1a`,
                    color: color,
                  }}
                >
                  <TopicIcon name={topic.icon} className="h-6 w-6" />
                </div>

                {/* Recommended badge */}
                {isRecommended && (
                  <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    <Sparkles className="h-2.5 w-2.5" />
                    Khuyến nghị bắt đầu
                  </span>
                )}

                {/* Name */}
                <h2 className="mt-3 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {topic.name}
                </h2>

                {/* Description */}
                {topic.description && (
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {topic.description}
                  </p>
                )}

                {/* Counts */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                  <span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {topic.lessons.length}
                    </span>{' '}
                    bài
                  </span>
                  <span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {totalCards}
                    </span>{' '}
                    từ
                  </span>
                  {enrolledCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Đang học {enrolledCount}/{topic.lessons.length}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
