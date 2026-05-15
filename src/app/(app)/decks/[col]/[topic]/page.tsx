import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Clock } from 'lucide-react';
import { getTopicBySlug, getEnrolledLessonIds } from '@/features/vocab/queries';
import { getCurrentUserId } from '@/lib/auth/session';
import { TopicIcon } from '@/components/decks/topic-icon';

export const dynamic = 'force-dynamic';

export default async function TopicPage({
  params,
}: {
  params: Promise<{ col: string; topic: string }>;
}) {
  const { col, topic: topicSlug } = await params;
  const userId = await getCurrentUserId();
  const topic = await getTopicBySlug(col, topicSlug, userId);
  if (!topic) notFound();

  const enrolled = userId ? await getEnrolledLessonIds(userId) : new Set<string>();
  const color = topic.color ?? '#6366f1';
  const totalCards = topic.lessons.reduce((sum, l) => sum + l.cardCount, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/decks/${topic.collection.slug}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <ChevronLeft className="h-4 w-4" />
        {topic.collection.name}
      </Link>

      <div className="mt-3 flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}1a`, color: color }}
        >
          <TopicIcon name={topic.icon} className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {topic.name}
          </h1>
          {topic.description && (
            <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {topic.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
            <span>{topic.lessons.length} bài</span>
            <span>{totalCards} từ</span>
          </div>
        </div>
      </div>

      {topic.lessons.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">Chủ đề này chưa có bài học</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-200 dark:divide-zinc-900 dark:border-zinc-800">
          {topic.lessons.map((lesson, idx) => {
            const isEnrolled = enrolled.has(lesson.id);
            return (
              <li key={lesson.id}>
                <Link
                  href={`/decks/${topic.collection.slug}/${topic.slug}/${lesson.slug}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div className="flex min-w-0 items-baseline gap-3">
                    <span className="w-6 shrink-0 font-mono text-xs text-zinc-400">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium tracking-tight">{lesson.name}</div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                        <span>{lesson.cardCount} từ</span>
                        {lesson.estimatedMinutes && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.estimatedMinutes} phút
                          </span>
                        )}
                      </div>
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
    </div>
  );
}
