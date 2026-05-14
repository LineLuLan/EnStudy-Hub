import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Clock, BookOpen } from 'lucide-react';
import {
  getLessonByPath,
  getEnrolledLessonIds,
  getUserCardMetaByLesson,
} from '@/features/vocab/queries';
import { getCurrentUserId } from '@/lib/auth/session';
import { CardPreview } from '@/components/decks/card-preview';
import { EnrollButton } from '@/components/decks/enroll-button';

export const dynamic = 'force-dynamic';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ col: string; topic: string; lesson: string }>;
}) {
  const { col, topic, lesson } = await params;
  const userId = await getCurrentUserId();
  const detail = await getLessonByPath(col, topic, lesson, userId);
  if (!detail) notFound();

  const enrolled = userId ? await getEnrolledLessonIds(userId) : new Set<string>();
  const isEnrolled = enrolled.has(detail.id);
  const userMetaByCard =
    userId && isEnrolled ? await getUserCardMetaByLesson(userId, detail.id) : new Map();
  const isEditable = !detail.collection.isOfficial && detail.collection.ownerId === userId;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/decks/${detail.collection.slug}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <ChevronLeft className="h-4 w-4" />
        {detail.collection.name} / {detail.topic.name}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {detail.name}
          </h1>
          {detail.description && (
            <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {detail.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
            <span>{detail.cards.length} từ</span>
            {detail.estimatedMinutes && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {detail.estimatedMinutes} phút
              </span>
            )}
          </div>
        </div>
        <EnrollButton lessonId={detail.id} alreadyEnrolled={isEnrolled} />
      </div>

      {detail.cards.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          <BookOpen className="mx-auto h-6 w-6 text-zinc-400" />
          <p className="mt-3 font-medium text-zinc-700 dark:text-zinc-300">
            Bài này chưa có thẻ từ
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid items-start gap-3 lg:grid-cols-2">
          {detail.cards.map((card) => (
            <li key={card.id}>
              <CardPreview
                card={card}
                userMeta={userMetaByCard.get(card.id)}
                isEditable={isEditable}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
