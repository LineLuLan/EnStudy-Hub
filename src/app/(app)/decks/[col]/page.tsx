import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Clock, Layers } from 'lucide-react';
import { getCollectionBySlug, getEnrolledLessonIds } from '@/features/vocab/queries';
import { getCurrentUserId } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function CollectionPage({ params }: { params: Promise<{ col: string }> }) {
  const { col } = await params;
  const collection = await getCollectionBySlug(col);
  if (!collection) notFound();

  const userId = await getCurrentUserId();
  const enrolled = userId ? await getEnrolledLessonIds(userId) : new Set<string>();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/decks"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Tất cả bộ sưu tập
      </Link>

      <div className="mt-3">
        <h1 className="text-2xl font-semibold tracking-tight">{collection.name}</h1>
        {collection.description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{collection.description}</p>
        )}
      </div>

      {collection.topics.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">Chưa có chủ đề nào trong bộ sưu tập này.</p>
      ) : (
        <div className="mt-8 space-y-8">
          {collection.topics.map((topic) => (
            <section key={topic.id}>
              <div className="mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-zinc-500" />
                <h2 className="text-lg font-semibold">{topic.name}</h2>
                {topic.description && (
                  <span className="text-xs text-zinc-500">— {topic.description}</span>
                )}
              </div>

              {topic.lessons.length === 0 ? (
                <p className="text-sm text-zinc-500">Chưa có bài học.</p>
              ) : (
                <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                  {topic.lessons.map((lesson) => {
                    const isEnrolled = enrolled.has(lesson.id);
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/decks/${collection.slug}/${topic.slug}/${lesson.slug}`}
                          className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        >
                          <div className="min-w-0">
                            <div className="font-medium">{lesson.name}</div>
                            <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500">
                              <span>{lesson.cardCount} từ</span>
                              {lesson.estimatedMinutes && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {lesson.estimatedMinutes} phút
                                </span>
                              )}
                            </div>
                          </div>
                          {isEnrolled && (
                            <span className="shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300">
                              Đang học
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
